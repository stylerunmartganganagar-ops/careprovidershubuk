import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';
import { BuyerRatingDialog } from '../components/BuyerRatingDialog';

interface OrderRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: 'pending' | 'in_progress' | 'revision' | 'completed' | 'cancelled';
  buyer_id: string;
  provider_id: string;
  delivery_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function OrderDeliveryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [buyerRated, setBuyerRated] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState<{name: string} | null>(null);

  const isSeller = user && order ? user.id === order.provider_id : false;
  const isBuyer = user && order ? user.id === order.buyer_id : false;

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;

        const orderData = data as OrderRow;
        if (active) setOrder(orderData);

        // Load buyer information if user is seller
        if (user && orderData && user.id === orderData.provider_id) {
          const { data: buyerData } = await supabase
            .from('users')
            .select('name')
            .eq('id', orderData.buyer_id)
            .single();

          if (buyerData) {
            setBuyerInfo(buyerData);
          }

          // Check if buyer has already been rated
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('buyer_rating')
            .eq('order_id', id)
            .not('buyer_rating', 'is', null)
            .single();

          setBuyerRated(!!reviewData);
        }
      } catch (e) {
        console.error('Failed to load order', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const handleDeliverAndComplete = async () => {
    if (!user || !order) return;
    if (!deliveryNote.trim()) {
      alert('Please add a delivery note.');
      return;
    }
    try {
      setSubmittingDelivery(true);
      // 1) Record a delivery message linked to the order
      await (supabase.from('messages') as any).insert({
        sender_id: user.id,
        receiver_id: order.buyer_id,
        order_id: order.id,
        content: `DELIVERY:\n${deliveryNote}`,
        is_read: false,
      });
      // 2) Mark order as completed
      const { error: updErr } = await (supabase.from('orders') as any)
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', order.id);
      if (updErr) throw updErr;
      // reload
      const { data } = await supabase.from('orders').select('*').eq('id', order.id).single();
      setOrder(data as OrderRow);
      setDeliveryNote('');
    } catch (e) {
      console.error('Delivery failed', e);
      alert('Failed to submit delivery.');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !order) return;
    if (!reviewText.trim()) {
      alert('Please write a short review.');
      return;
    }
    try {
      setSubmittingReview(true);
      const { error } = await (supabase.from('reviews') as any).insert({
        order_id: order.id,
        reviewer_id: user.id,
        reviewee_id: order.provider_id,
        rating: rating,
        comment: reviewText,
      });
      if (error) throw error;
      setReviewText('');
      alert('Thank you for your review!');
    } catch (e) {
      console.error('Review submit failed', e);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="max-w-5xl mx-auto px-4 py-8">Order not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Delivery</span>
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold">{order.title}</div>
              {order.description && (
                <div className="text-gray-600 whitespace-pre-wrap">{order.description}</div>
              )}
              <div className="text-sm text-gray-500">
                Created: {new Date(order.created_at).toLocaleString()}
              </div>
              {order.completed_at && (
                <div className="text-sm text-green-600">
                  Completed: {new Date(order.completed_at).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isSeller && order.status !== 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryNote">Delivery Note</Label>
                <Textarea
                  id="deliveryNote"
                  placeholder="Describe what you are delivering, include links or attachments as URLs"
                  rows={6}
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleDeliverAndComplete} disabled={submittingDelivery}>
                  {submittingDelivery ? 'Submitting...' : 'Deliver & Mark Complete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isBuyer && order.status === 'completed' && (
          <Card>
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex items-center space-x-2">
                  {[1,2,3,4,5].map((r) => (
                    <Button key={r} type="button" variant={r <= rating ? 'default' : 'outline'} size="sm" onClick={() => setRating(r)}>
                      <Star className={`h-4 w-4 ${r <= rating ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review">Review</Label>
                <Textarea
                  id="review"
                  placeholder="Share your experience with the seller's delivery"
                  rows={5}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isSeller && order.status === 'completed' && !buyerRated && buyerInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Rate Your Buyer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                How was your experience working with {buyerInfo.name}? Your feedback helps maintain quality standards.
              </p>
              <BuyerRatingDialog
                orderId={order.id}
                buyerId={order.buyer_id}
                buyerName={buyerInfo.name}
                onRatingSubmitted={() => {
                  setBuyerRated(true);
                }}
                trigger={
                  <Button className="w-full">
                    Rate Buyer
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {isSeller && order.status === 'completed' && buyerRated && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center text-green-600">
                <Star className="h-5 w-5 mr-2 fill-current" />
                <span className="font-medium">Buyer rated successfully!</span>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      <Footer />
    </div>
  );
}
