import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Crown, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Plans() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', 'buyer-pro')
          .eq('is_active', true)
          .single();
        if (error) throw error;
        setPlan(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, []);

  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error('Please login to buy Pro');
      return;
    }
    if (!plan?.id) return;

    setPurchasing(true);
    try {
      const { data: existing, error: existingErr } = await supabase
        .from('buyer_subscriptions')
        .select('id, status')
        .eq('buyer_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (existing) {
        toast.success('You already have an active Pro subscription');
        return;
      }

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'buyer_pro',
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to start payment');
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Missing Stripe checkout URL');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to start payment');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-7 w-7 text-yellow-500" />
            Buyer Pro Membership
          </h1>
          <Badge variant="outline" className="text-sm">Premium</Badge>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why go Pro?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Quicker approvals for your projects</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Premium buyer crown badge shown to sellers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Increased project visibility and priority placement</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Priority support</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" /> Trust signal to sellers for faster responses</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pro Plan</span>
              {!loading && plan ? (
                <span className="text-2xl font-bold">£{(plan.price_cents/100).toFixed(2)}<span className="text-base font-medium text-gray-500">/{plan.billing_interval}</span></span>
              ) : (
                <span className="text-gray-500">Loading price...</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-gray-600">{plan?.description || 'Premium membership for buyers with priority benefits.'}</p>
              </div>
              <Button onClick={handlePurchase} disabled={purchasing || loading} className="min-w-[180px]">
                {purchasing ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Processing</>) : 'Get Pro'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
