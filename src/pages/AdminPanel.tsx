import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
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
import { Database, supabase } from '../lib/supabase';
import { notifyAdminWarning } from '../lib/notifications';

type UserRecord = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_verified: boolean | null;
  created_at: string;
  phone: string | null;
};

type ReviewRecord = {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  order_id: string | null;
  reviewer: { id?: string; name?: string | null; email?: string | null } | null;
  reviewee: { id?: string; name?: string | null; email?: string | null } | null;
};

type MessageRecord = {
  id: string;
  content: string;
  created_at: string;
  sender: { id?: string; email?: string | null } | null;
  receiver: { id?: string; email?: string | null } | null;
};

type ConversationSummary = {
  conversationId: string;
  participants: string[];
  lastMessage: {
    preview: string;
    createdAt: string;
    sender: string;
  };
  totalMessages: number;
  flagged: boolean;
};

type ConversationDetailMessage = {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
};

type SellerRecord = {
  id: string;
  name: string | null;
  email: string | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  is_verified: boolean | null;
};

type TokenPlanRecord = {
  id: string;
  name: string;
  tokens: number;
  price: number;
  description: string | null;
  active_purchases: number | null;
  total_revenue: number | null;
  is_popular: boolean | null;
};

type TokenPurchaseRecord = {
  id: string;
  seller_id: string;
  plan_id: string;
  tokens: number;
  amount: number;
  currency: string | null;
  status: string | null;
  created_at: string;
};

type BuyerProSubscriptionRecord = {
  id: string;
  buyer_id: string;
  plan_id: string;
  status: string | null;
  created_at: string;
};

type AdminBuyerProSubRow = {
  id: string;
  buyer_id: string;
  buyer_name: string | null;
  buyer_email: string | null;
  plan_name: string | null;
  price: number | null;
  plan_interval: string | null;
  status: string | null;
  created_at: string;
};

type PlatformSettingsRow = {
  site_name: string;
  id: string;
  fb_pixel_id: string | null;
  gtm_id: string | null;
  ga_measurement_id: string | null;
  maintenance_mode: boolean | null;
  support_email: string | null;
  allow_registrations: boolean | null;
  max_users_per_day: number | null;
};

type SellerListItem = {
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
};

type ServiceRecord = {
  id: string;
  title: string | null;
  provider_id: string;
  is_active: boolean | null;
  created_at: string;
  approval_status: string | null;
};

type ProjectRecord = {
  id: string;
  title: string | null;
  user_id: string;
  status: string | null;
  created_at: string;
  budget: number | null;
};

type UserSummaryRecord = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

type ApprovalItemType = 'service_posting' | 'project_posting';

type ApprovalItem = {
  id: string;
  type: ApprovalItemType;
  user: { name: string; email: string; avatar: string };
  submittedDate: string;
  status: ApprovalStatus;
  content: string;
  budget?: number | null;
  isPremium?: boolean;
};

type TokenPurchaseListItem = {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  planName: string;
  tokens: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type BuyerProSubscriptionListItem = {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  planName: string;
  price: number | null;
  interval: string | null;
  status: string;
  createdAt: string;
};

type SellerPlanListItem = {
  id: string | number;
  name: string;
  tokens: number;
  price: number;
  description: string | null;
  activePurchases: number;
  revenue: number;
  popular?: boolean;
};

type CountOnlyResponse = {
  count: number | null;
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Seller details modal state
  const [sellerDetailsModalOpen, setSellerDetailsModalOpen] = useState(false);
  const [selectedSellerDetails, setSelectedSellerDetails] = useState<any>(null);

  // Mock data for admin panel
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSellers: 0,
    totalOrders: 0,
    pendingApprovals: 0,
    reportedMessages: 0,
    tokensSold: 0,
    tokenRevenue: 0,
    sellerPendingPurchases: 0,
    buyerProActive: 0
  });

  // Conversations for moderation
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Record<string, ConversationDetailMessage[]>>({});
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Orders (Created/Pending and Accepted/In Progress)
  const [createdOrders, setCreatedOrders] = useState<Array<{
    id: string;
    title: string;
    buyer_id: string;
    provider_id: string;
    price: number;
    status: string;
    created_at: string;
    order_type?: 'regular' | 'milestone';
  }>>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<Array<{
    id: string;
    title: string;
    buyer_id: string;
    provider_id: string;
    price: number;
    status: string;
    created_at: string;
    order_type?: 'regular' | 'milestone';
  }>>([]);

  // Pending approvals
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<'all' | ApprovalStatus>('all');
  const [approvalTypeFilter, setApprovalTypeFilter] = useState<'all' | 'service_posting' | 'project_posting'>('all');
  const [approvalPremiumFilter, setApprovalPremiumFilter] = useState<'all' | 'premium' | 'non_premium'>('all');

  // Admin user management
  const [usersList, setUsersList] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string | null;
    verified: boolean;
    createdAt: string;
    phone: string | null;
  }>>([]);
  const [userSearch, setUserSearch] = useState('');

  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    orderId: string | null;
    reviewer: { id: string; name: string; email: string | null };
    reviewee: { id: string; name: string; email: string | null };
  }>>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  const [reportsData, setReportsData] = useState<{
    ordersByStatus: Array<{ status: string; count: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    recentSignups: Array<{ id: string; name: string; role: string; createdAt: string }>;
  }>({ ordersByStatus: [], monthlyRevenue: [], recentSignups: [] });
  const [reportsLoading, setReportsLoading] = useState(false);

  const isMountedRef = useRef(true);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, is_verified, created_at, phone')
        .order('created_at', { ascending: false })
        .limit(200)
        .returns<UserRecord[]>();
      if (error) throw error;
      const rows = (data ?? []).map((u) => ({
        id: u.id,
        name: u.name ?? 'Unnamed User',
        email: u.email ?? 'Unknown',
        role: u.role,
        verified: Boolean(u.is_verified),
        createdAt: u.created_at,
        phone: u.phone ?? null,
      }));
      if (isMountedRef.current) {
        setUsersList(rows);
      }
    } catch (e) {
      console.error('Error loading users', e);
    }
  }, []);

  const loadReportsAnalytics = useCallback(async () => {
    try {
      setReportsLoading(true);

      const [{ data: ordersData, error: ordersError }, { data: milestoneOrdersData, error: milestoneOrdersError }, { data: tokenPurchasesData, error: tokenPurchasesError }, { data: buyerProData, error: buyerProError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.from('orders').select('status'),
        supabase.from('milestone_orders').select('status'),
        supabase
          .from('token_purchases')
          .select('amount, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('buyer_subscriptions')
          .select('created_at, plan:plans(price_cents)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('users')
          .select('id, name, role, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (ordersError) throw ordersError;
      if (milestoneOrdersError) throw milestoneOrdersError;
      if (tokenPurchasesError) throw tokenPurchasesError;
      if (buyerProError) throw buyerProError;
      if (usersError) throw usersError;

      const ordersByStatus = [...(ordersData || []), ...(milestoneOrdersData || [])].reduce((acc: Array<{ status: string; count: number }>, row: any) => {
        const status = row.status || 'unknown';
        const existing = acc.find((item) => item.status === status);
        if (existing) existing.count += 1;
        else acc.push({ status, count: 1 });
        return acc;
      }, []);

      const revenueBuckets = new Map<string, number>();
      (tokenPurchasesData || []).forEach((p: any) => {
        const date = new Date(p.created_at);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const prev = revenueBuckets.get(key) || 0;
        revenueBuckets.set(key, prev + Number(p.amount || 0));
      });
      (buyerProData || []).forEach((sub: any) => {
        const date = new Date(sub.created_at);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const price = sub.plan?.price_cents ? sub.plan.price_cents / 100 : 0;
        revenueBuckets.set(key, (revenueBuckets.get(key) || 0) + price);
      });

      const monthlyRevenue = Array.from(revenueBuckets.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([month, revenue]) => ({ month, revenue }));

      const recentSignups = (usersData || []).map((u: any) => ({
        id: u.id,
        name: u.name || 'Unnamed',
        role: u.role,
        createdAt: u.created_at,
      }));

      if (isMountedRef.current) {
        setReportsData({ ordersByStatus, monthlyRevenue, recentSignups });
      }
    } catch (e) {
      console.error('Error loading reports analytics', e);
      if (isMountedRef.current) {
        setReportsData({ ordersByStatus: [], monthlyRevenue: [], recentSignups: [] });
      }
    } finally {
      if (isMountedRef.current) {
        setReportsLoading(false);
      }
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          order_id,
          reviewer:users!reviews_reviewer_id_fkey(id, name, email),
          reviewee:users!reviews_reviewee_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(200)
        .returns<ReviewRecord[]>();
      if (error) throw error;
      const rows = (data ?? []).map((review) => ({
        id: review.id,
        rating: Number(review.rating ?? 0),
        comment: review.comment ?? '',
        createdAt: review.created_at,
        orderId: review.order_id ?? null,
        reviewer: {
          id: review.reviewer?.id ?? 'unknown',
          name: review.reviewer?.name ?? review.reviewer?.email ?? 'Unknown reviewer',
          email: review.reviewer?.email ?? null,
        },
        reviewee: {
          id: review.reviewee?.id ?? 'unknown',
          name: review.reviewee?.name ?? review.reviewee?.email ?? 'Unknown user',
          email: review.reviewee?.email ?? null,
        },
      }));
      if (isMountedRef.current) {
        setReviews(rows);
      }
    } catch (e) {
      console.error('Error loading reviews', e);
      if (isMountedRef.current) {
        setReviews([]);
      }
    }
  }, []);

  const loadCreatedOrders = useCallback(async () => {
    try {
      // Load regular orders
      const { data: regularOrders, error: regularError } = await supabase
        .from('orders')
        .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date, proposal_message_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (regularError) throw regularError;
      // Load milestone orders
      const { data: milestoneOrders, error: milestoneError } = await supabase
        .from('milestone_orders')
        .select('id, title, buyer_id, provider_id, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (milestoneError) throw milestoneError;
      // Combine and normalize the data
      const normalizedRegularOrders = (regularOrders || []).map(order => ({
        id: order.id,
        title: order.title,
        buyer_id: order.buyer_id,
        provider_id: order.provider_id,
        price: order.price,
        status: order.status,
        created_at: order.created_at,
        order_type: 'regular' as const,
      }));
      const normalizedMilestoneOrders = (milestoneOrders || []).map(order => ({
        id: order.id,
        title: order.title,
        buyer_id: order.buyer_id,
        provider_id: order.provider_id,
        price: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        order_type: 'milestone' as const,
      }));
      // Combine both types and sort by created_at
      const allOrders = [...normalizedRegularOrders, ...normalizedMilestoneOrders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
      if (isMountedRef.current) {
        setCreatedOrders(allOrders);
      }
    } catch (e) {
      console.error('Error loading created orders', e);
    }
  }, []);

  const loadAcceptedOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, buyer_id, provider_id, price, status, created_at, delivery_date')
        .neq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      if (isMountedRef.current) {
        setAcceptedOrders(data || []);
      }
    } catch (e) {
      console.error('Error loading accepted orders', e);
    }
  }, []);

  // Sellers management
  const [sellers, setSellers] = useState<SellerListItem[]>([]);

  const handleApprove = async (item: ApprovalItem) => {
    console.log('handleApprove called with item:', item);
    try {
      if (item.type === 'service_posting') {
        console.log('Approving service:', item.id);
        const updateData = { approval_status: 'approved', is_active: true };
        console.log('Update data for service:', updateData);
        const { data, error } = await (supabase as any)
          .from('services')
          .update(updateData)
          .eq('id', item.id)
          .select();
        console.log('Service update result:', { data, error });
        if (error) throw error;
        console.log('Service approved successfully');
      } else if (item.type === 'project_posting') {
        console.log('Approving project:', item.id);
        const updateData = { status: 'open' };
        console.log('Update data for project:', updateData);
        const { data, error } = await (supabase as any)
          .from('projects')
          .update(updateData)
          .eq('id', item.id)
          .select();
        console.log('Project update result:', { data, error });
        if (error) throw error;
        console.log('Project approved successfully');
      }
      console.log('Calling loadApprovals to refresh...');
      loadApprovals(); // Refresh the list
    } catch (e) {
      console.error('Error approving item', e);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    console.log('handleReject called with item:', item);
    try {
      if (item.type === 'service_posting') {
        console.log('Rejecting service:', item.id);
        const { error } = await (supabase as any)
          .from('services')
          .update({ approval_status: 'rejected', is_active: false })
          .eq('id', item.id);
        if (error) throw error;
        console.log('Service rejected successfully');
      } else if (item.type === 'project_posting') {
        console.log('Rejecting project:', item.id);
        const { error } = await (supabase as any)
          .from('projects')
          .update({ status: 'rejected' })
          .eq('id', item.id);
        if (error) throw error;
        console.log('Project rejected successfully');
      }
      console.log('Calling loadApprovals to refresh...');
      loadApprovals(); // Refresh the list
    } catch (e) {
      console.error('Error rejecting item', e);
    }
  };

  const handleViewSeller = async (sellerId: string) => {
    try {
      // Fetch seller profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (profileError) throw profileError;

      // Fetch recent bids
      const { data: recentBids, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          project:projects!bids_project_id_fkey(title, budget, status)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bidsError) console.error('Error fetching recent bids:', bidsError);

      // Fetch recent services
      const { data: recentServices, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', sellerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (servicesError) console.error('Error fetching recent services:', servicesError);

      // Fetch recent portfolio
      const { data: recentPortfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('provider_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (portfolioError) console.error('Error fetching recent portfolio:', portfolioError);

      // Fetch recent reviews
      const { data: recentReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:users!reviews_reviewer_id_fkey(name, email)
        `)
        .eq('reviewee_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) console.error('Error fetching recent reviews:', reviewsError);

      // Fetch order stats
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('price, status')
        .eq('provider_id', sellerId);

      if (ordersError) console.error('Error fetching order stats:', ordersError);

      const orderStats = {
        total: orders?.length || 0,
        completed: orders?.filter(o => o.status === 'completed').length || 0,
        inProgress: orders?.filter(o => o.status === 'in_progress').length || 0,
        earnings: orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.price || 0), 0) || 0,
      };

      // Activity stats
      const activityStats = {
        bidsPlaced: recentBids?.length || 0,
        servicesListed: recentServices?.length || 0,
        lastActive: profile?.updated_at || profile?.created_at || 'Unknown',
      };

      const sellerDetails = {
        profile,
        recentBids: recentBids || [],
        recentServices: recentServices || [],
        recentPortfolio: recentPortfolio || [],
        recentReviews: recentReviews || [],
        orderStats,
        activityStats,
      };

      setSelectedSellerDetails(sellerDetails);
      setSellerDetailsModalOpen(true);
    } catch (error) {
      console.error('Error loading seller details:', error);
    }
  };

  const handleWarnSeller = async (sellerId: string) => {
    console.log('Warn seller:', sellerId);
    if (!window.confirm('Send warning to this seller? This will increment their warning count.')) {
      return;
    }

    try {
      // First get current warning count
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('warnings')
        .eq('id', sellerId)
        .single();

      if (fetchError) throw fetchError;

      const currentWarnings = (currentUser as any)?.warnings || 0;
      const newWarnings = currentWarnings + 1;

      // Update warning count
      const { error: updateError } = await supabase
        .from('users')
        .update({ warnings: newWarnings })
        .eq('id', sellerId);

      if (updateError) throw updateError;

      // Send notification to seller
      await notifyAdminWarning(sellerId, newWarnings);

      console.log(`Seller warned successfully. Warning count increased to ${newWarnings}`);
      // Refresh the sellers list
      loadUsers();
    } catch (e) {
      console.error('Error warning seller:', e);
      alert(`Error: ${e.message || e}`);
    }
  };

  const handleBanSeller = async (sellerId: string, currentlyBanned: boolean) => {
    console.log(`${currentlyBanned ? 'Unban' : 'Ban'} seller:`, sellerId);
    
    const action = currentlyBanned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this seller?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('users')
        .update({ banned: !currentlyBanned })
        .eq('id', sellerId);

      if (error) throw error;

      console.log(`Seller ${action}ned successfully`);
      // Refresh the sellers list
      loadUsers();
    } catch (e) {
      console.error(`Error ${action}ning seller:`, e);
    }
  };

  // Payment management
  const [tokenPurchasesList, setTokenPurchasesList] = useState<TokenPurchaseListItem[]>([]);
  const [buyerProSubscriptions, setBuyerProSubscriptions] = useState<BuyerProSubscriptionListItem[]>([]);

  // Seller plans (Token packages)
  const [sellerPlans, setSellerPlans] = useState<SellerPlanListItem[]>([]);

  // Platform settings state
  const [settingsFb, setSettingsFb] = useState('');
  const [settingsGtm, setSettingsGtm] = useState('');
  const [settingsGa, setSettingsGa] = useState('');
  const [settingsSiteName, setSettingsSiteName] = useState('');
  const [settingsMaintenanceMode, setSettingsMaintenanceMode] = useState(false);
  const [settingsSupportEmail, setSettingsSupportEmail] = useState('');
  const [settingsAllowRegistrations, setSettingsAllowRegistrations] = useState(true);
  const [settingsMaxUsers, setSettingsMaxUsers] = useState('');
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('id, fb_pixel_id, gtm_id, ga_measurement_id, site_name, maintenance_mode, support_email, allow_registrations, max_users_per_day')
        .order('updated_at', { ascending: false })
        .limit(1)
        .returns<PlatformSettingsRow[]>();
      const row = data?.[0] ?? null;
      if (row) {
        setSettingsRowId(row.id);
        setSettingsFb(row.fb_pixel_id || '');
        setSettingsGtm(row.gtm_id || '');
        setSettingsGa(row.ga_measurement_id || '');
        setSettingsSiteName(row.site_name || '');
        setSettingsMaintenanceMode(Boolean(row.maintenance_mode));
        setSettingsSupportEmail(row.support_email || '');
        setSettingsAllowRegistrations(Boolean(row.allow_registrations));
        setSettingsMaxUsers(String(row.max_users_per_day || ''));
      }
    } catch {}
  }, []);

  const loadApprovals = async () => {
    console.log('loadApprovals: Starting...');
    try {
      const [servicesResult, projectsResult] = await Promise.all([
        (supabase as any)
          .from('services')
          .select('id, title, provider_id, is_active, created_at, approval_status'),
        (supabase as any)
          .from('projects')
          .select('id, title, user_id, status, created_at, budget'),
      ]);

      if (servicesResult.error) {
        console.error('Services query error:', servicesResult.error);
        throw servicesResult.error;
      }
      if (projectsResult.error) {
        console.error('Projects query error:', projectsResult.error);
        throw projectsResult.error;
      }

      const services = servicesResult.data ?? [];
      const projects = projectsResult.data ?? [];

      console.log(`loadApprovals: Found ${services.length} services, ${projects.length} projects`);

      const referencedUserIds = new Set<string>();
      services.forEach((service) => referencedUserIds.add(service.provider_id));
      projects.forEach((project) => referencedUserIds.add(project.user_id));

      const userLookup = new Map<string, UserSummaryRecord>();
      if (referencedUserIds.size > 0) {
        const { data: userRows, error: usersError } = await (supabase as any)
          .from('users')
          .select('id, name, email, avatar')
          .in('id', Array.from(referencedUserIds));
        if (usersError) {
          console.error('User lookup error:', usersError);
          throw usersError;
        }
        (userRows ?? []).forEach((row) => {
          userLookup.set(row.id, row);
        });
      }

      const getUserSummary = (userId: string, fallbackName: string, seed: string) => {
        const record = userLookup.get(userId);
        return {
          name: record?.name ?? fallbackName,
          email: record?.email ?? userId,
          avatar: record?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
        };
      };

      const serviceItems: ApprovalItem[] = services
        .map((service) => ({
          id: service.id,
          type: 'service_posting',
          user: getUserSummary(service.provider_id, 'Service Provider', service.provider_id),
          submittedDate: service.created_at,
          status: (service.approval_status as ApprovalStatus) || 'pending',
          content: service.title ?? 'Service awaiting approval',
          isPremium: false,
        }));

      // Determine premium buyers
      let premiumSet = new Set<string>();
      if (referencedUserIds.size > 0) {
        const { data: subs } = await (supabase as any)
          .from('buyer_subscriptions')
          .select('buyer_id, status')
          .in('buyer_id', Array.from(referencedUserIds))
          .eq('status', 'active');
        premiumSet = new Set<string>((subs || []).map((s: any) => s.buyer_id));
      }

      const projectItems: ApprovalItem[] = projects
        .map((project) => {
          const normalizedStatus: ApprovalStatus = project.status === 'open' || project.status === 'approved'
            ? 'approved'
            : project.status === 'cancelled' || project.status === 'rejected'
            ? 'rejected'
            : 'pending';
          return {
            id: project.id,
            type: 'project_posting',
            user: getUserSummary(project.user_id, 'Buyer Submission', project.user_id),
            submittedDate: project.created_at,
            status: normalizedStatus,
            content: project.title ?? 'Project awaiting approval',
            budget: project.budget ?? null,
            isPremium: premiumSet.has(project.user_id),
          };
        });

      const combined = [...serviceItems, ...projectItems]
        .sort((a, b) => {
          // Premium first
          const ap = a.isPremium ? 1 : 0;
          const bp = b.isPremium ? 1 : 0;
          if (ap !== bp) return bp - ap;
          // Then by submitted date desc
          return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
        })
        .slice(0, 20);

      console.log(`loadApprovals: Final result - ${combined.length} total items`);

      if (isMountedRef.current) {
        setPendingApprovals(combined);
        setStats((prev) => ({ ...prev, pendingApprovals: combined.length }));
      }
    } catch (e) {
      console.error('Error loading approvals:', e);
    }
  };

  const loadOverview = useCallback(async () => {
    try {
      const usersResult = (await (supabase as any)
        .from('users')
        .select('id', { count: 'exact', head: true })) as CountOnlyResponse;
      const providersResult = (await (supabase as any)
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'provider')) as CountOnlyResponse;
      const ordersResult = (await (supabase as any)
        .from('orders')
        .select('id', { count: 'exact', head: true })) as CountOnlyResponse;
      const [
        { data: tokenPurchases, error: tokenPurchasesError },
        { count: activeBuyerProCount, error: buyerSubsError }
      ] = await Promise.all([
        supabase
          .from('token_purchases')
          .select('tokens, amount, status')
          .returns<TokenPurchaseRecord[]>(),
        supabase
          .from('buyer_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
      ]);

      if (tokenPurchasesError) throw tokenPurchasesError;
      if (buyerSubsError) throw buyerSubsError;

      const completedPurchases = (tokenPurchases || []).filter((purchase) => !purchase.status || purchase.status === 'completed');
      const tokensSold = completedPurchases.reduce((sum, purchase) => sum + Number(purchase.tokens || 0), 0);
      const tokenRevenue = completedPurchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
      const sellerPendingPurchases = (tokenPurchases || [])
        .filter((purchase) => purchase.status === 'pending')
        .reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
      const activeBuyerPro = activeBuyerProCount ?? 0;

      const { data: unreadMsgs } = await supabase.from('messages').select('is_read');

      if (isMountedRef.current) {
        setStats((prev) => ({
          ...prev,
          totalUsers: usersResult.count ?? 0,
          activeSellers: providersResult.count ?? 0,
          totalOrders: ordersResult.count ?? 0,
          tokensSold,
          tokenRevenue,
          sellerPendingPurchases,
          buyerProActive: activeBuyerPro,
          reportedMessages: (unreadMsgs || []).filter((m) => m.is_read === false).length,
        }));
      }
    } catch (e) {
      console.error('Error loading overview stats', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender_id,
            receiver_id,
            sender:users!messages_sender_id_fkey(id,email,name),
            receiver:users!messages_receiver_id_fkey(id,email,name)
          `)
          .order('created_at', { ascending: false })
          .limit(200)
          .returns<MessageRecord[]>();
        if (error) throw error;

        const grouped = new Map<string, MessageRecord[]>();
        (data || []).forEach((msg: any) => {
          const userA = msg.sender?.id || msg.sender_id || 'unknown';
          const userB = msg.receiver?.id || msg.receiver_id || 'unknown';
          const participants = [userA, userB].sort();
          const key = `${participants[0]}_${participants[1]}`;
          const enriched: MessageRecord = {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            sender: msg.sender,
            receiver: msg.receiver,
          };
          const existing = grouped.get(key) ?? [];
          existing.push(enriched);
          grouped.set(key, existing);
        });

        const summaries: ConversationSummary[] = Array.from(grouped.entries()).map(([conversationId, messagesList]) => {
          const lastMessage = messagesList[messagesList.length - 1];
          const participants = [
            lastMessage.sender?.email || lastMessage.sender?.id || 'Unknown',
            lastMessage.receiver?.email || lastMessage.receiver?.id || 'Unknown',
          ];
          return {
            conversationId,
            participants,
            lastMessage: {
              preview: lastMessage.content.slice(0, 140),
              createdAt: lastMessage.created_at,
              sender: participants[0],
            },
            totalMessages: messagesList.length,
            flagged: false,
          };
        });

        const detailMap = summaries.reduce<Record<string, ConversationDetailMessage[]>>((acc, summary) => {
          const messagesForConversation = grouped.get(summary.conversationId) ?? [];
          acc[summary.conversationId] = messagesForConversation
            .slice()
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((msg) => ({
              id: msg.id,
              sender: msg.sender?.email || msg.sender?.id || 'Unknown',
              content: msg.content,
              createdAt: msg.created_at,
            }));
          return acc;
        }, {});

        if (isMountedRef.current) {
          setConversations(summaries);
          setConversationMessages(detailMap);
        }
      } catch (e) {
        console.error('Error loading messages', e);
      }
    };

    loadApprovals();

    const loadSellers = async () => {
      try {
        // First get all providers
        const { data: providers, error } = await (supabase as any)
          .from('users')
          .select('id, name, email, is_verified, created_at, role, banned, warnings')
          .eq('role', 'provider')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Get seller metrics for each provider
        const sellerMetrics = await Promise.all(
          (providers ?? []).map(async (provider: any) => {
            // Get review stats
            const { data: reviews } = await (supabase as any)
              .from('reviews')
              .select('rating')
              .eq('reviewee_id', provider.id);

            const reviewCount = reviews?.length || 0;
            const avgRating = reviewCount > 0
              ? reviews!.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
              : 0;

            // Get completed orders and earnings
            const { data: orders } = await (supabase as any)
              .from('orders')
              .select('price')
              .eq('provider_id', provider.id)
              .eq('status', 'completed');

            const completedOrders = orders?.length || 0;
            const totalEarnings = orders?.reduce((sum: number, o: any) => sum + (o.price || 0), 0) || 0;

            // Get warning count (we'll add this later)
            const warnings = provider.warnings || 0;

            // Get banned status from database
            const banned = provider.banned || false;

            return {
              id: provider.id,
              name: provider.name ?? 'Unnamed Provider',
              email: provider.email ?? 'unknown@example.com',
              status: provider.is_verified ? 'active' : 'pending',
              level: 'Level 1', // TODO: implement leveling system
              rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
              ordersCompleted: completedOrders,
              earnings: totalEarnings,
              joinDate: provider.created_at ?? new Date().toISOString(),
              lastActive: '—', // TODO: implement last active tracking
              warnings: warnings,
              banned: banned,
            };
          })
        );

        if (isMountedRef.current) setSellers(sellerMetrics);
      } catch (e) {
        console.error('Error loading sellers', e);
      }
    };

    const loadTokenPurchases = async () => {
      try {
        const { data, error } = await supabase
          .from('token_purchases')
          .select(`
            id,
            seller_id,
            tokens,
            amount,
            currency,
            status,
            created_at,
            plan:token_plans(name)
          `)
          .order('created_at', { ascending: false })
          .limit(100)
          .returns<(TokenPurchaseRecord & { plan: { name: string | null } })[]>();
        if (error) throw error;

        const sellerIds = Array.from(new Set((data || []).map((row) => row.seller_id).filter(Boolean)));
        const sellerLookup = new Map<string, { name: string | null; email: string | null }>();
        if (sellerIds.length > 0) {
          const { data: sellerRows } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', sellerIds);
          (sellerRows || []).forEach((row) => {
            sellerLookup.set(row.id, { name: row.name ?? null, email: row.email ?? null });
          });
        }

        const rows: TokenPurchaseListItem[] = (data || []).map((purchase) => {
          const seller = sellerLookup.get(purchase.seller_id) ?? { name: null, email: null };
          return {
            id: purchase.id,
            sellerId: purchase.seller_id,
            sellerName: seller.name ?? 'Unknown Seller',
            sellerEmail: seller.email ?? '—',
            planName: purchase.plan?.name ?? 'Unknown Plan',
            tokens: purchase.tokens,
            amount: Number(purchase.amount ?? 0),
            currency: purchase.currency ?? 'GBP',
            status: purchase.status ?? 'pending',
            createdAt: purchase.created_at,
          };
        });

        if (isMountedRef.current) setTokenPurchasesList(rows);
      } catch (e) {
        console.error('Error loading token purchases', e);
      }
    };

    const loadBuyerProSubscriptions = async () => {
      try {
        const { data: subs, error } = await supabase.rpc('admin_list_buyer_pro_subs');
        if (error) throw error;

        const rows: BuyerProSubscriptionListItem[] = ((subs as AdminBuyerProSubRow[] | null) || []).map((sub) => ({
          id: sub.id,
          buyerId: sub.buyer_id,
          buyerName: sub.buyer_name ?? 'Unknown Buyer',
          buyerEmail: sub.buyer_email ?? '—',
          planName: sub.plan_name ?? 'Buyer Pro',
          price: sub.price ?? null,
          interval: sub.plan_interval ?? null,
          status: sub.status ?? 'pending',
          createdAt: sub.created_at,
        }));

        if (isMountedRef.current) setBuyerProSubscriptions(rows);
      } catch (e) {
        console.error('Error loading buyer pro subscriptions', e);
      }
    };

    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('token_plans')
          .select('id, name, tokens, price, description, active_purchases, total_revenue, is_popular')
          .order('tokens', { ascending: true })
          .returns<TokenPlanRecord[]>();
        if (error) throw error;

        // Calculate actual active purchases and revenue for each plan
        const plansWithActiveCount = await Promise.all((data || []).map(async (pl) => {
          // Get active purchases count
          const { count: activeCount } = await supabase
            .from('token_purchases')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', pl.id)
            .neq('status', 'cancelled');

          // Get total revenue from completed purchases
          const { data: purchases } = await supabase
            .from('token_purchases')
            .select('amount')
            .eq('plan_id', pl.id)
            .neq('status', 'cancelled');

          const totalRevenue = (purchases || []).reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);

          return {
            id: pl.id,
            name: pl.name,
            tokens: pl.tokens,
            price: pl.price,
            description: pl.description,
            activePurchases: activeCount ?? 0,
            revenue: totalRevenue,
            popular: Boolean(pl.is_popular),
          };
        }));

        if (isMountedRef.current) setSellerPlans(plansWithActiveCount);
      } catch (e) {
        console.error('Error loading plans', e);
      }
    };

    const loadAll = async () => {
      await Promise.all([
        loadUsers(),
        loadReviews(),
        loadReportsAnalytics(),
        loadOverview(),
        loadMessages(),
        loadApprovals(),
        loadSellers(),
        loadTokenPurchases(),
        loadBuyerProSubscriptions(),
        loadPlans(),
        loadCreatedOrders(),
        loadAcceptedOrders(),
      ]);
    };

    loadAll();

    // Basic realtime to refresh lists on changes
    const channel = supabase
      .channel('admin_panel_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { loadOverview(); loadSellers(); loadApprovals(); loadUsers(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { loadMessages(); loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buyer_subscriptions' }, () => { loadBuyerProSubscriptions(); loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { loadReportsAnalytics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_purchases' }, () => { loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadOverview(); loadCreatedOrders(); loadAcceptedOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => { loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => { loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => { loadReviews(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { loadReportsAnalytics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_plans' }, () => { loadPlans(); })
      .subscribe();

    // Call all load functions
    loadAll();

    return () => {
      mounted = false;
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [loadUsers, loadReviews, loadReportsAnalytics]);

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab, loadSettings]);

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
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 h-full min-h-0 overflow-y-auto flex-shrink-0 ${
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

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Review Management</h2>
          <p className="text-sm text-gray-500">Monitor recent feedback left on the marketplace.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Select value={reviewFilter} onValueChange={(value: typeof reviewFilter) => setReviewFilter(value)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="positive">Positive (4-5★)</SelectItem>
              <SelectItem value="neutral">Neutral (3★)</SelectItem>
              <SelectItem value="negative">Negative (1-2★)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadReviews()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total reviews</div>
            <div className="text-2xl font-semibold">{reviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Filtered set</div>
            <div className="text-2xl font-semibold">{filteredReviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Average rating</div>
            <div className="text-2xl font-semibold">{filteredReviews.length ? averageReviewScore.toFixed(1) : '0.0'}★</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Reviewee</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                    No reviews match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{review.reviewer.name}</span>
                        {review.reviewer.email && (
                          <span className="text-xs text-gray-500">{review.reviewer.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{review.reviewee.name}</span>
                        {review.reviewee.email && (
                          <span className="text-xs text-gray-500">{review.reviewee.email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xl">
                      <p className="text-sm text-gray-700 line-clamp-3">{review.comment || 'No comment provided.'}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {review.orderId || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => {
    const totalRevenue = reportsData.monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <Button variant="outline" onClick={() => loadReportsAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportsData.ordersByStatus.map((item) => (
                  <div key={item.status} className="flex justify-between">
                    <span className="capitalize">{item.status}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reportsData.recentSignups.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <div className="text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue (Total: £{totalRevenue.toLocaleString()})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportsData.monthlyRevenue.slice(-6).map((item) => (
                <div key={item.month} className="flex justify-between">
                  <span>{item.month}</span>
                  <span className="font-medium">£{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSettings = () => {
    const save = async () => {
      const payload: Database['public']['Tables']['platform_settings']['Insert'] = {
        fb_pixel_id: settingsFb || null,
        gtm_id: settingsGtm || null,
        ga_measurement_id: settingsGa || null,
        site_name: settingsSiteName || null,
        maintenance_mode: settingsMaintenanceMode,
        support_email: settingsSupportEmail || null,
        allow_registrations: settingsAllowRegistrations,
        max_users_per_day: settingsMaxUsers ? Number(settingsMaxUsers) : null,
        id: settingsRowId || undefined,
      };
      const { error, data } = await supabase
        .from('platform_settings')
        .upsert(payload)
        .select()
        .single<PlatformSettingsRow>();
      if (!error && data) setSettingsRowId(data.id);
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Platform Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input id="siteName" placeholder="e.g. Healthy Nexus" value={settingsSiteName} onChange={e => setSettingsSiteName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input id="supportEmail" placeholder="e.g. support@healthynexus.com" value={settingsSupportEmail} onChange={e => setSettingsSupportEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="maxUsers">Max Users per Day</Label>
                <Input id="maxUsers" type="number" placeholder="100" value={settingsMaxUsers} onChange={e => setSettingsMaxUsers(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="maintenanceMode" checked={settingsMaintenanceMode} onChange={e => setSettingsMaintenanceMode(e.target.checked)} />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="allowRegistrations" checked={settingsAllowRegistrations} onChange={e => setSettingsAllowRegistrations(e.target.checked)} />
                <Label htmlFor="allowRegistrations">Allow Registrations</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Analytics & Tracking</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fb">Facebook Pixel</Label>
                <Input id="fb" placeholder="e.g. 123456789012345" value={settingsFb} onChange={e => setSettingsFb(e.target.value)} />
                <p className="text-xs text-gray-500 mt-2">Add your Pixel ID. Scripts are injected automatically.</p>
              </div>
              <div>
                <Label htmlFor="gtm">Google Tag Manager</Label>
                <Input id="gtm" placeholder="e.g. GTM-XXXXXXX" value={settingsGtm} onChange={e => setSettingsGtm(e.target.value)} />
                <p className="text-xs text-gray-500 mt-2">Add your GTM container ID. Scripts are injected automatically.</p>
              </div>
              <div>
                <Label htmlFor="ga">Google Analytics (GA4)</Label>
                <Input id="ga" placeholder="e.g. G-XXXXXXXXXX" value={settingsGa} onChange={e => setSettingsGa(e.target.value)} />
                <p className="text-xs text-gray-500 mt-2">Add your GA4 Measurement ID. Scripts are injected automatically.</p>
              </div>
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
                <p className="text-2xl font-bold">£{Number(stats.tokenRevenue || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Buyer Pro</p>
                <p className="text-2xl font-bold">{stats.buyerProActive.toLocaleString()}</p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Seller Purchases</p>
                <p className="text-2xl font-bold">£{Number(stats.sellerPendingPurchases || 0).toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-red-500" />
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
                <span>Pending Token Purchases</span>
                <Badge variant="secondary">£{Number(stats.sellerPendingPurchases || 0).toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Active Buyer Pro Members</span>
                <Badge variant="secondary">{stats.buyerProActive.toLocaleString()}</Badge>
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

  const filteredUsers = usersList.filter((user) => {
    if (!userSearch.trim()) return true;
    const query = userSearch.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.phone && user.phone.toLowerCase().includes(query))
    );
  });

  const filteredReviews = reviews.filter((review) => {
    if (reviewFilter === 'positive') return review.rating >= 4;
    if (reviewFilter === 'neutral') return review.rating === 3;
    if (reviewFilter === 'negative') return review.rating <= 2;
    return true;
  });

  const averageReviewScore = filteredReviews.reduce((sum, review) => sum + review.rating, 0) /
    (filteredReviews.length || 1);

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email or phone"
              className="pl-9"
            />
          </div>
          <Button variant="outline" onClick={() => loadUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-gray-500">
                    No users found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              )}
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`} alt={user.name} />
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.verified ? 'default' : 'secondary'}>
                      {user.verified ? 'verified' : 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.phone || '—'}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderMessages = () => {
    // Function to analyze message content for problematic patterns
    const analyzeMessageContent = (content: string) => {
      if (!content) return 'safe'; // No content

      const lowerContent = content.toLowerCase();

      // Check for email patterns
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      if (emailRegex.test(content)) {
        return 'danger'; // Red - contains email
      }

      // Check for URL patterns
      const urlRegex = /\b(?:https?:\/\/|www\.)\S+\b/g;
      if (urlRegex.test(content)) {
        return 'danger'; // Red - contains URL
      }

      // Check for phone number patterns (more specific to avoid false positives)
      // Look for patterns that are clearly phone numbers, not just any numbers
      const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(\b\d{10,15}\b(?!\.\d))/g;
      const cleanContent = content.replace(/£[\d,]+\.?\d*/g, ''); // Remove currency amounts
      if (phoneRegex.test(cleanContent) && /\d{10,}/.test(cleanContent.replace(/\s+/g, ''))) {
        return 'warning'; // Yellow - contains phone number
      }

      // Check for personal details sharing patterns (exclude business terms)
      const personalDetailsKeywords = /\b(my\s+(phone|email|number|contact|whatsapp|telegram|signal)|contact\s+me|reach\s+me|call\s+me|text\s+me|dm\s+me|message\s+me)\b/gi;
      if (personalDetailsKeywords.test(lowerContent)) {
        // Exclude if it's clearly business-related (contains business terms)
        const businessTerms = /\b(order|milestone|proposal|project|service|payment|invoice|contract|quote|estimate|deadline)\b/gi;
        if (!businessTerms.test(lowerContent)) {
          return 'warning'; // Yellow - personal details sharing (but not business)
        }
      }

      return 'safe'; // White - no issues
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Conversation Monitoring</h2>
            <p className="text-sm text-gray-500">Open any conversation to review the full chat history in detail.</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => loadOverview()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {conversations.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-sm text-gray-500">
                No conversations found. Messages will appear here as users start chatting.
              </CardContent>
            </Card>
          ) : (
            conversations.map((conversation) => {
              // Determine overall risk level across all messages
              const allMessages = conversationMessages[conversation.conversationId] || [];
              const contentRisk = allMessages.reduce<'safe' | 'warning' | 'danger'>((acc, msg) => {
                const risk = analyzeMessageContent(msg.content);
                if (risk === 'danger') return 'danger';
                if (risk === 'warning' && acc === 'safe') return 'warning';
                return acc;
              }, 'safe');

              return (
                <Card
                  key={conversation.conversationId}
                  className={`transition-colors ${
                    contentRisk === 'danger'
                      ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
                      : contentRisk === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200'
                      : 'bg-white'
                  }`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-500">Participants</div>
                        <div className="font-semibold text-gray-900">
                          {conversation.participants.join(' ◦ ')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {contentRisk === 'danger' && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Needs Review
                          </Badge>
                        )}
                        <div className="text-xs text-gray-500">{conversation.totalMessages} messages</div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Last message</div>
                      <div className={`text-sm line-clamp-3 ${
                        contentRisk === 'danger'
                          ? 'text-red-800'
                          : contentRisk === 'warning'
                          ? 'text-yellow-800'
                          : 'text-gray-700'
                      }`}>
                        {conversation.lastMessage.preview || 'No content'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                      <span>{conversation.lastMessage.sender}</span>
                      <span>{new Date(conversation.lastMessage.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Dialog open={selectedConversationId === conversation.conversationId} onOpenChange={(open) => setSelectedConversationId(open ? conversation.conversationId : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Conversation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              Conversation Details
                              {contentRisk === 'danger' && <Badge variant="destructive">⚠️ High Risk</Badge>}
                              {contentRisk === 'warning' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ Medium Risk</Badge>}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="text-sm text-gray-500 mb-4">
                            Participants: {conversation.participants.join(' ◦ ')}
                          </div>
                          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                            {(conversationMessages[conversation.conversationId] ?? []).map((msg) => {
                              const msgRisk = analyzeMessageContent(msg.content);
                              return (
                                <div
                                  key={msg.id}
                                  className={`rounded-lg border border-gray-200 p-4 ${
                                    msgRisk === 'danger'
                                      ? 'bg-red-50 border-red-200'
                                      : msgRisk === 'warning'
                                      ? 'bg-yellow-50 border-yellow-200'
                                      : 'bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-800">{msg.sender}</span>
                                    <div className="flex items-center space-x-2">
                                      {msgRisk === 'danger' && <Badge variant="destructive" className="text-xs">⚠️</Badge>}
                                      {msgRisk === 'warning' && <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">⚠️</Badge>}
                                      <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <p className={`text-sm whitespace-pre-wrap break-words ${
                                    msgRisk === 'danger' ? 'text-red-800' :
                                    msgRisk === 'warning' ? 'text-yellow-800' :
                                    'text-gray-700'
                                  }`}>
                                    {msg.content}
                                  </p>
                                </div>
                              );
                            })}
                            {(conversationMessages[conversation.conversationId] ?? []).length === 0 && (
                              <div className="text-sm text-gray-500">No messages available for this conversation.</div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Approvals</h2>
        <div className="flex space-x-2">
          <Select value={approvalTypeFilter} onValueChange={(value) => setApprovalTypeFilter(value as 'all' | 'service_posting' | 'project_posting')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="service_posting">Services</SelectItem>
              <SelectItem value="project_posting">Projects</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={(value) => setApprovalFilter(value as 'all' | ApprovalStatus)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalPremiumFilter} onValueChange={(value) => setApprovalPremiumFilter(value as 'all' | 'premium' | 'non_premium')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Premium filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buyers</SelectItem>
              <SelectItem value="premium">Premium Buyers</SelectItem>
              <SelectItem value="non_premium">Non‑Premium Buyers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {pendingApprovals
          .filter((approval) => 
            approvalTypeFilter === 'all' || approval.type === approvalTypeFilter
          )
          .filter((approval) => 
            approvalFilter === 'all' || approval.status === approvalFilter
          )
          .filter((approval) => {
            if (approval.type !== 'project_posting') {
              // premium filter applies to buyer project postings only
              return approvalPremiumFilter === 'all';
            }
            if (approvalPremiumFilter === 'all') return true;
            if (approvalPremiumFilter === 'premium') return Boolean(approval.isPremium);
            if (approvalPremiumFilter === 'non_premium') return !approval.isPremium;
            return true;
          })
          .map((approval) => (
          <Card key={approval.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar>
                    <img src={approval.user.avatar} alt={approval.user.name} />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold flex items-center gap-1">
                        {approval.user.name}
                        {approval.isPremium && approval.type === 'project_posting' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </span>
                      <span className="text-gray-500">{approval.user.email}</span>
                      <Badge variant="outline" className="text-xs">
                        {approval.type === 'service_posting' ? 'SERVICE' : 'PROJECT'}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{approval.content}</p>
                    {approval.type === 'project_posting' && approval.budget !== null && (
                      <div className="text-sm text-gray-500 mb-1">
                        Estimated budget: £{Number(approval.budget).toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Submitted: {new Date(approval.submittedDate).toLocaleString()}
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
                      <DialogDescription>
                        Review the content details before approving or rejecting.
                      </DialogDescription>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Submitter</label>
                          <Input value={approval.user.name} readOnly className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Input value={approval.type === 'service_posting' ? 'Service Listing' : 'Project Posting'} readOnly className="mt-1" />
                        </div>
                        {approval.type === 'project_posting' && (
                          <div>
                            <label className="text-sm font-medium">Budget</label>
                            <Input
                              value={
                                approval.budget !== null
                                  ? `£${Number(approval.budget).toLocaleString()}`
                                  : 'Not provided'
                              }
                              readOnly
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {approval.status === 'pending' && (
                          <>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(approval)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button variant="destructive" onClick={() => handleReject(approval)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {approval.status === 'approved' && (
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                            <Button variant="outline" size="sm" onClick={() => handleReject(approval)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke Approval
                            </Button>
                          </div>
                        )}
                        {approval.status === 'rejected' && (
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleApprove(approval)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve Now
                            </Button>
                          </div>
                        )}
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Request Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {approval.status === 'pending' && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(approval)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(approval)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {approval.status === 'approved' && (
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleReject(approval)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  </div>
                )}
                {approval.status === 'rejected' && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                    <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleApprove(approval)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {pendingApprovals
          .filter((approval) => 
            approvalTypeFilter === 'all' || approval.type === approvalTypeFilter
          )
          .filter((approval) => 
            approvalFilter === 'all' || approval.status === approvalFilter
          )
          .length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-gray-500">
              No submissions match this filter.
            </CardContent>
          </Card>
        )}
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
                  seller.banned ? 'destructive' :
                  seller.status === 'active' ? 'default' :
                  seller.status === 'suspended' ? 'destructive' : 'secondary'
                }>
                  {seller.banned ? 'banned' : seller.status}
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
                {seller.warnings > 0 ? (
                  <Badge variant="destructive">{seller.warnings}</Badge>
                ) : (
                  <span className="text-gray-500">0</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => handleViewSeller(String(seller.id))}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!seller.banned && (
                    <Button size="sm" variant="outline" onClick={() => handleWarnSeller(String(seller.id))}>
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant={seller.banned ? "outline" : "destructive"}
                    onClick={() => handleBanSeller(String(seller.id), seller.banned)}
                  >
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

  const renderPayments = useCallback(() => {
    const totalTokenValue = tokenPurchasesList.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
    const pendingTokenValue = tokenPurchasesList
      .filter((purchase) => purchase.status === 'pending')
      .reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0);
    const completedTokenValue = totalTokenValue - pendingTokenValue;

    const activeBuyerPro = buyerProSubscriptions.filter((sub) => sub.status === 'active').length;
    const buyerProRevenue = buyerProSubscriptions
      .filter((sub) => sub.status === 'active')
      .reduce((sum, sub) => sum + Number(sub.price || 0), 0);

    const totalRevenue = totalTokenValue + buyerProRevenue;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={() => {
              loadTokenPurchases();
              loadBuyerProSubscriptions();
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">£{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Token Revenue</div>
              <div className="text-2xl font-bold text-blue-600">£{totalTokenValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Completed Purchases</div>
              <div className="text-2xl font-bold text-blue-600">£{completedTokenValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Pending Token Purchases</div>
              <div className="text-2xl font-bold text-yellow-600">£{pendingTokenValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">Active Buyer Pro</div>
              <div className="text-2xl font-bold text-purple-600">{activeBuyerPro.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">£{buyerProRevenue.toLocaleString()} / cycle</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Seller Token Purchases</CardTitle>
              <CardDescription>Recent token package purchases made by sellers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenPurchasesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No token purchases recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {tokenPurchasesList.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div className="font-medium">{purchase.sellerName}</div>
                        <div className="text-xs text-gray-500">{purchase.sellerEmail}</div>
                      </TableCell>
                      <TableCell>{purchase.planName}</TableCell>
                      <TableCell>{purchase.tokens}</TableCell>
                      <TableCell>£{Number(purchase.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            purchase.status === 'completed'
                              ? 'default'
                              : purchase.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(purchase.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Buyer Pro Subscriptions</CardTitle>
              <CardDescription>Recent Buyer Pro plan activations and renewals.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyerProSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-gray-500">
                        No Buyer Pro subscriptions found.
                      </TableCell>
                    </TableRow>
                  )}
                  {buyerProSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="font-medium">{sub.buyerName}</div>
                        <div className="text-xs text-gray-500">{sub.buyerEmail}</div>
                      </TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell>
                        {sub.price != null ? `£${Number(sub.price).toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell>{sub.interval ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'default'
                              : sub.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(sub.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }, [
    tokenPurchasesList,
    buyerProSubscriptions,
    loadTokenPurchases,
    loadBuyerProSubscriptions,
  ]);

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

  const renderCreatedOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Created Orders</h2>
          <p className="text-sm text-gray-500">All orders that have been created on the platform.</p>
        </div>
        <Button variant="outline" onClick={() => loadCreatedOrders()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {createdOrders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center text-sm text-gray-500">
              No orders found.
            </CardContent>
          </Card>
        ) : (
          createdOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{order.title}</h3>
                      <Badge variant={order.order_type === 'milestone' ? 'default' : 'secondary'} className="text-xs">
                        {order.order_type === 'milestone' ? 'Milestone' : 'Regular'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Order #{order.id.slice(-8)}
                    </div>
                  </div>
                  <Badge variant={
                    order.status === 'completed' ? 'default' :
                    order.status === 'in_progress' ? 'secondary' :
                    order.status === 'pending' ? 'outline' : 'destructive'
                  }>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-semibold">£{order.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderAcceptedOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accepted Orders</h2>
          <p className="text-sm text-gray-500">Orders that are in progress or completed.</p>
        </div>
        <Button variant="outline" onClick={() => loadAcceptedOrders()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {acceptedOrders.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center text-sm text-gray-500">
              No accepted orders found.
            </CardContent>
          </Card>
        ) : (
          acceptedOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{order.title}</h3>
                      <Badge variant={order.order_type === 'milestone' ? 'default' : 'secondary'} className="text-xs">
                        {order.order_type === 'milestone' ? 'Milestone' : 'Regular'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Order #{order.id.slice(-8)}
                    </div>
                  </div>
                  <Badge variant={
                    order.status === 'completed' ? 'default' :
                    order.status === 'in_progress' ? 'secondary' :
                    order.status === 'pending' ? 'outline' : 'destructive'
                  }>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-semibold">£{order.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex-none">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 min-h-0">
        {renderSidebar()}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-8">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'messages' && renderMessages()}
            {activeTab === 'approvals' && renderApprovals()}
            {activeTab === 'kyc' && renderKYC()}
            {activeTab === 'sellers' && renderSellers()}
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'orders_created' && renderCreatedOrders()}
            {activeTab === 'orders_accepted' && renderAcceptedOrders()}
            {activeTab === 'plans' && renderPlans()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </div>

      {/* Seller Details Modal */}
      <Dialog open={sellerDetailsModalOpen} onOpenChange={setSellerDetailsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Seller Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of seller activity and performance metrics.
            </DialogDescription>
          </DialogHeader>

          {selectedSellerDetails && (
            <div className="flex flex-col h-full max-h-[75vh] overflow-hidden">
              <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="bids">Bids ({selectedSellerDetails.recentBids.length})</TabsTrigger>
                  <TabsTrigger value="services">Services ({selectedSellerDetails.recentServices.length})</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio ({selectedSellerDetails.recentPortfolio.length})</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({selectedSellerDetails.recentReviews.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="profile" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-16 w-16">
                              <img
                                src={selectedSellerDetails.profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedSellerDetails.profile.id}`}
                                alt={selectedSellerDetails.profile.name}
                              />
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">{selectedSellerDetails.profile.name || 'Unnamed'}</h3>
                              <p className="text-gray-600">{selectedSellerDetails.profile.email}</p>
                              <p className="text-sm text-gray-500">@{selectedSellerDetails.profile.username}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-gray-500">Role</Label>
                              <p className="capitalize">{selectedSellerDetails.profile.role}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Verified</Label>
                              <p>{selectedSellerDetails.profile.is_verified ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Joined</Label>
                              <p>{new Date(selectedSellerDetails.profile.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Warnings</Label>
                              <p>{selectedSellerDetails.profile.warnings || 0}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Order Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{selectedSellerDetails.orderStats.total}</div>
                              <div className="text-sm text-gray-600">Total Orders</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{selectedSellerDetails.orderStats.completed}</div>
                              <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-600">{selectedSellerDetails.orderStats.inProgress}</div>
                              <div className="text-sm text-gray-600">In Progress</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">£{selectedSellerDetails.orderStats.earnings.toLocaleString()}</div>
                              <div className="text-sm text-gray-600">Earnings</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-gray-500">Bio</Label>
                            <p>{selectedSellerDetails.profile.bio || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Location</Label>
                            <p>{selectedSellerDetails.profile.location || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Company</Label>
                            <p>{selectedSellerDetails.profile.company || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Job Title</Label>
                            <p>{selectedSellerDetails.profile.job_title || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Website</Label>
                            <p>{selectedSellerDetails.profile.website || 'Not provided'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Phone</Label>
                            <p>{selectedSellerDetails.profile.phone || 'Not provided'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bids" className="space-y-4">
                    <div className="space-y-4">
                      {selectedSellerDetails.recentBids.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            No bids found for this seller.
                          </CardContent>
                        </Card>
                      ) : (
                        selectedSellerDetails.recentBids.map((bid: any) => (
                          <Card key={bid.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{bid.project?.title || 'Unknown Project'}</h4>
                                  <p className="text-sm text-gray-600">Bid Amount: £{bid.bid_amount}</p>
                                  <p className="text-sm text-gray-600">Status: <Badge variant={bid.status === 'accepted' ? 'default' : bid.status === 'rejected' ? 'destructive' : 'secondary'}>{bid.status}</Badge></p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(bid.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              {bid.message && (
                                <p className="text-sm text-gray-700 mt-2">{bid.message}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="services" className="space-y-4">
                    <div className="space-y-4">
                      {selectedSellerDetails.recentServices.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            No active services found for this seller.
                          </CardContent>
                        </Card>
                      ) : (
                        selectedSellerDetails.recentServices.map((service: any) => (
                          <Card key={service.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{service.title}</h4>
                                  <p className="text-sm text-gray-600">Price: £{service.price}</p>
                                  <p className="text-sm text-gray-600">Category: {service.category}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(service.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="portfolio" className="space-y-4">
                    <div className="space-y-4">
                      {selectedSellerDetails.recentPortfolio.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            No portfolio items found for this seller.
                          </CardContent>
                        </Card>
                      ) : (
                        selectedSellerDetails.recentPortfolio.map((item: any) => (
                          <Card key={item.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{item.title}</h4>
                                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                  <p className="text-sm text-gray-600">Category: {item.category}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-4">
                    <div className="space-y-4">
                      {selectedSellerDetails.recentReviews.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center text-gray-500">
                            No reviews found for this seller.
                          </CardContent>
                        </Card>
                      ) : (
                        selectedSellerDetails.recentReviews.map((review: any) => (
                          <Card key={review.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="font-medium">{review.reviewer?.name || 'Anonymous'}</span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-3 w-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700">{review.comment}</p>
                                </div>
                                <div className="text-xs text-gray-500 ml-4">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedSellerDetails.activityStats.bidsPlaced}</div>
                          <div className="text-sm text-gray-600">Bids Placed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedSellerDetails.activityStats.servicesListed}</div>
                          <div className="text-sm text-gray-600">Services Listed</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6 text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedSellerDetails.profile.warnings || 0}</div>
                          <div className="text-sm text-gray-600">Warnings</div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Last Active</span>
                            <span className="text-sm">{new Date(selectedSellerDetails.activityStats.lastActive).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Account Status</span>
                            <Badge variant={selectedSellerDetails.profile.banned ? 'destructive' : 'default'}>
                              {selectedSellerDetails.profile.banned ? 'Banned' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

