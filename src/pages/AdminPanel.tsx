import { useCallback, useEffect, useRef, useState } from 'react';
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

type PaymentRecord = {
  id: string;
  order_id: string;
  amount: number;
  currency: string | null;
  status: string | null;
  created_at: string;
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
  tokens: number;
  amount: number;
  status: string | null;
};

type PlatformSettingsRow = {
  id: string;
  fb_pixel_id: string | null;
  gtm_id: string | null;
  ga_measurement_id: string | null;
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
};

type PaymentListItem = {
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

      const [{ data: ordersData, error: ordersError }, { data: milestoneOrdersData, error: milestoneOrdersError }, { data: paymentsData, error: paymentsError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.from('orders').select('status'),
        supabase.from('milestone_orders').select('status'),
        supabase
          .from('payments')
          .select('amount, created_at')
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
      if (paymentsError) throw paymentsError;
      if (usersError) throw usersError;

      const ordersByStatus = [...(ordersData || []), ...(milestoneOrdersData || [])].reduce((acc: Array<{ status: string; count: number }>, row: any) => {
        const status = row.status || 'unknown';
        const existing = acc.find((item) => item.status === status);
        if (existing) existing.count += 1;
        else acc.push({ status, count: 1 });
        return acc;
      }, []);

      const revenueBuckets = new Map<string, number>();
      (paymentsData || []).forEach((p: any) => {
        const date = new Date(p.created_at);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const prev = revenueBuckets.get(key) || 0;
        revenueBuckets.set(key, prev + Number(p.amount || 0));
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

  const handleViewSeller = async (sellerId: string) => {
    console.log('View seller:', sellerId);
    // TODO: Open seller details modal or navigate to seller profile
  };

  const handleWarnSeller = async (sellerId: string) => {
    console.log('Warn seller:', sellerId);
    // TODO: Send warning notification and increment warning count
    // For now, just show a confirmation
    if (window.confirm('Send warning to this seller?')) {
      // Update warning count in database
      // This would typically update a warnings table or field
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
  const [payments, setPayments] = useState<PaymentListItem[]>([]);

  // Seller plans (Token packages)
  const [sellerPlans, setSellerPlans] = useState<SellerPlanListItem[]>([]);

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
        }));

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
          };
        });

      const combined = [...serviceItems, ...projectItems]
        .sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
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

  useEffect(() => {
    let mounted = true;
    isMountedRef.current = true;

    const loadOverview = async () => {
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

        const usersCount = usersResult.count ?? 0;
        const providersCount = providersResult.count ?? 0;
        const ordersCount = ordersResult.count ?? 0;

        const { data: tokenPurchases, error: tokenPurchasesError } = await supabase
          .from('token_purchases')
          .select('tokens, amount, status')
          .returns<TokenPurchaseRecord[]>();

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

        if (isMountedRef.current) {
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

        setCreatedOrders(allOrders);
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
          existing.push(enriched as any);
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
          .select('id, name, email, is_verified, created_at, role, banned')
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
            const warnings = 0; // TODO: implement warnings system

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

    const loadPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id, order_id, amount, currency, status, created_at')
          .order('created_at', { ascending: false })
          .limit(50)
          .returns<PaymentRecord[]>();
        if (error) throw error;
        const rows: PaymentListItem[] = (data || []).map((p) => ({
          id: p.id,
          orderId: p.order_id,
          seller: '-',
          buyer: '-',
          amount: Number(p.amount ?? 0),
          fee: Math.round(Number(p.amount ?? 0) * 0.1),
          netAmount: Math.round(Number(p.amount ?? 0) * 0.9),
          status: (p.status ?? 'pending') as PaymentListItem['status'],
          date: p.created_at,
          dueDate: p.created_at,
        }));
        if (isMountedRef.current) setPayments(rows);
      } catch (e) {
        console.error('Error loading payments', e);
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
        const rows: SellerPlanListItem[] = (data || []).map((pl) => ({
          id: pl.id,
          name: pl.name,
          tokens: pl.tokens,
          price: pl.price,
          description: pl.description,
          activePurchases: Number(pl.active_purchases ?? 0),
          revenue: Number(pl.total_revenue ?? 0),
          popular: Boolean(pl.is_popular),
        }));
        if (isMountedRef.current) setSellerPlans(rows);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { loadOverview(); loadSellers(); loadApprovals(); loadUsers(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => { loadMessages(); loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { loadPayments(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_purchases' }, () => { loadOverview(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadOverview(); loadCreatedOrders(); loadAcceptedOrders(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => { loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => { loadApprovals(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => { loadReviews(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => { loadReportsAnalytics(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_plans' }, () => { loadPlans(); })
      .subscribe();

    // Call all load functions
    loadOverview();
    loadApprovals();
    loadMessages();
    loadSellers();
    loadCreatedOrders();
    loadAcceptedOrders();
    loadPayments();
    loadPlans();
    loadUsers();
    loadReviews();
    loadReportsAnalytics();

    return () => {
      mounted = false;
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [loadUsers, loadReviews, loadReportsAnalytics]);

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

  const renderSettings = () => {
    const [fb, setFb] = useState('');
    const [gtm, setGtm] = useState('');
    const [ga, setGa] = useState('');
    const [rowId, setRowId] = useState<string | null>(null);

    useEffect(() => {
      (async () => {
        try {
          const { data } = await supabase
            .from('platform_settings')
            .select('id, fb_pixel_id, gtm_id, ga_measurement_id')
            .order('updated_at', { ascending: false })
            .limit(1)
            .returns<PlatformSettingsRow[]>();
          const row = data?.[0] ?? null;
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
      const payload: Database['public']['Tables']['platform_settings']['Insert'] = {
        fb_pixel_id: fb || null,
        gtm_id: gtm || null,
        ga_measurement_id: ga || null,
        id: rowId || undefined,
      };
      const { error, data } = await supabase
        .from('platform_settings')
        .upsert(payload)
        .select()
        .single<PlatformSettingsRow>();
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

  const renderMessages = () => (
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
          conversations.map((conversation) => (
            <Card key={conversation.conversationId}>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Participants</div>
                    <div className="font-semibold text-gray-900">
                      {conversation.participants.join('  B7 ')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{conversation.totalMessages} messages</div>
                </div>

                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Last message</div>
                  <div className="text-sm text-gray-700 line-clamp-3">
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
                        <DialogTitle>Conversation Details</DialogTitle>
                      </DialogHeader>
                      <div className="text-sm text-gray-500 mb-4">
                        Participants: {conversation.participants.join('  B7 ')}
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                        {(conversationMessages[conversation.conversationId] ?? []).map((msg) => (
                          <div key={msg.id} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">{msg.sender}</span>
                              <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                        ))}
                        {(conversationMessages[conversation.conversationId] ?? []).length === 0 && (
                          <div className="text-sm text-gray-500">No messages available for this conversation.</div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports &amp; Analytics</h2>
          <p className="text-sm text-gray-500">Key activity across orders, revenue, and new signups.</p>
        </div>
        <Button variant="outline" onClick={() => loadReportsAnalytics()} disabled={reportsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${reportsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-2">Orders by status</div>
            <div className="space-y-3">
              {reportsData.ordersByStatus.length === 0 ? (
                <p className="text-sm text-gray-500">No order data yet.</p>
              ) : (
                reportsData.ordersByStatus.map((row) => (
                  <div key={row.status} className="flex items-center justify-between">
                    <span className="capitalize">{row.status}</span>
                    <Badge variant="outline">{row.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-2">Monthly revenue (£)</div>
            {reportsData.monthlyRevenue.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {reportsData.monthlyRevenue.slice(-6).map((row) => (
                  <div key={row.month} className="flex items-center justify-between">
                    <span>{row.month}</span>
                    <span className="font-medium">£{row.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500 mb-2">Recent signups</div>
            {reportsData.recentSignups.length === 0 ? (
              <p className="text-sm text-gray-500">No recent users.</p>
            ) : (
              <div className="space-y-3">
                {reportsData.recentSignups.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {reportsLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Orders overview</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {reportsData.ordersByStatus.map((item) => (
                    <li key={item.status}>{item.status}: {item.count}</li>
                  ))}
                  {reportsData.ordersByStatus.length === 0 && <li>No data available.</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Top insights</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Revenue tracked across {reportsData.monthlyRevenue.length} month(s).</li>
                  <li>{reportsData.recentSignups.length} new users in the latest fetch.</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

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
                      <span className="font-semibold">{approval.user.name}</span>
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
                {seller.warnings > 0 && (
                  <Badge variant="destructive">{seller.warnings}</Badge>
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
          </div>
        </div>
      </div>
    </div>
  );
}
function handleReject(approval: ApprovalItem): void {
  throw new Error('Function not implemented.');
}

function loadOverview(): void {
  throw new Error('Function not implemented.');
}

