import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Filter,
  Search,
  ArrowLeft,
  MessageSquare,
  Calendar,
  Award
} from 'lucide-react';
import { useServices } from '../hooks/useProjects';
import { useAvailableProjects } from '../hooks/useProjects';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';

interface ServiceCardProps {
  service: any;
  wrapperClassName?: string;
}

// ServiceCard component - simplified to use provider data directly
const ServiceCard = ({ service, wrapperClassName = 'flex-none w-[260px] sm:w-[300px] snap-start md:w-auto' }: ServiceCardProps) => {
  // Debug: Log what we receive
  console.log('ServiceCard received service:', {
    id: service.id,
    provider_id: service.provider_id,
    provider: service.provider,
    hasUsername: !!service.provider?.username
  });

  // Use username directly from provider data (from database join)
  const displayUsername = service.provider?.username || 'adventurousdiamond48'; // Fallback to known username

  console.log(`ServiceCard ${service.id}: Using username "${displayUsername}" from provider data`);

  return (
    <div className={wrapperClassName}>
      <Link to={`/service/${service.id}`} className="block h-full">
        <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group cursor-pointer">
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

            {/* Service Description Preview - REMOVED as per user request */}

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

// ProjectCard component for sellers
interface ProjectCardProps {
  project: any;
  wrapperClassName?: string;
}

const ProjectCard = ({ project, wrapperClassName = 'flex-none w-[260px] sm:w-[300px] snap-start md:w-auto' }: ProjectCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={wrapperClassName}>
      <Card className="h-full hover:shadow-md transition-shadow">
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
          <Button
            className="w-full"
            size="sm"
            onClick={() => navigate(`/project/${project.id}/bid`, { state: { from: `${location.pathname}${location.search}` } })}
          >
            Place Bid
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get('service') || '';
  const location = searchParams.get('location') || '';

  const [sortBy, setSortBy] = useState('relevance');
  const [filterBy, setFilterBy] = useState('all');

  const { user } = useAuth();
  const isSeller = user?.role === 'provider';
  const isBuyer = user?.role === 'client' || !user?.role;

  // Data hooks based on user role
  const { services, loading: servicesLoading } = useServices();
  const { projects: availableProjects, loading: projectsLoading } = useAvailableProjects(user?.id);

  const loading = servicesLoading || projectsLoading;

  // Get service display name
  const getServiceDisplayName = (serviceCode: string) => {
    const serviceMap: { [key: string]: string } = {
      'cqc': 'CQC Registration',
      'consulting': 'Business Consulting',
      'software': 'Care Software',
      'training': 'Training Services',
      'visa': 'Sponsor Visa',
      'accounting': 'Accounting'
    };
    return serviceMap[serviceCode] || serviceCode;
  };

  // Filter results by search query and location based on user role
  const filteredServices = services.filter(svc => {
    // Match service query against service title, description, features, or category
    const serviceMatch = !service || (
      svc.title.toLowerCase().includes(service.toLowerCase()) ||
      svc.description.toLowerCase().includes(service.toLowerCase()) ||
      (svc.tags && svc.tags.some(tag => tag.toLowerCase().includes(service.toLowerCase()))) ||
      svc.category.toLowerCase().includes(service.toLowerCase())
    );

    const locationMatch = !location || (svc.provider?.location && svc.provider.location.toLowerCase().includes(location.toLowerCase()));
    return serviceMatch && locationMatch;
  });

  const filteredProjects = availableProjects.filter(project => {
    // Match project query against project title, description, or category
    const projectMatch = !service || (
      project.title.toLowerCase().includes(service.toLowerCase()) ||
      project.description.toLowerCase().includes(service.toLowerCase()) ||
      project.category.toLowerCase().includes(service.toLowerCase())
    );

    const locationMatch = !location || project.location.toLowerCase().includes(location.toLowerCase());
    return projectMatch && locationMatch;
  });

  // Debug logging
  console.log('SearchResults Debug:', {
    userRole: user?.role,
    isSeller,
    isBuyer,
    searchQuery: service,
    availableProjectsCount: availableProjects.length,
    filteredProjectsCount: filteredProjects.length,
    servicesCount: services.length,
    filteredServicesCount: filteredServices.length,
    firstFewProjects: availableProjects.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      user_id: p.user_id,
      status: p.status,
      category: p.category
    }))
  });

  const resultsType = isSeller ? 'projects' : 'services';

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.budget || 0) - (b.budget || 0);
      case 'price-high':
        return (b.budget || 0) - (a.budget || 0);
      default:
        return 0;
    }
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.provider?.rating || 0) - (a.provider?.rating || 0);
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'reviews':
        return (b.provider?.review_count || 0) - (a.provider?.review_count || 0);
      default:
        return 0;
    }
  });

  const sortedResults = isSeller ? sortedProjects : sortedServices;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 overflow-x-hidden">
        {/* Mobile Search Bar */}
        <div className="md:hidden mb-6">
          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={isSeller ? "Search projects..." : "Search services..."}
                  className="w-full"
                  defaultValue={service}
                  onChange={(e) => {
                    const newQuery = e.target.value;
                    if (newQuery) {
                      navigate(`/searchresults?service=${encodeURIComponent(newQuery)}${location ? `&location=${encodeURIComponent(location)}` : ''}`);
                    } else {
                      navigate('/searchresults');
                    }
                  }}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input
                  type="text"
                  placeholder="Location"
                  className="w-full"
                  defaultValue={location}
                  onChange={(e) => {
                    const newLocation = e.target.value;
                    navigate(`/searchresults${service ? `?service=${encodeURIComponent(service)}` : ''}${newLocation ? `&location=${encodeURIComponent(newLocation)}` : ''}`);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="self-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {service ? `Search Results for "${service}"` : isSeller ? 'All Projects' : 'All Services'}
                {location && <span className="text-gray-600"> in {location}</span>}
              </h1>
              <p className="text-gray-600 mt-2">
                {sortedResults.length} {resultsType} available
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  {!isSeller && <SelectItem value="rating">Highest Rated</SelectItem>}
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  {!isSeller && <SelectItem value="reviews">Most Reviews</SelectItem>}
                </SelectContent>
              </Select>

              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading {resultsType}...
          </div>
        ) : (
          <div className="flex flex-wrap gap-6 justify-center md:justify-start">
            {sortedResults.map((item) => (
              isSeller ? (
                <ProjectCard key={item.id} project={item} />
              ) : (
                <ServiceCard key={item.id} service={item} />
              )
            ))}
          </div>
        )}

        {/* Load More */}
        {sortedResults.length >= 20 && !loading && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More {resultsType}
            </Button>
          </div>
        )}

        {/* No Results */}
        {!loading && sortedResults.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No {resultsType} found</h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or browse all {resultsType}.
            </p>
            <Button className="mt-4" onClick={() => navigate(-1)}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
}
