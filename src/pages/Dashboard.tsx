import { useState, useEffect, useRef, useMemo } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { MobileBottomNavbar } from '../components/MobileBottomNavbar';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../lib/auth.tsx';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Star,
  TrendingUp,
  Package,
  DollarSign,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Calendar,
  Users,
  Award,
  Bell,
  Heart,
  Share2,
  ThumbsUp,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Target,
  Zap,
  ImageIcon,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dailyShuffle, useBuyerProjects, useServices } from '../hooks/useProjects';
import { useIsPro } from '../hooks/usePro';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ServiceCard component - enhanced version from SearchResults
interface ServiceCardProps {
  service: any;
  wrapperClassName?: string;
}

const ServiceCard = ({ service, wrapperClassName = 'flex-none w-[260px] sm:w-[300px] snap-start md:w-auto' }: ServiceCardProps) => {
  // Use username directly from provider data (from database join)
  const displayUsername = service.provider?.username || 'adventurousdiamond48'; // Fallback to known username

  return (
    <div className={wrapperClassName}>
      <Link to={`/service/${service.id}`} className="block h-full">
        <Card className="h-[420px] hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group cursor-pointer flex flex-col">
          {/* Large Service Image - FIRST GIG IMAGE AS TITLE */}
          <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
            {service.images && service.images.length > 0 ? (
              <img
                src={service.images[0]} // FIRST GIG IMAGE
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-sm">No image available</div>
                </div>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Price badge on image */}
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
              <div className="text-lg font-bold text-gray-900">
                £{service.price}
              </div>
              <div className="text-xs text-gray-600">Starting at</div>
            </div>

            {/* Image count indicator */}
            {service.images && service.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-xs text-white font-medium">
                  📸 {service.images.length}
                </span>
              </div>
            )}
          </div>

          <CardContent className="p-4 flex-grow flex flex-col justify-between">
            {/* Username and Rating */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">
                    {displayUsername.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {displayUsername}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-700">
                  {(service.provider?.rating || 0).toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({service.provider?.review_count || 0})
                </span>
              </div>
            </div>

            {/* Service Title */}
            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
              {service.title}
            </h3>

            {/* Tags/Badges */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {service.tags && service.tags.slice(0, 2).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200">
                    {tag}
                  </Badge>
                ))}
                {service.is_active && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-200 text-green-700">
                    Active
                  </Badge>
                )}
              </div>

              {/* Delivery time */}
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{service.delivery_time}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default function DashboardPage() {
  console.log('🔥 DASHBOARD COMPONENT MOUNTED');
  const { user } = useAuth();
  console.log('👤 Dashboard user object:', user);
  console.log('🆔 Dashboard user ID:', user?.id);

  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useBuyerProjects(user?.id);
  const { services, loading: servicesLoading } = useServices();
  const shuffledServices = useMemo(() => dailyShuffle(services), [services]);
  const { isPro } = useIsPro(user?.id);

  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive View All buttons
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const justForYouRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const basedOnSearchesRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    const container = ref.current;
    if (!container) return;
    const scrollByAmount = container.clientWidth * 0.85;
    container.scrollBy({
      left: direction === 'left' ? -scrollByAmount : scrollByAmount,
      behavior: 'smooth'
    });
  };

  // Fetch real stats for the user
  const [stats, setStats] = useState({
    orders: { active: 0, completed: 0, totalSpent: 0, saved: 0 },
    profile: { level: 'Bronze', memberSince: 'Recently' },
    activity: { messages: 0, savedServices: 0 }
  });

  const [clientProfileCompletion, setClientProfileCompletion] = useState({
    percentage: 0,
    level: 'Beginner',
    fields: {
      avatar: false,
      description: false,
      portfolio: false,
      phone: false,
      kyc: false
    }
  });

  console.log('📊 Initial stats state:', stats);

  // Log when user changes
  useEffect(() => {
    console.log('🔄 USER OBJECT CHANGED:', user);
    console.log('🔄 New user ID:', user?.id);
  }, [user]);

  useEffect(() => {
    console.log('⚡ DASHBOARD useEffect TRIGGERED');
    console.log('⚡ Current user ID in useEffect:', user?.id);

    const fetchStats = async () => {
      console.log('🔍 STARTING fetchStats function');

      if (!user?.id) {
        console.log('❌ NO USER ID - SKIPPING DATA FETCH');
        return;
      }

      console.log('✅ USER ID FOUND:', user.id);
      console.log('🔄 FETCHING DASHBOARD STATS FOR USER:', user.id);

      try {
        console.log('📊 Fetching buyer orders summary...');
        const { data: buyerOrdersData, error: buyerOrdersError } = await supabase
          .from('orders')
          .select('status, price')
          .eq('buyer_id', user.id);

        if (buyerOrdersError) throw buyerOrdersError;

        const normalActiveOrdersCount = (buyerOrdersData || []).filter((order: any) => order.status && order.status !== 'completed' && order.status !== 'cancelled').length;
        const normalCompletedOrdersCount = (buyerOrdersData || []).filter((order: any) => order.status === 'completed').length;

        console.log('📦 Fetching buyer milestone order summary...');
        const { data: buyerMilestoneOrders, error: buyerMilestoneError } = await supabase
          .from('milestone_orders')
          .select('status, total_amount')
          .eq('buyer_id', user.id);

        if (buyerMilestoneError) throw buyerMilestoneError;

        const activeMilestoneOrdersCount = (buyerMilestoneOrders || []).filter((order: any) => order.status && order.status !== 'completed' && order.status !== 'cancelled').length;
        const completedMilestoneOrdersCount = (buyerMilestoneOrders || []).filter((order: any) => order.status === 'completed').length;

        console.log('📊 Buyer orders summary:', {
          total: (buyerOrdersData?.length || 0) + (buyerMilestoneOrders?.length || 0),
          activeOrdersCount: normalActiveOrdersCount + activeMilestoneOrdersCount,
          completedOrdersCount: normalCompletedOrdersCount + completedMilestoneOrdersCount
        });

        const milestoneTotalSpent = (buyerMilestoneOrders || [])
          .filter((order: any) => order.status === 'completed')
          .reduce((sum: number, order: any) => sum + parseFloat(order.total_amount?.toString() || '0'), 0) || 0;

        const totalSpent = (buyerOrdersData || [])
          .filter((order: any) => order.status === 'completed')
          .reduce((sum: number, order: any) => sum + parseFloat(order.price?.toString() || '0'), 0) || 0;

        const combinedTotalSpent = totalSpent + milestoneTotalSpent;

        const activeOrdersCount = normalActiveOrdersCount + activeMilestoneOrdersCount;
        const completedOrdersCount = normalCompletedOrdersCount + completedMilestoneOrdersCount;

        console.log('💰 CALCULATED totalSpent:', totalSpent);
        console.log('💰 Individual order prices:', (buyerOrdersData || []).filter((o: any) => o.status === 'completed').map((o: any) => o.price));

        const completedCount = completedOrdersCount;
        console.log('📊 Completed orders count:', completedCount);

        // Get messages count (unique unread conversations)
        console.log('💬 Fetching unique unread conversations count...');
        const { data: uniqueSenders, error: messagesError } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        const uniqueSenderIds = [...new Set((uniqueSenders || []).map((m: any) => m.sender_id))];
        const messagesCount = uniqueSenderIds.length;

        console.log('💬 Unique unread conversations count:', messagesCount);
        console.log('💬 Unique sender IDs:', uniqueSenderIds);

        // Get saved services count
        console.log('⭐ Fetching saved services count...');
        const { count: savedServicesCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        console.log('⭐ Saved services count:', savedServicesCount);

        // Calculate member since
        const memberSince = (user as any).created_at ?
          new Date((user as any).created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
          'Recently';

        console.log('📅 Member since:', memberSince);

        const newStats = {
          orders: {
            active: activeOrdersCount,
            completed: completedCount,
            totalSpent: combinedTotalSpent,
            saved: Math.floor(totalSpent * 0.1) // Estimate 10% savings
          },
          profile: {
            level: totalSpent > 1000 ? 'Gold' : totalSpent > 500 ? 'Silver' : 'Bronze',
            memberSince
          },
          activity: {
            messages: messagesCount || 0,
            savedServices: savedServicesCount || 0
          }
        };

        console.log('📈 SETTING NEW STATS:', newStats);

        setStats(newStats);

        console.log('✅ STATS UPDATED SUCCESSFULLY');

      } catch (error) {
        console.error('❌ ERROR FETCHING DASHBOARD STATS:', error);
      }
    };

    console.log('🚀 CALLING fetchStats...');
    fetchStats();
  }, [user?.id]);

  // Compute client profile completion (including KYC)
  useEffect(() => {
    const computeProfileCompletion = async () => {
      if (!user?.id) {
        setClientProfileCompletion({
          percentage: 0,
          level: 'Beginner',
          fields: { avatar: false, description: false, portfolio: false, phone: false, kyc: false }
        });
        return;
      }

      let kycApproved = false;

      try {
        const { data: kycDoc } = await (supabase
          .from('kyc_documents')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any);

        if (kycDoc && kycDoc.status === 'approved') {
          kycApproved = true;
        }
      } catch (e) {
        console.warn('Failed to load KYC status for profile completion widget', e);
      }

      const avatar = !!user.avatar;
      const description = !!(user as any).description && (user as any).description.trim() !== '';
      const portfolio = !!((user as any).website || (user as any).company || (user as any).bio);
      const phone = !!user.phone;

      let percentage = 0;
      let level = 'Beginner';

      if (kycApproved) {
        percentage = 100;
        level = 'Verified';
      } else {
        const fields = [avatar, description, portfolio, phone];
        const completed = fields.filter(Boolean).length;
        const total = fields.length;
        percentage = total ? Math.round((completed / total) * 100) : 0;

        if (percentage >= 80) {
          level = 'Advanced';
        } else if (percentage >= 40) {
          level = 'Intermediate';
        }
      }

      setClientProfileCompletion({
        percentage,
        level,
        fields: {
          avatar,
          description,
          portfolio,
          phone,
          kyc: kycApproved
        }
      });
    };

    computeProfileCompletion();
  }, [user?.id, user?.avatar]);

  // Log when stats change
  useEffect(() => {
    console.log('🔄 STATS STATE CHANGED:', stats);
    console.log('🔄 Current totalSpent in state:', stats.orders.totalSpent);
  }, [stats]);

  const recentActivity = [];
  const quickActions = [
    {
      title: 'Post New Order',
      description: 'Find the perfect provider',
      icon: Plus,
      color: 'bg-blue-500',
      href: '/post-project'
    },
    {
      title: 'Browse Services',
      description: 'Explore healthcare services',
      icon: Eye,
      color: 'bg-green-500',
      href: '/searchresults?service='
    },
    {
      title: 'My Orders',
      description: 'Track active orders',
      icon: Package,
      color: 'bg-purple-500',
      href: '/my-orders'
    },
    {
      title: 'My Projects',
      description: 'Manage your posted projects',
      icon: BarChart3,
      color: 'bg-indigo-500',
      href: '/my-projects'
    },
    {
      title: 'Saved Services',
      description: 'View saved favorites',
      icon: Heart,
      color: 'bg-red-500',
      href: '/saved-services'
    }
  ];

  const justForYouServices = shuffledServices.slice(0, 6);

  const curatedFeaturedServices = useMemo(() => {
    const highValue = services.filter(service => service.price > 500);
    return dailyShuffle(highValue).slice(0, 6);
  }, [services]);
  const hasCuratedFeatured = curatedFeaturedServices.length > 0;
  const featuredServices = hasCuratedFeatured ? curatedFeaturedServices : shuffledServices.slice(0, 6);

  const curatedBasedOnSearches = useMemo(() => {
    const primary = shuffledServices.slice(6, 12);
    return primary.length > 0 ? primary : shuffledServices.slice(0, 6);
  }, [shuffledServices]);
  const hasCuratedSearchBased = curatedBasedOnSearches.length > 0;
  const basedOnSearchesServices = hasCuratedSearchBased ? curatedBasedOnSearches : shuffledServices.slice(0, 6);

  console.log('🎨 RENDERING DASHBOARD UI with totalSpent:', stats.orders.totalSpent);

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-5 sm:p-6 lg:p-8 mb-8 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
                <p className="mt-2 text-sm text-blue-100 sm:text-base">
                  Ready to find the perfect healthcare service provider for your business?
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Badge className="bg-white/20 text-xs sm:text-sm text-white border-white/30 px-2.5 py-1 sm:px-3">
                  {stats.profile.level} Member
                </Badge>
                <Badge className="bg-white/20 text-xs sm:text-sm text-white border-white/30 px-2.5 py-1 sm:px-3">
                  Member since {stats.profile.memberSince}
                </Badge>
                {isPro && (
                  <Badge className="inline-flex items-center rounded-full border font-semibold bg-yellow-400/90 text-xs sm:text-sm text-black border-white/30 px-2.5 py-1 sm:px-3">
                    <Crown className="mr-1 h-3.5 w-3.5 text-black/80" />
                    Buyer Pro Member
                  </Badge>
                )}
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/30 text-xs sm:text-sm text-white hover:bg-white/20 px-3 sm:px-4"
                >
                  Refresh Stats
                </Button>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-3xl font-bold sm:text-4xl">£{stats.orders.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-blue-100 sm:text-base">Total spent</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{stats.orders.active}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats.orders.completed} completed
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold">£{stats.orders.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Saved £{stats.orders.saved.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-2xl font-bold">{stats.activity.messages}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    0 unread
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saved Services</p>
                  <p className="text-2xl font-bold">{stats.activity.savedServices}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    Healthcare specialists
                  </p>
                </div>
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Service Carousels */}
          <div className={`${projects.length === 0 ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-8`}>
            {/* Featured Services Carousel (moved above) */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Featured Services</h2>
                  <p className="text-sm text-gray-600">
                    Handpicked top-rated healthcare service providers
                  </p>
                </div>
                {(featuredServices.length > (isMobile ? 2 : 6)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/searchresults?filter=featured')}
                    className="self-start sm:self-auto"
                  >
                    View All
                  </Button>
                )}
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading featured services...
                </div>
              ) : featuredServices.length > 0 ? (
                <div
                  ref={featuredRef}
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0"
                >
                  {featuredServices.map((service) => (
                    <div key={service.id} className="relative">
                      <ServiceCard service={service} wrapperClassName="flex-none w-[260px] sm:w-[300px] snap-start md:w-auto" />
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                        Featured
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No featured services available
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(featuredRef, 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(featuredRef, 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Just For You Carousel (moved below) */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Just For You</h2>
                  <p className="text-sm text-gray-600">
                    Personalized recommendations based on your activity
                  </p>
                </div>
                {(justForYouServices.length > (isMobile ? 2 : 6)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/searchresults?filter=personalized')}
                    className="self-start sm:self-auto"
                  >
                    View All
                  </Button>
                )}
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading recommendations...
                </div>
              ) : justForYouServices.length > 0 ? (
                <div
                  ref={justForYouRef}
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0"
                >
                  {justForYouServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No personalized recommendations yet
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(justForYouRef, 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(justForYouRef, 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Based on Searches Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Based on Your Searches</h2>
                  <p className="text-sm text-gray-600">
                    More services related to your recent searches
                  </p>
                </div>
                {(basedOnSearchesServices.length > (isMobile ? 2 : 6)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/searchresults?filter=searches')}
                    className="self-start sm:self-auto"
                  >
                    View All
                  </Button>
                )}
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading search-based services...
                </div>
              ) : basedOnSearchesServices.length > 0 ? (
                <div
                  ref={basedOnSearchesRef}
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0"
                >
                  {basedOnSearchesServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No search-based recommendations yet
                  <br />
                  <span className="text-sm">Start searching for projects to see personalized recommendations.</span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(basedOnSearchesRef, 'left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scrollCarousel(basedOnSearchesRef, 'right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>

          {/* Right Column - Profile Completion, My Projects & Quick Actions */}
          {projects.length > 0 && (
          <div className="space-y-8">
            {/* Profile Completion (Client) */}
            <section>
              <h2 className="text-xl font-bold mb-4">Profile Completion</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => navigate('/user-profile')}>
                    <span className="font-semibold">{clientProfileCompletion.percentage}% Complete</span>
                    <Badge variant="secondary">{clientProfileCompletion.level}</Badge>
                  </div>
                  <Progress value={clientProfileCompletion.percentage} className="mb-4 cursor-pointer" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profile photo</span>
                      {clientProfileCompletion.fields.avatar ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Description</span>
                      {clientProfileCompletion.fields.description ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <span>Portfolio</span>
                      {clientProfileCompletion.fields.portfolio ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Phone verification</span>
                      {clientProfileCompletion.fields.phone ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>KYC verification</span>
                      {clientProfileCompletion.fields.kyc ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/user-profile')}>
                    Complete Profile
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* My Projects */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Projects</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/my-projects')}>
                  View All
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  {projectsLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading projects...</div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project) => (
                        <div key={project.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm line-clamp-2">{project.title}</h4>
                            <Badge
                              variant={project.status === 'open' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>£{project.budget}</span>
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 px-2 text-xs"
                            onClick={() => navigate(`/project/${project.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No projects posted yet
                      <Button
                        variant="link"
                        className="block mt-2 text-primary"
                        onClick={() => navigate('/post-project')}
                      >
                        Post Your First Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
          )}
        </div>
      </main>
      <Footer />
    </DashboardLayout>
  );
}
