import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Coins, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Footer } from '../components/Footer';

type TokenPlan = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tokens: number;
  price: number;
  currency: string;
  is_popular: boolean;
  is_active: boolean;
};

type TokenPurchase = {
  id: string;
  tokens: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  plan: {
    name: string;
  };
};

export default function TokenPurchasePage() {
  const { user } = useAuth();
  const TOKEN_PRICE_GBP = 5;
  const [tokenPlans, setTokenPlans] = useState<TokenPlan[]>([]);
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState({
    plans: true,
    purchases: true,
    balance: true,
  });
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [detailsPlan, setDetailsPlan] = useState<TokenPlan | null>(null);

  // Fetch token plans
  useEffect(() => {
    const fetchTokenPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('token_plans')
          .select('*')
          .eq('is_active', true)
          .order('tokens', { ascending: true });

        if (error) {
          throw error;
        }
        setTokenPlans(data || []);
      } catch (error: any) {
        console.error('Error fetching token plans:', error);
        toast.error('Failed to load token plans');
      } finally {
        setLoading((prev) => ({ ...prev, plans: false }));
      }
    };

    fetchTokenPlans();
  }, []);

  // Fetch user's token balance
  useEffect(() => {
    if (!user?.id) return;

    const fetchTokenBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('bid_tokens')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setTokenBalance(data?.bid_tokens ?? 0);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        toast.error('Failed to load token balance');
      } finally {
        setLoading(prev => ({ ...prev, balance: false }));
      }
    };

    fetchTokenBalance();
  }, [user?.id]);

  // Fetch purchase history
  useEffect(() => {
    if (!user?.id) return;

    const fetchPurchaseHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('token_purchases')
          .select(`
            id,
            tokens,
            amount,
            currency,
            status,
            created_at,
            plan:token_plans(name)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setPurchases(data || []);
      } catch (error) {
        console.error('Error fetching purchase history:', error);
        toast.error('Failed to load purchase history');
      } finally {
        setLoading(prev => ({ ...prev, purchases: false }));
      }
    };

    fetchPurchaseHistory();
  }, [user?.id]);

  const handlePurchase = async (planSlug: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to purchase tokens');
      return;
    }

    setPurchasingPlan(planSlug);

    try {
      const plan = tokenPlans.find((p) => p.slug === planSlug);
      if (!plan) throw new Error('Plan not found');

      // Special case: Seller Plus subscription
      if (plan.slug === 'seller-plus') {
        // Prevent duplicate
        const { data: existing, error: existErr } = await supabase
          .from('seller_subscriptions')
          .select('id, status, ends_at')
          .eq('seller_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (existErr) throw existErr;
        if (existing && (!existing.ends_at || new Date(existing.ends_at) > new Date())) {
          toast.success('Seller Plus already active');
          return;
        }

        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + 30);
        const { error: insErr } = await supabase
          .from('seller_subscriptions')
          .insert({ seller_id: user.id, status: 'active', plan_slug: 'seller-plus', ends_at: endsAt.toISOString() });
        if (insErr) throw insErr;
        try { await (supabase as any).rpc('mark_services_featured_for_seller', { _seller: user.id }); } catch {}
        toast.success('Seller Plus activated! Your services are now featured.');
        return;
      }

      // Simulate a short processing delay (gateway-less flow)
      await new Promise((res) => setTimeout(res, 900));

      // Update user's token balance
      const { data: updatedUser, error: updateErr } = await supabase
        .from('users')
        .update({ bid_tokens: tokenBalance + plan.tokens })
        .eq('id', user.id)
        .select('bid_tokens')
        .single();
      if (updateErr) throw updateErr;

      // Record the purchase for audit/history
      const amount = plan.tokens * TOKEN_PRICE_GBP;
      const { data: purchaseRow, error: insertErr } = await supabase
        .from('token_purchases')
        .insert({
          seller_id: user.id,
          plan_id: plan.id,
          tokens: plan.tokens,
          amount: amount,
          currency: 'GBP',
          status: 'completed',
        })
        .select('id, created_at')
        .single();
      if (insertErr) throw insertErr;

      // Update local state
      setTokenBalance(updatedUser?.bid_tokens ?? tokenBalance + plan.tokens);
      setPurchases((prev) => [
        {
          id: purchaseRow?.id || Date.now().toString(),
          tokens: plan.tokens,
          amount: amount,
          currency: 'GBP',
          status: 'completed',
          created_at: purchaseRow?.created_at || new Date().toISOString(),
          plan: { name: plan.name },
        },
        ...prev,
      ]);

      toast.success(`Successfully purchased ${plan.tokens} tokens!`);
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to process purchase');
    } finally {
      setPurchasingPlan(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SellerDashboardLayout>
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Token Balance Card */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Coins className="h-6 w-6 mr-2 text-yellow-500" />
                  Your Token Balance
                </h2>
                <p className="text-gray-600 mt-1">
                  Use tokens to place bids on projects and boost your visibility
                </p>
              </div>
              <div className="text-center md:text-right">
                {loading.balance ? (
                  <Skeleton className="h-10 w-32 mx-auto md:mx-0" />
                ) : (
                  <>
                    <div className="text-4xl font-bold text-blue-600">{tokenBalance}</div>
                    <p className="text-sm text-gray-500">tokens available</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Plans */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Zap className="h-6 w-6 mr-2 text-orange-500" />
          Available Token Plans
        </h2>
        
        {loading.plans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : tokenPlans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No token plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokenPlans.map((plan) => {
              const isSellerPlus = plan.slug === 'seller-plus';
              const planPrice = isSellerPlus ? plan.price : (plan.tokens * TOKEN_PRICE_GBP);
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    plan.is_popular ? 'border-2 border-yellow-400' : 'border-gray-200'
                  }`}
                >
                {plan.is_popular && (
                  <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-gray-600 text-sm">{isSellerPlus ? 'Feature all your gigs for 30 days' : plan.description}</p>
                </CardHeader>
                <CardContent>
                  {isSellerPlus ? (
                    <>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">Seller Plus</span>
                        <span className="text-gray-500 ml-2">subscription</span>
                      </div>
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-blue-600">£{Number(planPrice).toFixed(2)}</span>
                        <span className="text-gray-500 ml-1">per month</span>
                      </div>
                      <ul className="text-sm text-gray-700 space-y-2 mb-4">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> All your services become Featured</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> Top placement in categories and homepage</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> Featured badge on your gigs</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600"/> 30-day duration, auto-expire</li>
                      </ul>
                      <Button variant="outline" size="sm" onClick={() => { setDetailsPlan(plan); setDetailsOpen(true); }}>View Details</Button>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">{plan.tokens}</span>
                        <span className="text-gray-500 ml-1">tokens</span>
                      </div>
                      <div className="flex items-baseline mb-6">
                        <span className="text-4xl font-bold text-blue-600">£{planPrice.toFixed(2)}</span>
                        <span className="text-gray-500 ml-1">one-time</span>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handlePurchase(plan.slug)}
                    disabled={purchasingPlan === plan.slug}
                  >
                    {purchasingPlan === plan.slug ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      isSellerPlus ? 'Buy Seller Plus' : `Buy ${plan.tokens} Tokens`
                    )}
                  </Button>
                </CardFooter>
              </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Purchase History */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Purchase History</h2>
        {loading.purchases ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No purchase history yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{purchase.plan?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{purchase.tokens}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {purchase.currency} {purchase.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          purchase.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(purchase.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
    <Footer />
    {detailsOpen && detailsPlan?.slug === 'seller-plus' && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Seller Plus Details</h3>
            <p className="text-sm text-gray-600 mt-1">Everything included in your featured subscription</p>
          </div>
          <div className="p-6 space-y-3 text-gray-700">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/> Feature all your gigs across the site</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/> Top placement in category pages and homepage Featured</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/> Visible Featured badge to buyers</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/> 30 days active from activation time</div>
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600"/> Auto-expire with no lock-in contract</div>
            <div className="pt-2 text-sm text-gray-500">Price: £{Number(detailsPlan.price).toFixed(2)} per month</div>
          </div>
          <div className="p-6 border-t flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            <Button onClick={() => { setDetailsOpen(false); handlePurchase('seller-plus'); }}>Buy Seller Plus</Button>
          </div>
        </div>
      </div>
    )}
    </SellerDashboardLayout>
  );
}
