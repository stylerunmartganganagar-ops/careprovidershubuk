import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerDashboardHeader } from '../components/SellerDashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  DollarSign,
  Star,
  Calendar,
  Eye,
  FileText,
  Send,
  User,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';

export default function SellerManageOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date, completed_at, delivered_at, buyer_accepted')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && mounted) setOrders(data || []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel('seller_manage_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `provider_id=eq.${user?.id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const newInquiries = useMemo(() => {
    // Treat pending orders for this seller as inquiries
    return orders
      .filter(o => o.status === 'pending')
      .map(o => ({
        id: o.id,
        title: o.title || 'Untitled Inquiry',
        client: {
          name: o.buyer_id,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${o.buyer_id}`,
          location: '—',
          rating: 0,
          reviews: 0,
        },
        amount: o.price || 0,
        inquiryDate: o.created_at,
        type: 'Project',
        message: '',
        skills: [] as string[],
      }));
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'revision': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const displayOrders = useMemo(() => orders.map(o => ({
    id: o.id,
    title: o.title,
    amount: o.price || 0,
    status: o.status as string,
    progress: o.status === 'completed' ? 100 : o.status === 'revision' ? 60 : 75,
    startDate: o.created_at,
    deadline: o.delivery_date || o.created_at,
    lastActivity: new Date(o.created_at).toLocaleDateString(),
    type: 'Custom',
    client: { name: o.buyer_id, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${o.buyer_id}`, location: '—', rating: 0, reviews: 0 },
    description: '',
    delivered_at: o.delivered_at,
    buyer_accepted: o.buyer_accepted,
  })), [orders]);

  const filteredOrders = useMemo(() => displayOrders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  }), [displayOrders, filterStatus]);

  const markDelivered = async (id: string) => {
    try {
      setDeliveringId(id);
      await (supabase.from('orders') as any)
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', id);
    } finally {
      setDeliveringId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerDashboardHeader />

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
              <p className="text-gray-600">
                Track active projects, respond to inquiries, and manage your service delivery.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="revision">Incomplete</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Order Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{displayOrders.filter(o => o.status === 'in_progress').length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incomplete</p>
                  <p className="text-2xl font-bold">{displayOrders.filter(o => o.status === 'revision').length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Inquiries</p>
                  <p className="text-2xl font-bold">{newInquiries.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month's Revenue</p>
                  <p className="text-2xl font-bold">£{displayOrders.reduce((sum, order) => sum + (order.amount || 0), 0).toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Orders ({filteredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries">
              New Inquiries ({newInquiries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="space-y-6">
              {filteredOrders.map((order) => (
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
                              <img src={order.client.avatar} alt={order.client.name} />
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.client.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                {order.client.rating} ({order.client.reviews} reviews)
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {order.client.location}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3">{order.description}</p>

                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{order.progress}%</span>
                          </div>
                          <Progress value={order.progress} className="h-2" />
                        </div>

                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span>Started: {new Date(order.startDate).toLocaleDateString()}</span>
                            <span>Deadline: {new Date(order.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <div>Last activity: {order.lastActivity}</div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message Client
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Update Progress
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/order/${order.id}/delivery`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {order.status !== 'completed' && !order.delivered_at && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 disabled:opacity-60" disabled={deliveringId === order.id} onClick={() => markDelivered(order.id)}>
                            {deliveringId === order.id ? 'Delivering...' : 'Mark as Delivered'}
                          </Button>
                        )}
                        {order.delivered_at && !order.buyer_accepted && (
                          <Badge className="bg-yellow-100 text-yellow-800">Waiting buyer acceptance</Badge>
                        )}
                        {order.delivered_at && order.buyer_accepted && (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {filterStatus === 'all' ? 'No Active Orders' : `No ${filterStatus} Orders`}
                    </h3>
                    <p className="text-gray-500">
                      {filterStatus === 'all'
                        ? 'You don\'t have any active orders at the moment.'
                        : `You don't have any orders with status "${filterStatus}".`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6">
            <div className="space-y-6">
              {newInquiries.map((inquiry) => (
                <Card key={inquiry.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold">{inquiry.title}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              £{inquiry.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{inquiry.type}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <img src={inquiry.client.avatar} alt={inquiry.client.name} />
                            </Avatar>
                            <div>
                              <p className="font-medium">{inquiry.client.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                {inquiry.client.rating} ({inquiry.client.reviews} reviews)
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {inquiry.client.location}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(inquiry.inquiryDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg mb-3">
                          <p className="text-gray-700 italic">"{inquiry.message}"</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {inquiry.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <div>New inquiry • Respond within 24 hours</div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-1" />
                          Send Proposal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {newInquiries.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No New Inquiries</h3>
                    <p className="text-gray-500">
                      You don't have any new inquiries at the moment. Check back later!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
