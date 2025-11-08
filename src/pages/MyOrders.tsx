import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { DashboardLayout } from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import {
  ArrowLeft,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  MapPin,
  Calendar,
  Eye,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [reviewForOrderId, setReviewForOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      console.log('=== MYORDERS useEffect triggered ===');
      console.log('MyOrders user object:', user);
      console.log('MyOrders user?.id:', user?.id);
      console.log('MyOrders user?.email:', user?.email);
      
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date, completed_at, delivered_at, buyer_accepted')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('MyOrders: Orders query result:', { data: data, error: error, length: data?.length });
      
      if (!error && mounted) setOrders(data || []);
      // load existing reviews for these orders by this buyer for late-review visibility
      const orderIds = (data || []).map(o => o.id);
      if (orderIds.length) {
        const { data: revs } = await supabase
          .from('reviews')
          .select('order_id')
          .in('order_id', orderIds)
          .eq('reviewer_id', user.id);
        const map: Record<string, boolean> = {};
        ((revs as any[]) || []).forEach(r => { map[r.order_id] = true; });
        if (mounted) setReviewedOrders(map);
      } else {
        if (mounted) setReviewedOrders({});
      }
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel('buyer_my_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `buyer_id=eq.${user?.id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const displayOrders = useMemo(() => orders.map(o => ({
    id: o.id,
    title: o.title,
    provider: { name: o.provider_id, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${o.provider_id}`, rating: 0, reviews: 0 },
    status: o.status as string,
    progress: o.status === 'completed' ? 100 : o.status === 'revision' ? 60 : 75,
    amount: o.price || 0,
    type: 'Custom',
    deadline: o.delivery_date || o.created_at,
    lastUpdate: new Date(o.created_at).toLocaleDateString(),
    review: null,
    rating: 0,
    completedDate: o.completed_at || o.delivered_at,
    delivered_at: o.delivered_at,
    buyer_accepted: o.buyer_accepted,
    provider_id: o.provider_id,
  })), [orders]);

  const activeOrders = displayOrders.filter(o => o.status !== 'completed');
  const completedOrders = displayOrders.filter(o => o.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'revision': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const acceptDelivery = async (id: string) => {
    if (!window.confirm('Once you accept delivery, the order will be marked complete. Please accept only if the order is complete. Continue?')) return;
    try {
      setAcceptingId(id);
      const completedAt = new Date().toISOString();
      const { error } = await (supabase.from('orders') as any)
        .update({ buyer_accepted: true, status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === id
            ? { ...order, buyer_accepted: true, status: 'completed', completed_at: completedAt }
            : order
        )
      );
      // Prompt review after successful acceptance
      setReviewForOrderId(id);
      setReviewRating(5);
      setReviewText('');
    } catch (err) {
      console.error('Failed to accept delivery', err);
      alert('Failed to accept delivery. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const submitReview = async (orderId: string, providerId: string) => {
    if (!user?.id) return;
    try {
      setSubmittingReview(true);
      await (supabase.from('reviews') as any).insert({
        order_id: orderId,
        reviewer_id: user.id,
        reviewee_id: providerId,
        rating: reviewRating,
        comment: reviewText || null,
      });

      // Update seller's rating and review count using the centralized function
      const { updateSellerRating } = await import('../hooks/useProjects');
      await updateSellerRating(providerId);

      // Create notification for the seller
      const { notifyReviewSubmitted } = await import('../lib/notifications');
      const { data: userData } = await supabase.auth.getUser();
      const reviewerName = userData.user?.user_metadata?.name || userData.user?.email || 'A buyer';
      await notifyReviewSubmitted(providerId, reviewerName, reviewRating);

      setReviewForOrderId(null);
      setReviewText('');
      setReviewedOrders(prev => ({ ...prev, [orderId]: true }));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-600">
              Track your active orders and view completed projects.
            </p>
          </div>
        </div>

        {/* Order Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">£{[...activeOrders, ...completedOrders].reduce((sum, order) => sum + (order.amount || 0), 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold flex items-center">
                    {(completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / completedOrders.length).toFixed(1)}
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 ml-1" />
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="space-y-6">
              {activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold">{order.title}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              £{order.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{order.type}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <img src={order.provider.avatar} alt={order.provider.name} />
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.provider.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                {order.provider.rating} ({order.provider.reviews} reviews)
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{order.progress}%</span>
                          </div>
                          <Progress value={order.progress} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(order.deadline).toLocaleDateString()}
                        </div>
                        <div>Last update: {order.lastUpdate}</div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/messages?chatWith=${order.provider_id}`)}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        {order.delivered_at && !order.buyer_accepted && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 disabled:opacity-60" disabled={acceptingId === order.id} onClick={() => acceptDelivery(order.id)}>
                            {acceptingId === order.id ? 'Accepting...' : 'Accept Delivery'}
                          </Button>
                        )}
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                    {reviewForOrderId === order.id && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="mb-2 font-medium">Rate your experience</div>
                        <div className="flex items-center space-x-2 mb-3">
                          <input type="number" min={1} max={5} value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                          <span className="text-sm text-gray-600">1-5</span>
                        </div>
                        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a short review (optional)" className="w-full border rounded px-3 py-2 mb-3" rows={3} />
                        <div className="flex space-x-2">
                          <Button size="sm" className="disabled:opacity-60" disabled={submittingReview} onClick={() => submitReview(order.id, order.provider_id)}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReviewForOrderId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {activeOrders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Orders</h3>
                    <p className="text-gray-500 mb-4">
                      You don't have any active orders at the moment.
                    </p>
                    <Button onClick={() => navigate('/post-project')}>
                      Post a New Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-6">
              {completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold">{order.title}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              £{order.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{order.type}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <img src={order.provider.avatar} alt={order.provider.name} />
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.provider.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                {order.provider.rating} ({order.provider.reviews} reviews)
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>

                        {order.review && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              {[...Array(order.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              <span className="ml-2 text-sm font-medium">Your Review</span>
                            </div>
                            <p className="text-gray-700 italic">"{order.review}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          Completed on {new Date(order.completedDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          View Files
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact Again
                        </Button>
                        {!reviewedOrders[order.id] && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setReviewForOrderId(order.id); setReviewRating(5); setReviewText(''); }}>
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                    {reviewForOrderId === order.id && (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="mb-2 font-medium">Rate your experience</div>
                        <div className="flex items-center space-x-2 mb-3">
                          <input type="number" min={1} max={5} value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                          <span className="text-sm text-gray-600">1-5</span>
                        </div>
                        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a short review (optional)" className="w-full border rounded px-3 py-2 mb-3" rows={3} />
                        <div className="flex space-x-2">
                          <Button size="sm" className="disabled:opacity-60" disabled={submittingReview} onClick={() => submitReview(order.id, order.provider_id)}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReviewForOrderId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {completedOrders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Completed Orders</h3>
                    <p className="text-gray-500">
                      Your completed orders will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
