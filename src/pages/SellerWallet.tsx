import { useEffect, useState, useMemo } from 'react';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Coins, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface PurchaseRow {
  id: string;
  tokens: number;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  plan?: { name?: string } | null;
}

interface SpendRow {
  id: string;
  created_at: string;
  project?: { id?: string; title?: string } | null;
}

export default function SellerWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState({ balance: true, purchases: true, spends: true });
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [spends, setSpends] = useState<SpendRow[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('bid_tokens')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setBalance(data?.bid_tokens ?? 0);
      } finally {
        setLoading((p) => ({ ...p, balance: false }));
      }
    };

    const fetchPurchases = async () => {
      try {
        const { data, error } = await supabase
          .from('token_purchases')
          .select(`id, tokens, amount, currency, status, created_at, plan:token_plans(name)`) 
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(25);
        if (error) throw error;
        setPurchases(data || []);
      } finally {
        setLoading((p) => ({ ...p, purchases: false }));
      }
    };

    const fetchSpends = async () => {
      try {
        const { data, error } = await supabase
          .from('bids')
          .select(`id, created_at, project:projects(id, title)`) 
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setSpends(data || []);
      } finally {
        setLoading((p) => ({ ...p, spends: false }));
      }
    };

    fetchBalance();
    fetchPurchases();
    fetchSpends();
  }, [user?.id]);

  const totals = useMemo(() => {
    const purchased = purchases.reduce((s, x) => s + (x.tokens || 0), 0);
    const spent = spends.length; // 1 token per bid
    return { purchased, spent };
  }, [purchases, spends]);

  const fmt = (d: string) => new Date(d).toLocaleString();

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Coins className="h-5 w-5 mr-2 text-yellow-500"/>Token Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Current Balance</div>
                  {loading.balance ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-3xl font-bold text-blue-600">{balance}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Purchased</div>
                  {loading.purchases ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-3xl font-bold text-green-600">{totals.purchased}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                  {loading.spends ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-3xl font-bold text-red-600">{totals.spent}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ArrowDownCircle className="h-5 w-5 mr-2 text-green-600"/>Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.purchases ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-gray-500">No purchases yet.</div>
              ) : (
                <div className="space-y-3">
                  {purchases.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{p.plan?.name || 'Token Plan'}</div>
                        <div className="text-xs text-gray-500">{fmt(p.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">+{p.tokens} tokens</div>
                        <div className="text-xs text-gray-500">£{Number(p.amount).toFixed(2)} {p.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ArrowUpCircle className="h-5 w-5 mr-2 text-red-600"/>Spends (Bids)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.spends ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : spends.length === 0 ? (
                <div className="text-gray-500">No token spends yet.</div>
              ) : (
                <div className="space-y-3">
                  {spends.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div>
                        <div className="font-medium">{s.project?.title || 'Bid placed'}</div>
                        <div className="text-xs text-gray-500">{fmt(s.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">-1 token</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </SellerDashboardLayout>
  );
}
