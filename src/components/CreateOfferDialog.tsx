import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { CreditCard, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';
import { toast } from 'sonner';

interface CreateOfferDialogProps {
  projectId: string;
  buyerId: string;
  trigger: React.ReactNode;
  onOfferCreated?: () => void;
}

interface PaymentMethod {
  id: string;
  payment_type: 'stripe' | 'paypal';
  account_id: string;
  account_email?: string;
  is_connected: boolean;
  is_verified: boolean;
}

export function CreateOfferDialog({ projectId, buyerId, trigger, onOfferCreated }: CreateOfferDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    payment_method: '' as 'stripe' | 'paypal'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchPaymentMethods();
    }
  }, [open, user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_payment_methods')
        .select('*')
        .eq('seller_id', user?.id)
        .eq('is_verified', true)
        .eq('is_connected', true);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const generatePaymentLink = (offerId: string, paymentMethod: PaymentMethod, amount: number): string => {
    if (paymentMethod.payment_type === 'stripe') {
      // In a real implementation, you'd create a Stripe Payment Link
      // For now, we'll return a placeholder URL
      return `https://buy.stripe.com/test_payment_link_${offerId}`;
    } else {
      // PayPal payment link
      return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paymentMethod.account_email || '')}&amount=${amount}&currency_code=GBP&item_name=Service%20Offer`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.description || !formData.amount || !formData.payment_method) {
        throw new Error('Please fill in all required fields');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Find the selected payment method
      const selectedPaymentMethod = paymentMethods.find(pm => pm.payment_type === formData.payment_method);
      if (!selectedPaymentMethod) {
        throw new Error('No verified payment method found for the selected type');
      }

      // Create the offer
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert({
          seller_id: user?.id,
          buyer_id: buyerId,
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          amount: amount,
          currency: 'GBP',
          payment_method: formData.payment_method,
          status: 'pending'
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Generate payment link
      const paymentLink = generatePaymentLink(offer.id, selectedPaymentMethod, amount);

      // Update offer with payment link
      const { error: updateError } = await supabase
        .from('offers')
        .update({ payment_link: paymentLink })
        .eq('id', offer.id);

      if (updateError) throw updateError;

      toast.success('Offer created successfully! Payment link generated.');
      setOpen(false);
      setFormData({ title: '', description: '', amount: '', payment_method: '' as 'stripe' | 'paypal' });
      onOfferCreated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const availablePaymentTypes = [...new Set(paymentMethods.map(pm => pm.payment_type))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Offer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="title">Offer Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Complete CQC Registration Package"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you're offering..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (£)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value: 'stripe' | 'paypal') => setFormData(prev => ({ ...prev, payment_method: value }))}
              disabled={availablePaymentTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={availablePaymentTypes.length === 0 ? "No payment methods available" : "Select payment method"} />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentTypes.includes('stripe') && (
                  <SelectItem value="stripe">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stripe
                    </div>
                  </SelectItem>
                )}
                {availablePaymentTypes.includes('paypal') && (
                  <SelectItem value="paypal">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      PayPal
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {availablePaymentTypes.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No verified payment methods found. Please add and verify a payment method first.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || availablePaymentTypes.length === 0} className="flex-1">
              {loading ? 'Creating...' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
