import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

const getBaseUrl = (event) => {
  const envUrl = process.env.FRONTEND_URL || process.env.URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  const headers = event.headers || {};
  const protocol = headers['x-forwarded-proto'] || 'https';
  const host = headers.host;
  if (!host) return 'http://localhost:5173';
  return `${protocol}://${host}`;
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (!stripe || !supabase) {
    return jsonResponse(500, { error: 'Server payment configuration is missing' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { type, planSlug, userId } = body;

    if (!type || !userId) {
      return jsonResponse(400, { error: 'Missing type or userId' });
    }

    const baseUrl = getBaseUrl(event);
    let session;

    if (type === 'buyer_pro') {
      const { data: plan, error } = await supabase
        .from('plans')
        .select('id, name, price_cents, billing_interval')
        .eq('slug', 'buyer-pro')
        .eq('is_active', true)
        .single();

      if (error || !plan) {
        return jsonResponse(400, { error: 'Buyer Pro plan not found' });
      }

      const unitAmount = plan.price_cents || 0;
      const interval = plan.billing_interval || 'month';

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: unitAmount,
              recurring: { interval },
              product_data: {
                name: plan.name || 'Buyer Pro Membership',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/plans?status=success`,
        cancel_url: `${baseUrl}/plans?status=cancelled`,
        metadata: {
          type: 'buyer_pro',
          user_id: userId,
          plan_id: plan.id,
          plan_slug: 'buyer-pro',
        },
      });
    } else if (type === 'tokens') {
      if (!planSlug) {
        return jsonResponse(400, { error: 'planSlug is required for token purchases' });
      }

      const { data: plan, error } = await supabase
        .from('token_plans')
        .select('id, name, tokens')
        .eq('slug', planSlug)
        .eq('is_active', true)
        .single();

      if (error || !plan) {
        return jsonResponse(400, { error: 'Token plan not found' });
      }

      const tokenPriceGbp = 5;
      const amountGbp = plan.tokens * tokenPriceGbp;
      const amountPence = Math.round(amountGbp * 100);

      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: amountPence,
              product_data: {
                name: `${plan.tokens} Tokens`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/seller/tokens?status=success`,
        cancel_url: `${baseUrl}/seller/tokens?status=cancelled`,
        metadata: {
          type: 'tokens',
          user_id: userId,
          plan_id: plan.id,
          plan_slug: planSlug,
          tokens: String(plan.tokens),
          amount_gbp: String(amountGbp),
        },
      });
    } else if (type === 'seller_plus') {
      const slug = planSlug || 'seller-plus';

      const { data: plan, error } = await supabase
        .from('token_plans')
        .select('id, name, price')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !plan) {
        return jsonResponse(400, { error: 'Seller Plus plan not found' });
      }

      const amountGbp = Number(plan.price || 0);
      const amountPence = Math.round(amountGbp * 100);

      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              unit_amount: amountPence,
              recurring: { interval: 'month' },
              product_data: {
                name: plan.name || 'Seller Plus',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/seller/dashboard?status=seller_plus_success`,
        cancel_url: `${baseUrl}/seller/tokens?status=cancelled`,
        metadata: {
          type: 'seller_plus',
          user_id: userId,
          plan_slug: slug,
        },
      });
    } else {
      return jsonResponse(400, { error: 'Unsupported purchase type' });
    }

    return jsonResponse(200, { url: session.url });
  } catch (error) {
    console.error('Error creating Stripe checkout session', error);
    return jsonResponse(500, { error: 'Failed to create checkout session' });
  }
};
