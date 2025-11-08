import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Users,
  MessageSquare,
  Shield,
  DollarSign,
  FileText,
  Ban,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Activity,
  TrendingUp,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Star,
  CreditCard,
  Receipt,
  Package,
  Crown,
  Zap,
  Lock,
  Unlock,
  Sidebar,
  Menu,
  Bell,
  UserPlus,
  FileCheck,
  Flag,
  Archive,
  RefreshCw,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mock data for admin panel
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSellers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    reportedMessages: 0,
    tokensSold: 0,
    tokenRevenue: 0,
    pendingPayments: 0
  });

  // Messages for moderation
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: string;
    recipient: string;
    content: string;
    timestamp: string;
    flagged?: boolean;
    flagReason?: string;
    status?: 'pending' | 'approved' | 'rejected';
  }>>([]);

  // Orders (Created/Pending and Accepted/In Progress)
  const [createdOrders, setCreatedOrders] = useState<Array<{
    id: string;
    title: string;
    buyer_id: string;
    provider_id: string;
    price: number;
    status: string;
    created_at: string;
  }>>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Array<{
    id: string;
    title: string;
    buyer_id: string;
    provider_id: string;
    price: number;
    status: string;
    created_at: string;
  }>>([]);

  // Pending approvals
  const [pendingApprovals, setPendingApprovals] = useState<Array<{
    id: string;
    type: 'seller_profile' | 'service_posting';
    user: { name: string; email: string; avatar: string };
    submittedDate: string;
    status: 'pending' | 'approved' | 'rejected';
    content: string;
  }>>([]);

  // Sellers management
  const [sellers, setSellers] = useState<Array<{
    id: string | number;
    name: string;
    email: string;
    status: 'active' | 'suspended' | 'pending';
    level: string;
    rating: number;
    ordersCompleted: number;
    earnings: number;
    joinDate: string;
    lastActive: string;
    warnings: number;
    banned: boolean;
  }>>([]);

  // Payment management
  const [payments, setPayments] = useState<Array<{
    id: string | number;
    orderId: string;
    seller: string;
    buyer: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    date: string;
    dueDate: string;
  }>>([]);

  // Seller plans (Token packages)
  const [sellerPlans, setSellerPlans] = useState<Array<{
    id: string | number;
    name: string;
    tokens: number;
    price: number;
    description: string | null;
    activePurchases: number;
    revenue: number;
    popular?: boolean;
  }>>([]);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      try {
        const [{ count: usersCount }, { count: providersCount }, { count: ordersCount }] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
        ]);

        const { data: tokenPurchases, error: tokenPurchasesError } = await supabase
          .from('token_purchases')
          .select('tokens, amount, status');

        if (tokenPurchasesError) throw tokenPurchasesError;

        const completedPurchases = (tokenPurchases || []).filter(purchase => !purchase.status || purchase.status === 'completed');
        const tokensSold = completedPurchases.reduce((sum, purchase: any) => sum + Number(purchase.tokens || 0), 0);
        const tokenRevenue = completedPurchases.reduce((sum, purchase: any) => sum + Number(purchase.amount || 0), 0);
        const pendingPayments = (tokenPurchases || [])
          .filter(purchase => purchase.status === 'pending')
          .reduce((sum, purchase: any) => sum + Number(purchase.amount || 0), 0);

        // Use unread messages as a proxy for reported count (no flagged field present)
        const { data: unreadMsgs } = await supabase
          .from('messages')
          .select('is_read');

        if (mounted) {
          setStats(prev => ({
            ...prev,
            totalUsers: usersCount || 0,
            activeSellers: providersCount || 0,
            totalOrders: ordersCount || 0,
            tokensSold,
            tokenRevenue,
            pendingPayments,
            reportedMessages: (unreadMsgs || []).filter(m => m.is_read === false).length,
          }));
        }
      } catch (e) {
        console.error('Error loading overview stats', e);
      }
    };

    const loadCreatedOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date, proposal_message_id')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setCreatedOrders(data || []);
      } catch (e) {
        console.error('Error loading created orders', e);
      }
    };

    const loadAcceptedOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date')
          .neq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw error;
        setAcceptedOrders(data || []);
      } catch (e) {
        console.error('Error loading accepted orders', e);
      }
    };

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`id, content, created_at, sender:users!messages_sender_id_fkey(id,email), receiver:users!messages_receiver_id_fkey(id,email)`)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const rows = (data || []).map((m: any) => ({
          id: m.id,
          sender: m.sender?.email || m.sender?.id || 'Unknown',
          recipient: m.receiver?.email || m.receiver?.id || 'Unknown',
          content: m.content,
          timestamp: m.created_at,
          status: 'pending' as const
        }));
        if (mounted) setMessages(rows);
      } catch (e) {
        console.error('Error loading messages', e);
      }
    };

    const loadApprovals = async () => {
      try {
        const [{ data: unverified }, { data: inactiveServices }] = await Promise.all([
          supabase.from('users').select('id, name, email, avatar, is_verified, created_at, role').eq('is_verified', false),
          supabase.from('services').select('id, title, provider_id, is_active, created_at'),
        ]);

        const unverifiedItems = (unverified || []).map(u => ({
          id: u.id,
          type: 'seller_profile' as const,
          user: { name: (u as any).name, email: (u as any).email, avatar: (u as any).avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default' },
          submittedDate: (u as any).created_at,
          status: 'pending' as const,
          content: 'Profile verification pending'
        }));

        const serviceItems = (inactiveServices || [])
          .filter((s: any) => s.is_active === false)
          .map((s: any) => ({
            id: s.id,
            type: 'service_posting' as const,
            user: { name: 'Service Provider', email: s.provider_id, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=service' },
            submittedDate: s.created_at,
            status: 'pending' as const,
            content: s.title
          }));

        const combined = [...unverifiedItems, ...serviceItems].slice(0, 10);
        if (mounted) {
          setPendingApprovals(combined);
          setStats(prev => ({ ...prev, pendingApprovals: combined.length }));
        }
      } catch (e) {
        console.error('Error loading approvals', e);
      }
    };

    const loadSellers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role, rating, review_count, created_at, is_verified')
          .eq('role', 'provider')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const rows = (data || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.is_verified ? 'active' : 'pending',
          level: 'Level 1',
          rating: u.rating || 0,
          ordersCompleted: u.review_count || 0,
          earnings: 0,
          joinDate: u.created_at,
          lastActive: '—',
          warnings: 0,
          banned: false,
        }));
        if (mounted) setSellers(rows);
      } catch (e) {
        console.error('Error loading sellers', e);
      }
    };

    const loadPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id, order_id, amount, currency, status, created_at')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const rows = (data || []).map((p: any) => ({
          id: p.id,
          orderId: p.order_id,
          seller: '-',
          buyer: '-',
          amount: p.amount,
          fee: Math.round(p.amount * 0.1),
          netAmount: Math.round(p.amount * 0.9),
          status: (p.status || 'pending') as any,
          date: p.created_at,
          dueDate: p.created_at,
        }));
        if (mounted) setPayments(rows);
      } catch (e) {
        console.error('Error loading payments', e);
      }
    };

    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('token_plans')
          .select('*')
          .order('tokens', { ascending: true });
        if (error) throw error;
        const rows = (data || []).map((pl: any) => ({
          id: pl.id,
          name: pl.name,
          tokens: pl.tokens,
          price: pl.price,
          description: pl.description,
          activePurchases: pl.active_purchases || 0,
          revenue: pl.total_revenue || 0,
          popular: pl.is_popular || false,
        }));
        if (mounted) setSellerPlans(rows);
      } catch (e) {
        console.error('Error loading plans', e);
      }
    };

    const loadAll = async () => {
      await Promise.all([
        loadOverview(),
        loadMessages(),
        loadApprovals(),
        loadSellers(),
        loadPayments(),
        loadPlans(),
        loadCreatedOrders(),
        loadAcceptedOrders(),
      ]);
    };

    loadAll();

    // Basic realtime to refresh lists on changes
    const channel = supabase
      .channel('admin_panel_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { loadOverview(); loadSellers(); loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { loadMessages(); loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { loadPayments(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_purchases' }, () => { loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadOverview(); loadCreatedOrders(); loadAcceptedOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => { loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_plans' }, () => { loadPlans(); })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'messages', label: 'Message Moderation', icon: MessageSquare },
    { id: 'approvals', label: 'Content Approvals', icon: FileCheck },
    { id: 'kyc', label: 'KYC Verification', icon: Shield },
    { id: 'sellers', label: 'Seller Management', icon: Shield },
    { id: 'payments', label: 'Payment Management', icon: DollarSign },
    { id: 'orders_created', label: 'Created Orders', icon: Package },
    { id: 'orders_accepted', label: 'Accepted Orders', icon: Package },
    { id: 'plans', label: 'Seller Plans', icon: Package },
    { id: 'reviews', label: 'Review Management', icon: Star },
    { id: 'reports', label: 'Reports & Analytics', icon: Activity },
    { id: 'settings', label: 'Platform Settings', icon: Settings }
  ];

  const renderSidebar = () => (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={`font-bold text-lg ${sidebarOpen ? 'block' : 'hidden'}`}>
            Admin Panel
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className={`w-full justify-start ${sidebarOpen ? '' : 'px-2'}`}
              onClick={() => setActiveTab(item.id)}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {sidebarOpen && item.label}
            </Button>
          );
        })}
      </nav>
    </div>
  );

  const renderSettings = () => {
    const [fb, setFb] = useState('');
    const [gtm, setGtm] = useState('');
    const [ga, setGa] = useState('');
    const [rowId, setRowId] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        try {
          const { data } = await supabase.from('platform_settings').select('*').order('updated_at', { ascending: false }).limit(1);
          const row = (data && data[0]) || null;
          if (row) {
            setRowId(row.id);
            setFb(row.fb_pixel_id || '');
            setGtm(row.gtm_id || '');
            setGa(row.ga_measurement_id || '');
          }
        } catch {}
      })();
    }, []);

    const save = async () => {
      const payload: any = { fb_pixel_id: fb || null, gtm_id: gtm || null, ga_measurement_id: ga || null };
      if (rowId) payload.id = rowId;
      const { error, data } = await (supabase.from('platform_settings') as any).upsert(payload).select().single();
      if (!error && data) setRowId(data.id);
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Facebook Pixel</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="e.g. 123456789012345" value={fb} onChange={e => setFb(e.target.value)} />
              <p className="text-xs text-gray-500 mt-2">Add your Pixel ID. Scripts are injected automatically.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Google Tag Manager</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="e.g. GTM-XXXXXXX" value={gtm} onChange={e => setGtm(e.target.value)} />
              <p className="text-xs text-gray-500 mt-2">Add your GTM container ID. Scripts are injected automatically.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Google Analytics (GA4)</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="e.g. G-XXXXXXXXXX" value={ga} onChange={e => setGa(e.target.value)} />
              <p className="text-xs text-gray-500 mt-2">Add your GA4 Measurement ID. Scripts are injected automatically.</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
        </div>
      </div>
    );
  };

  const renderOrdersTable = (rows: typeof createdOrders) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono">{o.id}</TableCell>
            <TableCell>{o.title}</TableCell>
            <TableCell>{o.buyer_id}</TableCell>
            <TableCell>{o.provider_id}</TableCell>
            <TableCell>£{(o.price || 0).toLocaleString()}</TableCell>
            <TableCell>
              {(() => {
                const now = Date.now();
                const d = (o as any).delivery_date ? new Date((o as any).delivery_date).getTime() : null;
                let display: string = o.status;
                if (o.status !== 'completed' && d && d < now) display = 'delayed';
                if (o.status === 'revision') display = 'incomplete';
                const variant = display === 'completed'
                  ? 'default'
                  : display === 'in_progress'
                  ? 'secondary'
                  : display === 'pending'
                  ? 'outline'
                  : 'destructive'; // delayed/incomplete
                return <Badge variant={variant as any}>{display}</Badge>;
              })()}
            </TableCell>
            <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCreatedOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Created Orders (Pending)</h2>
      </div>
      {renderOrdersTable(createdOrders)}
    </div>
  );

  const renderAcceptedOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Accepted Orders (In Progress)</h2>
      </div>
      {renderOrdersTable(acceptedOrders)}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sellers</p>
                <p className="text-2xl font-bold">{stats.activeSellers.toLocaleString()}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tokens Sold</p>
                <p className="text-2xl font-bold">{(stats.tokensSold ?? 0).toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Token Revenue</p>
                <p className="text-2xl font-bold">£{(stats.tokenRevenue ?? 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Content Approvals</span>
                <Badge variant="destructive">{stats.pendingApprovals}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Reported Messages</span>
                <Badge variant="destructive">{stats.reportedMessages}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Pending Payments</span>
                <Badge variant="secondary">£{stats.pendingPayments.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Platform Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>New users this month</span>
                <span className="font-semibold text-green-600">+1,240</span>
              </div>
              <div className="flex justify-between">
                <span>New sellers this month</span>
                <span className="font-semibold text-green-600">+85</span>
              </div>
              <div className="flex justify-between">
                <span>Orders this month</span>
                <span className="font-semibold text-green-600">+420</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue this month</span>
                <span className="font-semibold text-green-600">+£18,500</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Message Moderation</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold">{message.sender}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold">{message.recipient}</span>
                    {message.flagged && (
                      <Badge variant="destructive" className="text-xs">
                        <Flag className="h-3 w-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{message.content}</p>
                  {message.flagReason && (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Flag reason: {message.flagReason}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="text-sm text-gray-500">
                    {message.timestamp}
                  </div>
                </div>
                <Badge variant={
                  message.status === 'approved' ? 'default' :
                  message.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {message.status}
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View Conversation
                </Button>
                {message.status === 'pending' && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline">
                  <Ban className="h-4 w-4 mr-1" />
                  Ban User
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Approvals</h2>
        <div className="flex space-x-2">
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {pendingApprovals.map((approval) => (
          <Card key={approval.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar>
                    <img src={approval.user.avatar} alt={approval.user.name} />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">{approval.user.name}</span>
                      <span className="text-gray-500">{approval.user.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {approval.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{approval.content}</p>
                    <div className="text-sm text-gray-500">
                      Submitted: {approval.submittedDate}
                    </div>
                  </div>
                </div>
                <Badge variant={
                  approval.status === 'approved' ? 'default' :
                  approval.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {approval.status}
                </Badge>
              </div>

              <div className="flex space-x-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Content Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Content Details</label>
                        <Textarea
                          value={approval.content}
                          readOnly
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Submitter</label>
                          <Input value={approval.user.name} readOnly className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Input value={approval.type} readOnly className="mt-1" />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Quick Approve
                </Button>
                <Button size="sm" variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSellers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seller Management</h2>
        <div className="flex space-x-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Seller
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seller</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Earnings</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sellers.map((seller) => (
            <TableRow key={seller.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.name}`} alt={seller.name} />
                  </Avatar>
                  <div>
                    <div className="font-medium">{seller.name}</div>
                    <div className="text-sm text-gray-500">{seller.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={
                  seller.status === 'active' ? 'default' :
                  seller.status === 'suspended' ? 'destructive' : 'secondary'
                }>
                  {seller.status}
                </Badge>
              </TableCell>
              <TableCell>{seller.level}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  {seller.rating}
                </div>
              </TableCell>
              <TableCell>{seller.ordersCompleted}</TableCell>
              <TableCell>£{seller.earnings.toLocaleString()}</TableCell>
              <TableCell>
                {seller.warnings > 0 && (
                  <Badge variant="destructive">{seller.warnings}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!seller.banned && (
                    <Button size="sm" variant="outline">
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant={seller.banned ? "outline" : "destructive"}>
                    {seller.banned ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderPayments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Process Payments
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{stats.pendingPayments.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Pending Payments</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">£{(stats.pendingPayments * 0.1).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Platform Fees</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">£{(stats.pendingPayments * 0.9).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Seller Payouts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono">{payment.orderId}</TableCell>
              <TableCell>{payment.seller}</TableCell>
              <TableCell>{payment.buyer}</TableCell>
              <TableCell>£{payment.amount.toLocaleString()}</TableCell>
              <TableCell>£{payment.fee.toLocaleString()}</TableCell>
              <TableCell className="font-semibold">£{payment.netAmount.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={
                  payment.status === 'completed' ? 'default' :
                  payment.status === 'processing' ? 'secondary' : 'outline'
                }>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>{payment.dueDate}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {payment.status === 'pending' && (
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Release
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderPlans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Token Package Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sellerPlans.map((plan) => (
          <Card key={plan.id} className={plan.popular ? 'ring-2 ring-blue-500' : ''}>
            {plan.popular && (
              <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                Most Popular
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <Badge variant="secondary">£{plan.price}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {plan.tokens === -1 ? '∞' : plan.tokens}
                  </div>
                  <div className="text-sm text-gray-600">
                    {plan.tokens === -1 ? 'Unlimited' : 'Application'} Tokens
                  </div>
                </div>

                <p className="text-sm text-gray-600 text-center">{plan.description}</p>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Purchases:</span>
                    <span className="font-semibold">{plan.activePurchases}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue:</span>
                    <span className="font-semibold">£{plan.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">1,505</div>
              <div className="text-sm text-gray-600">Total Token Packages Sold</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">£72,584</div>
              <div className="text-sm text-gray-600">Token Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">47.2%</div>
              <div className="text-sm text-gray-600">Average Token Utilization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">23.4</div>
              <div className="text-sm text-gray-600">Avg Tokens per Purchase</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderKYC = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KYC Document Verification</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Placeholder KYC content - will be implemented with full functionality */}
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">KYC Verification System</h3>
          <p className="text-gray-600 mb-4">
            Review and approve user identity verification submissions.
          </p>
          <p className="text-sm text-gray-500">
            Full KYC management interface will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="flex">
        {renderSidebar()}

        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'approvals' && renderApprovals()}
            {activeTab === 'kyc' && renderKYC()}
            {activeTab === 'sellers' && renderSellers()}
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'orders_created' && renderCreatedOrders()}
            {activeTab === 'orders_accepted' && renderAcceptedOrders()}
            {activeTab === 'plans' && renderPlans()}
          </div>
        </div>
      </div>
    </div>
  );
}
