import { useState, useEffect } from 'react';
import { useAvailableProjects, useFeaturedProjects, useSearchBasedProjects } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Progress } from '../components/ui/progress';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
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
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { BidDialog } from '../components/BidDialog';
import { useAuth } from '../lib/auth.tsx';
import { Link, useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects: availableProjects, loading: projectsLoading, refetch: refetchProjects } = useAvailableProjects(user?.id);
  const { projects: featuredProjects, loading: featuredLoading } = useFeaturedProjects(user?.id);
  const { projects: searchBasedProjects, loading: searchLoading } = useSearchBasedProjects(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  console.log('SellerDashboard render:', { user: user?.id, userRole: user?.role });

  // Empty arrays - ready for database queries
  const stats = {
    earnings: {
      monthly: 0,
      weekly: 0,
      total: 0,
      pending: 0,
      available: 0
    },
    orders: {
      active: 0,
      completed: 0,
      cancelled: 0,
      inQueue: 0
    },
    reviews: {
      average: 0,
      total: 0,
      fiveStar: 0,
      responseTime: 0
    },
    profile: {
      completion: 0,
      level: 'New',
      badge: 'New Seller'
    }
  };

  // Handle search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching projects with query:', query, 'user ID:', user?.id);
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .neq('user_id', user?.id)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(9);

      if (error) throw error;
      console.log('Project search results:', projectsData);
      setSearchResults(projectsData || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Effect to handle search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    if (!user?.id) {
      setRecentMessages([]);
      setMessagesLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRecentMessages = async () => {
      try {
        setMessagesLoading(true);

        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            sender:users!messages_sender_id_fkey (id, name, username, avatar),
            receiver:users!messages_receiver_id_fkey (id, name, username, avatar)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        const conversationMap = new Map<string, any>();

        data?.forEach((message: any) => {
          const isSender = message.sender_id === user.id;
          const partner = isSender ? message.receiver : message.sender;
          if (!partner?.id) return;

          const partnerId = partner.id;
          const existing = conversationMap.get(partnerId);
          if (!existing || new Date(message.created_at) > new Date(existing.created_at)) {
            conversationMap.set(partnerId, {
              partnerId,
              partnerName: partner.name || partner.username || 'Unknown user',
              partnerAvatar: partner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              created_at: message.created_at,
              content: message.content,
              direction: isSender ? 'sent' : 'received'
            });
          }
        });

        const conversations = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);

        if (isMounted) {
          setRecentMessages(conversations);
        }
      } catch (err) {
        console.error('Error fetching recent messages:', err);
        if (isMounted) {
          setRecentMessages([]);
        }
      } finally {
        if (isMounted) {
          setMessagesLoading(false);
        }
      }
    };

    fetchRecentMessages();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Render search results or default content
  const renderSearchSection = () => {
    if (searchQuery) {
      // Show search results when searching
      if (isSearching) {
        return (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Searching for projects...
          </div>
        );
      }

      if (searchResults.length > 0) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2 flex-1 min-w-0">{project.title}</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      Search Match
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{project.category}</Badge>
                    <Badge
                      variant={
                        project.urgency === 'high' ? 'destructive' :
                        project.urgency === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {project.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {project.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-green-600">£{project.budget}</span>
                      <span className="text-gray-500">{project.budget_type}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{project.location}</span>
                      <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <BidDialog
                    projectId={project.id}
                    projectTitle={project.title}
                    onBidSubmitted={refetchProjects}
                    trigger={
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                        Place Bid
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }

      return (
        <div className="text-center py-8 text-gray-500">
          No projects found matching "{searchQuery}"
          <br />
          <span className="text-sm">Try different search terms or check back later for new projects.</span>
        </div>
      );
    }

    // Show default "Based on Your Searches" when not searching
    if (searchLoading) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading search-based projects...
        </div>
      );
    }

    if (searchBasedProjects.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchBasedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2 flex-1 min-w-0">{project.title}</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    Search Match
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{project.category}</Badge>
                  <Badge
                    variant={
                      project.urgency === 'high' ? 'destructive' :
                      project.urgency === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {project.urgency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {project.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-green-600">£{project.budget}</span>
                    <span className="text-gray-500">{project.budget_type}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{project.location}</span>
                    <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
                <BidDialog
                  projectId={project.id}
                  projectTitle={project.title}
                  onBidSubmitted={refetchProjects}
                  trigger={
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                      Place Bid
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-gray-500">
        No search-based projects available yet.
        <br />
        <span className="text-sm">Start searching for projects to see personalized recommendations.</span>
      </div>
    );
  };

  const quickActions = [
    {
      title: 'Create Service',
      description: 'Post your service offering',
      icon: Plus,
      color: 'bg-blue-500',
      href: '/create-service'
    },
    {
      title: 'My Services',
      description: 'View and edit your gigs',
      icon: Eye,
      color: 'bg-purple-500',
      href: '/seller/services'
    },
    {
      title: 'Browse Projects',
      description: 'Find new projects to bid on',
      icon: Search,
      color: 'bg-green-500',
      href: '/project-search'
    },
    {
      title: 'Orders Received',
      description: 'Manage projects you\'ve won',
      icon: Package,
      color: 'bg-indigo-500',
      href: '/seller/manage-orders'
    },
    {
      title: 'Manage Portfolio',
      description: 'Showcase your work',
      icon: ImageIcon,
      color: 'bg-orange-500',
      href: '/seller/portfolio'
    },
    {
      title: 'View Earnings',
      description: 'Check your revenue analytics',
      icon: DollarSign,
      color: 'bg-orange-500',
      href: '/seller/earnings'
    }
  ];

  const recentReviews = [];
  const performanceMetrics = [];

  return (
    <SellerDashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8 max-w-full overflow-hidden">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
              <p className="text-green-100 mb-4">
                You're a <span className="font-semibold text-white">Seller</span> - Find projects and grow your business on Providers Hub.
              </p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  Professional Seller
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30">
                  {stats.profile.badge}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">£{stats.earnings.monthly.toLocaleString()}</div>
              <div className="text-green-100">Earned this month</div>
            </div>
          </div>
        </section>
        {/* Search Bar */}
        <section className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Find Projects to Bid On</h2>
              <p className="text-gray-600">Search for projects that match your skills</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search projects by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>
                {isSearching ? 'Searching...' : `${searchResults.length} projects found`}
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold">£{stats.earnings.monthly.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0% from last month
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
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{stats.orders.active}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats.orders.inQueue} in queue
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
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold flex items-center">
                    {stats.reviews.average}
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 ml-1" />
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.reviews.total} reviews
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold">{stats.reviews.responseTime}h</p>
                  <p className="text-xs text-green-600 mt-1">
                    Excellent response rate
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Performance Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center py-8 text-gray-500">
              No performance metrics available
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Carousels */}
          <div className="lg:col-span-2 space-y-8">
            {/* Just For You Projects Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Projects to Bid For</h2>
                  <p className="text-sm text-gray-600">
                    Projects that match your skills and expertise
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  View All
                </Button>
              </div>
              {projectsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading available projects...
                </div>
              ) : availableProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProjects.slice(0, 6).map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2 flex-1 min-w-0">{project.title}</CardTitle>
                          <Badge className="bg-green-100 text-green-800 text-xs self-start sm:self-auto flex-shrink-0">
                            Open
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{project.category}</Badge>
                          <Badge
                            variant={
                              project.urgency === 'high' ? 'destructive' :
                              project.urgency === 'medium' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {project.urgency}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {project.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-green-600">£{project.budget}</span>
                            <span className="text-gray-500">{project.budget_type}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{project.location}</span>
                            <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <BidDialog
                          projectId={project.id}
                          projectTitle={project.title}
                          onBidSubmitted={refetchProjects}
                          trigger={
                            <Button className="w-full" size="sm">
                              Place Bid
                            </Button>
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No projects available for bidding at the moment.
                  <br />
                  <span className="text-sm">Check back later or update your skills to see more opportunities.</span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Featured Projects Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Featured Projects</h2>
                  <p className="text-sm text-gray-600">
                    High-value projects from verified clients
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="self-start sm:self-auto"
                >
                  View All
                </Button>
              </div>
              {featuredLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading featured projects...
                </div>
              ) : featuredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow border-yellow-200">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2 flex-1 min-w-0">{project.title}</CardTitle>
                          <div className="flex flex-col items-end space-y-1 self-start sm:self-auto flex-shrink-0">
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Featured
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Open
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">{project.category}</Badge>
                          <Badge
                            variant={
                              project.urgency === 'high' ? 'destructive' :
                              project.urgency === 'medium' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {project.urgency}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {project.description}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-green-600">£{project.budget}</span>
                            <span className="text-gray-500">{project.budget_type}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{project.location}</span>
                            <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <BidDialog
                          projectId={project.id}
                          projectTitle={project.title}
                          onBidSubmitted={refetchProjects}
                          trigger={
                            <Button className="w-full bg-yellow-600 hover:bg-yellow-700" size="sm">
                              Bid on Featured
                            </Button>
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No featured projects available at the moment.
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>

            {/* Based on Searches Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {searchQuery ? `Search Results for "${searchQuery}"` : 'Based on Your Searches'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {searchQuery
                      ? 'Projects matching your search criteria'
                      : 'Projects related to your recent search activity'
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="self-start sm:self-auto"
                >
                  View All
                </Button>
              </div>
              {renderSearchSection()}
              <div className="mt-4 flex items-center gap-2 justify-start sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          </div>

          {/* Right Column - Messages, Quick Actions, Earnings */}
          <div className="space-y-8">
            {/* Messages */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Messages</h2>
                <Button variant="outline" size="sm" disabled>
                  View All
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {messagesLoading ? (
                      <div className="text-center py-4 text-gray-500">
                        Loading messages...
                      </div>
                    ) : recentMessages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No messages yet
                      </div>
                    ) : (
                      recentMessages.map((message) => (
                        <div
                          key={message.partnerId}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/messages?with=${message.partnerId}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <img src={message.partnerAvatar} alt={message.partnerName} />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-sm truncate">{message.partnerName}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {message.direction === 'sent' ? 'You: ' : ''}{message.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
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

            {/* Earnings Summary */}
            <section>
              <h2 className="text-xl font-bold mb-4">Earnings</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available for withdrawal</span>
                      <span className="font-semibold text-green-600">£{stats.earnings.available.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending clearance</span>
                      <span className="font-semibold">£{stats.earnings.pending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total earned</span>
                      <span className="font-semibold">£{stats.earnings.total.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => navigate('/seller/earnings')}
                      >
                        Withdraw Earnings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Profile Completion */}
            <section>
              <h2 className="text-xl font-bold mb-4">Profile Completion</h2>
              <Card>
                <CardContent className="p-6">
                  <div 
                    className="flex justify-between items-center mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => navigate('/seller/update-profile')}
                  >
                    <span className="font-semibold">{stats.profile.completion}% Complete</span>
                    <Badge variant="secondary">{stats.profile.level}</Badge>
                  </div>
                  <Progress value={stats.profile.completion} className="mb-4 cursor-pointer" onClick={() => navigate('/seller/update-profile')} />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profile photo</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span>Description</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div 
                      className="flex justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
                      onClick={() => navigate('/seller/portfolio')}
                    >
                      <span>Portfolio</span>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex justify-between">
                      <span>Phone verification</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => navigate('/seller/update-profile')}
                  >
                    Complete Profile
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </SellerDashboardLayout>
  );
}
