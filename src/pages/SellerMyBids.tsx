import { useEffect, useState } from 'react';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface MyBid {
  id: string;
  bid_amount: number;
  status: string | null;
  created_at: string;
  project: {
    id: string;
    title: string;
    budget?: number | null;
    budget_type?: string | null;
    category?: string | null;
  } | null;
}

export default function SellerMyBids() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<MyBid[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bids')
          .select('id, bid_amount, status, created_at, project:projects(id, title, budget, budget_type, category)')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (mounted) setBids((data as any) || []);
      } catch (e) {
        if (mounted) setBids([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Bids</h1>
          <Button variant="outline" onClick={() => navigate('/project-search')}>Browse Projects</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : bids.length === 0 ? (
              <div className="text-gray-500">You haven't placed any bids yet.</div>
            ) : (
              <div className="divide-y">
                {bids.map((b) => (
                  <div key={b.id} className="py-4 flex items-start justify-between">
                    <div className="pr-4">
                      <div className="font-medium">
                        <button className="text-blue-600 hover:underline" onClick={() => navigate(`/project/${b.project?.id}`)}>
                          {b.project?.title || 'Untitled project'}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Bid: £{Number(b.bid_amount).toLocaleString()} • {new Date(b.created_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {b.project?.category || 'General'} • {b.project?.budget_type || 'Fixed'} • £{Number(b.project?.budget || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <Badge variant={b.status === 'accepted' ? 'default' : b.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {b.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </SellerDashboardLayout>
  );
}
