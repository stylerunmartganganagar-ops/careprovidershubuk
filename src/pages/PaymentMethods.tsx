import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Lock,
  Shield,
  Star
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  isDefault: boolean;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  email?: string;
  accountHolder?: string;
  bankName?: string;
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [addCardDialog, setAddCardDialog] = useState(false);
  const [addPaypalDialog, setAddPaypalDialog] = useState(false);
  const [addBankDialog, setAddBankDialog] = useState(false);

  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    zip: ''
  });

  const [paypalForm, setPaypalForm] = useState({
    email: ''
  });

  const [bankForm, setBankForm] = useState({
    accountHolder: '',
    accountNumber: '',
    sortCode: '',
    bankName: ''
  });

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDelete = (id: string) => {
    if (paymentMethods.find(m => m.id === id)?.isDefault) {
      alert('Cannot delete default payment method. Please set another method as default first.');
      return;
    }
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  const handleAddCard = () => {
    // Basic validation
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvc || !cardForm.name) {
      alert('Please fill in all required fields');
      return;
    }

    const last4 = cardForm.number.slice(-4);
    const [expiryMonth, expiryYear] = cardForm.expiry.split('/').map(n => parseInt(n));

    const newCard: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      isDefault: paymentMethods.length === 0,
      last4,
      expiryMonth,
      expiryYear,
      brand: cardForm.number.startsWith('4') ? 'Visa' :
             cardForm.number.startsWith('5') ? 'Mastercard' : 'Unknown'
    };

    setPaymentMethods(prev => [...prev, newCard]);
    setCardForm({ number: '', expiry: '', cvc: '', name: '', zip: '' });
    setAddCardDialog(false);
  };

  const handleAddPaypal = () => {
    if (!paypalForm.email) {
      alert('Please enter your PayPal email');
      return;
    }

    const newPaypal: PaymentMethod = {
      id: Date.now().toString(),
      type: 'paypal',
      isDefault: paymentMethods.length === 0,
      email: paypalForm.email
    };

    setPaymentMethods(prev => [...prev, newPaypal]);
    setPaypalForm({ email: '' });
    setAddPaypalDialog(false);
  };

  const handleAddBank = () => {
    if (!bankForm.accountHolder || !bankForm.accountNumber || !bankForm.sortCode) {
      alert('Please fill in all required fields');
      return;
    }

    const newBank: PaymentMethod = {
      id: Date.now().toString(),
      type: 'bank',
      isDefault: paymentMethods.length === 0,
      accountHolder: bankForm.accountHolder,
      bankName: bankForm.bankName || 'Unknown Bank'
    };

    setPaymentMethods(prev => [...prev, newBank]);
    setBankForm({ accountHolder: '', accountNumber: '', sortCode: '', bankName: '' });
    setAddBankDialog(false);
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
            <p className="text-gray-600">
              Manage your payment methods and billing information securely.
            </p>
          </div>
        </div>

        {/* Current Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Payment Methods</span>
                  <Badge variant="outline">{paymentMethods.length} methods</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Methods</h3>
                    <p className="text-gray-500 mb-4">
                      Add a payment method to start making purchases.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            {method.type === 'card' && (
                              <>
                                <span className="text-2xl mr-3">{getCardIcon(method.brand!)}</span>
                                <div>
                                  <p className="font-medium">
                                    {method.brand} **** {method.last4}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Expires {method.expiryMonth}/{method.expiryYear}
                                  </p>
                                </div>
                              </>
                            )}
                            {method.type === 'paypal' && (
                              <>
                                <span className="text-2xl mr-3">🅿️</span>
                                <div>
                                  <p className="font-medium">PayPal</p>
                                  <p className="text-sm text-gray-600">{method.email}</p>
                                </div>
                              </>
                            )}
                            {method.type === 'bank' && (
                              <>
                                <span className="text-2xl mr-3">🏦</span>
                                <div>
                                  <p className="font-medium">{method.bankName}</p>
                                  <p className="text-sm text-gray-600">{method.accountHolder}</p>
                                </div>
                              </>
                            )}
                          </div>
                          {method.isDefault && (
                            <Badge className="bg-green-100 text-green-800">
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {!method.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetDefault(method.id)}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(method.id)}
                              disabled={method.isDefault}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Shield className="h-4 w-4 mr-1" />
                            Secured
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Payment Methods */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={addCardDialog} onOpenChange={setAddCardDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Add Credit/Debit Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Credit/Debit Card</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.number}
                          onChange={(e) => setCardForm({...cardForm, number: formatCardNumber(e.target.value)})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={cardForm.expiry}
                            onChange={(e) => setCardForm({...cardForm, expiry: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            placeholder="123"
                            value={cardForm.cvc}
                            onChange={(e) => setCardForm({...cardForm, cvc: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                          id="card-name"
                          placeholder="John Smith"
                          value={cardForm.name}
                          onChange={(e) => setCardForm({...cardForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip">ZIP/Postal Code</Label>
                        <Input
                          id="zip"
                          placeholder="SW1A 1AA"
                          value={cardForm.zip}
                          onChange={(e) => setCardForm({...cardForm, zip: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setAddCardDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddCard}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Card
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={addPaypalDialog} onOpenChange={setAddPaypalDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="text-lg mr-2">🅿️</span>
                      Add PayPal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add PayPal Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="paypal-email">PayPal Email</Label>
                        <Input
                          id="paypal-email"
                          type="email"
                          placeholder="your-email@example.com"
                          value={paypalForm.email}
                          onChange={(e) => setPaypalForm({...paypalForm, email: e.target.value})}
                        />
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You'll be redirected to PayPal to authorize this payment method.
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setAddPaypalDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPaypal}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add PayPal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={addBankDialog} onOpenChange={setAddBankDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <span className="text-lg mr-2">🏦</span>
                      Add Bank Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Bank Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="account-holder">Account Holder Name</Label>
                        <Input
                          id="account-holder"
                          placeholder="John Smith"
                          value={bankForm.accountHolder}
                          onChange={(e) => setBankForm({...bankForm, accountHolder: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          placeholder="12345678"
                          value={bankForm.accountNumber}
                          onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sort-code">Sort Code</Label>
                        <Input
                          id="sort-code"
                          placeholder="12-34-56"
                          value={bankForm.sortCode}
                          onChange={(e) => setBankForm({...bankForm, sortCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-name">Bank Name (Optional)</Label>
                        <Input
                          id="bank-name"
                          placeholder="Barclays Bank"
                          value={bankForm.bankName}
                          onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                        />
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                          <p className="text-sm text-yellow-800">
                            Bank account verification may take 1-3 business days.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setAddBankDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddBank}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Bank Account
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-800 mb-1">Your payments are secure</h3>
                    <p className="text-sm text-gray-600">
                      We use industry-standard encryption and never store your full payment details.
                      All transactions are protected by our secure payment system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
