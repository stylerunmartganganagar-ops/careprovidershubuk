import { useState, useEffect } from 'react';
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
  ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBuyerProjects } from '../hooks/useProjects';
import { useServices } from '../hooks/useProjects';
import { useNavigate } from 'react-router-dom';

// ServiceCard component - enhanced version from SearchResults
const ServiceCard = ({ service }: { service: any }) => {
  // Use username directly from provider data (from database join)
  const displayUsername = service.provider?.username || 'adventurousdiamond48'; // Fallback to known username

  return (
    <Link to={`/service/${service.id}`} className="block">
      <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group cursor-pointer">
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
            // Fallback when no images
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

        <CardContent className="p-4">
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
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useBuyerProjects(user?.id);
  const { services, loading: servicesLoading } = useServices();

  // Empty arrays - ready for database queries
  const stats = {
    orders: { active: 0, completed: 0, totalSpent: 0, saved: 0 },
    activity: { searches: 0, messages: 0, reviews: 0, savedServices: 0 },
    profile: { completion: 0, level: 'New', memberSince: '2024' }
  };

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
      title: 'Saved Services',
      description: 'View saved favorites',
      icon: Heart,
      color: 'bg-red-500',
      href: '/saved-services'
    }
  ];

  const justForYouServices = services.slice(0, 6);

  const curatedFeaturedServices = services.filter(service => service.price > 500).slice(0, 6);
  const hasCuratedFeatured = curatedFeaturedServices.length > 0;
  const featuredServices = hasCuratedFeatured ? curatedFeaturedServices : services.slice(0, 6);

  const curatedBasedOnSearches = services.slice(6, 12);
  const hasCuratedSearchBased = curatedBasedOnSearches.length > 0;
  const basedOnSearchesServices = hasCuratedSearchBased ? curatedBasedOnSearches : services.slice(0, 6);

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
              <p className="text-blue-100 mb-4">
                Ready to find the perfect healthcare service provider for your business?
              </p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-white/20 text-white border-white/30">
                  {stats.profile.level} Member
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30">
                  Member since {stats.profile.memberSince}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">£{stats.orders.totalSpent.toLocaleString()}</div>
              <div className="text-blue-100">Total spent</div>
            </div>
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
          <div className="lg:col-span-2 space-y-8">
            {/* Just For You Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Just For You</h2>
                  <p className="text-sm text-gray-600">
                    Personalized recommendations based on your activity
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/services/all', { state: { services: justForYouServices, title: 'Just For You', subtitle: 'Personalized recommendations based on your activity' } })}
                  className="self-start sm:self-auto"
                >
                  View All
                </Button>
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading recommendations...
                </div>
              ) : justForYouServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {justForYouServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No personalized recommendations yet
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

            {/* Featured Services Carousel */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Featured Services</h2>
                  <p className="text-sm text-gray-600">
                    Handpicked top-rated healthcare service providers
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/services/all', { state: { services: featuredServices, title: 'Featured Services', subtitle: 'Handpicked top-rated healthcare service providers' } })}
                  className="self-start sm:self-auto"
                >
                  View All
                </Button>
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading featured services...
                </div>
              ) : featuredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredServices.map((service) => (
                    <div key={service.id} className="relative">
                      <ServiceCard service={service} />
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
                  <h2 className="text-xl font-bold">Based on Your Searches</h2>
                  <p className="text-sm text-gray-600">
                    More services related to your recent searches
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/services/all', { state: { services: basedOnSearchesServices, title: 'Based on Your Searches', subtitle: 'More services related to your recent searches' } })}
                  className="self-start sm:self-auto"
                >
                  View All
                </Button>
              </div>
              {servicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  Loading search-based services...
                </div>
              ) : basedOnSearchesServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Right Column - Recent Activity & Quick Actions */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Activity</h2>
                <Button variant="outline" size="sm" disabled>
                  View All
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center py-4 text-gray-500">
                      No recent activity
                    </div>
                  </div>
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
          </div>
        </div>
      </main>
      <Footer />
    </DashboardLayout>
  );
}
