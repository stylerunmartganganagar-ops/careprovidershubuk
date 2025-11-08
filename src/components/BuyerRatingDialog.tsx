import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';
import { Star, User, MessageSquare } from 'lucide-react';

interface BuyerRatingDialogProps {
  orderId: string;
  buyerId: string;
  buyerName: string;
  trigger: React.ReactNode;
  onRatingSubmitted?: () => void;
}

export function BuyerRatingDialog({
  orderId,
  buyerId,
  buyerName,
  trigger,
  onRatingSubmitted
}: BuyerRatingDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      // Check if a review already exists for this order
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .single();

      const updateData = {
        ...(existingReview ? {} : {
          order_id: orderId,
          reviewer_id: buyerId,
          reviewee_id: buyerId,
          rating: 5, // Default rating for seller (will be updated when buyer rates)
          submitted_at: new Date().toISOString(),
        }),
        buyer_rating: rating,
        buyer_comment: comment.trim() || null,
        buyer_rated_at: new Date().toISOString(),
      };

      const { error } = existingReview
        ? await supabase
            .from('reviews')
            .update(updateData)
            .eq('id', (existingReview as any).id)
        : await supabase
            .from('reviews')
            .insert(updateData);

      if (error) throw error;

      setOpen(false);
      setRating(0);
      setComment('');
      onRatingSubmitted?.();
    } catch (error) {
      console.error('Error submitting buyer rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          className="focus:outline-none"
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`h-8 w-8 ${
              starValue <= (hoverRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Rate Your Buyer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Buyer Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">{buyerName}</p>
              <p className="text-sm text-gray-600">Buyer</p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How was your experience with this buyer?</Label>
            <div className="flex justify-center gap-1">
              {renderStars()}
            </div>
            <div className="text-center text-sm text-gray-600">
              {rating === 0 ? (
                'Click to rate'
              ) : (
                <>
                  {rating} star{rating !== 1 ? 's' : ''} - {
                    rating === 1 ? 'Poor' :
                    rating === 2 ? 'Fair' :
                    rating === 3 ? 'Good' :
                    rating === 4 ? 'Very Good' :
                    'Excellent'
                  }
                </>
              )}
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="buyer-comment" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comment (Optional)
            </Label>
            <Textarea
              id="buyer-comment"
              placeholder="Share your experience working with this buyer..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Your feedback helps other sellers make informed decisions.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                'Submit Rating'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
