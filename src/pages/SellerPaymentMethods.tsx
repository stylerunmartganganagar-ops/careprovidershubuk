import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PaymentMethod {
  id: string;
  payment_type: 'stripe' | 'paypal';
  account_id: string;
  account_email?: string;
  is_connected: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function SellerPaymentMethods() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    payment_type: '' as 'stripe' | 'paypal',
    account_id: '',
    account_email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_payment_methods')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('seller_payment_methods')
        .insert({
          seller_id: user?.id,
          payment_type: formData.payment_type,
          account_id: formData.account_id,
          account_email: formData.payment_type === 'paypal' ? formData.account_email : null,
          is_connected: false, // Will be verified later
          is_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods(prev => [data, ...prev]);
      setIsDialogOpen(false);
      setFormData({ payment_type: '' as 'stripe' | 'paypal', account_id: '', account_email: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to add payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seller_payment_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
    } catch (err) {
      console.error('Error deleting payment method:', err);
    }
  };

  if (loading) {
    return (
      <SellerDashboardLayout>
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading payment methods...</p>
          </div>
        </main>
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout>
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-gray-600 mt-2">Connect your Stripe or PayPal account to receive payments</p>
        </div>

        <div className="grid gap-6">
          {/* Add Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Connect Payment Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Payment Method</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                    {error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="payment_type">Payment Provider</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value: 'stripe' | 'paypal') => setFormData(prev => ({ ...prev, payment_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stripe">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Stripe
                            </div>
                          </SelectItem>
                          <SelectItem value="paypal">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              PayPal
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.payment_type === 'stripe' && (
                      <div>
                        <Label htmlFor="account_id">Stripe Account ID</Label>
                        <Input
                          id="account_id"
                          value={formData.account_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                          placeholder="acct_xxxxxxxxxxxxxxxxxx"
                          required
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Find your Stripe Account ID in your Stripe Dashboard → Account Settings
                        </p>
                      </div>
                    )}

                    {formData.payment_type === 'paypal' && (
                      <>
                        <div>
                          <Label htmlFor="account_email">PayPal Email</Label>
                          <Input
                            id="account_email"
                            type="email"
                            value={formData.account_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, account_email: e.target.value }))}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="account_id">PayPal Merchant ID (Optional)</Label>
                          <Input
                            id="account_id"
                            value={formData.account_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                            placeholder="Merchant ID"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? 'Connecting...' : 'Connect Account'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Existing Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Your Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods connected yet</p>
                  <p className="text-sm mt-2">Add a payment method to start receiving payments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {method.payment_type === 'stripe' ? (
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        ) : (
                          <DollarSign className="h-6 w-6 text-blue-700" />
                        )}
                        <div>
                          <div className="font-medium capitalize">{method.payment_type}</div>
                          <div className="text-sm text-gray-600">
                            {method.account_email || `Account ID: ${method.account_id.slice(0, 10)}...`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={method.is_verified ? 'default' : 'secondary'}>
                          {method.is_verified ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-blue-900">Stripe</h3>
                  <p className="text-sm text-blue-700">
                    Fast, secure payments with instant transfers to your bank account.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-700 mb-2" />
                  <h3 className="font-semibold text-blue-900">PayPal</h3>
                  <p className="text-sm text-blue-700">
                    Widely recognized payment method with buyer protection.
                  </p>
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Payment methods need to be verified before you can receive payments.
                  Contact support if you need help with verification.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </SellerDashboardLayout>
  );
}
