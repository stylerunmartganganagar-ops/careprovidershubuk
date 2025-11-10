import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useSubmitBid } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import { DollarSign, Send } from 'lucide-react';
import { toast } from 'sonner';

interface BidDialogProps {
  projectId: string;
  projectTitle: string;
  trigger: React.ReactNode;
  onBidSubmitted?: () => void;
}

export function BidDialog({ projectId, projectTitle, trigger, onBidSubmitted }: BidDialogProps) {
  const [open, setOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const { submitBid, loading } = useSubmitBid();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check token balance and redirect if zero
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (uid) {
        const { data: userRow } = await supabase
          .from('users')
          .select('bid_tokens')
          .eq('id', uid)
          .single();
        const current = (userRow as any)?.bid_tokens ?? 0;
        if (current < 1) {
          toast.error('You need tokens to place a bid. Please purchase tokens.');
          navigate('/seller/tokens');
          return;
        }
      }
    } catch {}

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (!message || message.trim().length < 150) {
      toast.error('Please enter a message of at least 150 characters.');
      return;
    }

    try {
      await submitBid(projectId, parseFloat(bidAmount), message.trim());
      toast.success('Bid submitted successfully!');
      setOpen(false);
      setBidAmount('');
      setMessage('');
      onBidSubmitted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit bid');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Bid</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Project: {projectTitle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid Amount (£)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter your bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message to Client (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself and explain why you're the right fit for this project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              A personalized message increases your chances of being selected.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Bid
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
