import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (!stripe || !supabase || !stripeWebhookSecret) {
    return jsonResponse(500, { error: 'Server webhook configuration is missing' });
  }

  const signature = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, stripeWebhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error);
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`,
    };
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const metadata = session.metadata || {};
      const type = metadata.type;
      const userId = metadata.user_id;

      if (!userId || !type) {
        return jsonResponse(200, { received: true });
      }

      if (type === 'tokens') {
        const planSlug = metadata.plan_slug;
        const tokens = Number(metadata.tokens || '0');
        const amountGbp = Number(metadata.amount_gbp || '0');

        if (!planSlug || !tokens || !amountGbp) {
          return jsonResponse(200, { received: true });
        }

        const { data: plan, error: planError } = await supabase
          .from('token_plans')
          .select('id')
          .eq('slug', planSlug)
          .maybeSingle();

        if (planError) {
          console.error('Error fetching token plan in webhook', planError);
          throw planError;
        }

        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('bid_tokens')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user bid_tokens in webhook', userError);
          throw userError;
        }

        const current = userRow?.bid_tokens || 0;
        const newBalance = current + tokens;

        const { error: updateError } = await supabase
          .from('users')
          .update({ bid_tokens: newBalance })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user bid_tokens in webhook', updateError);
          throw updateError;
        }

        const { error: insertError } = await supabase
          .from('token_purchases')
          .insert({
            seller_id: userId,
            plan_id: plan?.id || null,
            tokens,
            amount: amountGbp,
            currency: 'GBP',
            status: 'completed',
            metadata: {
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent || null,
            },
          });

        if (insertError) {
          console.error('Error inserting token purchase in webhook', insertError);
          throw insertError;
        }
      } else if (type === 'buyer_pro') {
        const planId = metadata.plan_id;

        if (!planId) {
          return jsonResponse(200, { received: true });
        }

        const { data: existing, error: existingError } = await supabase
          .from('buyer_subscriptions')
          .select('id, status')
          .eq('buyer_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (existingError) {
          console.error('Error checking existing buyer subscription in webhook', existingError);
          throw existingError;
        }

        if (!existing) {
          const { error: insertError } = await supabase
            .from('buyer_subscriptions')
            .insert({
              buyer_id: userId,
              plan_id: planId,
              status: 'active',
            });

          if (insertError) {
            console.error('Error inserting buyer subscription in webhook', insertError);
            throw insertError;
          }
        }
      } else if (type === 'seller_plus') {
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setDate(endsAt.getDate() + 30);

        const { data: existing, error: existingError } = await supabase
          .from('seller_subscriptions')
          .select('id, status, ends_at')
          .eq('seller_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (existingError) {
          console.error('Error checking existing seller subscription in webhook', existingError);
          throw existingError;
        }

        if (!existing || (existing.ends_at && new Date(existing.ends_at) <= now)) {
          const { error: insertError } = await supabase
            .from('seller_subscriptions')
            .insert({
              seller_id: userId,
              status: 'active',
              plan_slug: 'seller-plus',
              ends_at: endsAt.toISOString(),
            });

          if (insertError) {
            console.error('Error inserting seller subscription in webhook', insertError);
            throw insertError;
          }
        }

        try {
          await supabase.rpc('mark_services_featured_for_seller', { _seller: userId });
        } catch (rpcError) {
          console.error('Error calling mark_services_featured_for_seller in webhook', rpcError);
        }
      }
    }

    return jsonResponse(200, { received: true });
  } catch (error) {
    console.error('Stripe webhook handler error', error);
    return jsonResponse(500, { error: 'Webhook handler failed' });
  }
};
