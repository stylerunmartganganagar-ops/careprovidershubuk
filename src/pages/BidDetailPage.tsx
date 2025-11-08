import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { supabase } from '../lib/supabase';
import { ArrowLeft, MapPin, Star, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

export default function BidDetailPage() {
  const { projectId, bidId } = useParams<{ projectId: string; bidId: string }>();
  const navigate = useNavigate();
  const [bid, setBid] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bids')
          .select(`
            *,
            seller:users!bids_seller_id_fkey (
              id, name, username, avatar, rating, review_count, location
            )
          `)
          .eq('id', bidId)
          .single();
        if (error) throw error;
        if (mounted) setBid(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load bid');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (bidId) load();
    return () => { mounted = false; };
  }, [bidId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8"><div className="text-center py-12">Loading bid...</div></div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error || !bid) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-red-600">{error || 'Bid not found'}</div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bid Details</h1>
            <p className="text-sm text-gray-600">Project ID: {projectId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <img src={bid.seller?.avatar} alt={bid.seller?.name} />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{bid.seller?.username || 'Unknown Seller'}</div>
                      <div className="flex items-center text-xs text-gray-600 gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{(bid.seller?.rating || 0).toFixed(1)}</span>
                        <span>({bid.seller?.review_count || 0})</span>
                      </div>
                    </div>
                    {bid.seller?.location && (
                      <div className="flex items-center text-sm text-gray-600 gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{bid.seller.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bid</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600">£{bid.bid_amount}</Badge>
                  <Badge>{bid.status}</Badge>
                </div>
                {bid.message && (
                  <div>
                    <div className="text-sm font-medium mb-1">Message</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{bid.message}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Submitted on {new Date(bid.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => navigate(`/messages?chatWith=${bid.seller_id}`)}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Message Seller
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/seller/${bid.seller_id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Visit Seller Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
