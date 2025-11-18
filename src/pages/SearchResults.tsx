import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import {
  Star,
  Clock,
  Search,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { dailyShuffle, useServices, useAvailableProjects, useFeaturedProjects, useSearchBasedProjects } from '../hooks/useProjects';
import { useAuth } from '../lib/auth.tsx';
import { Crown } from 'lucide-react';
import { useIsPro } from '../hooks/usePro';

interface ServiceCardProps {
  service: any;
  wrapperClassName?: string;
}

const serviceIsOnline = (service: any) => {
  if (!service) return false;
  const provider = service.provider || {};
  const providerMeta = provider.raw_user_meta_data || provider.user_metadata || {};
  const flags = [
    provider.is_online,
    provider.isOnline,
    provider.online,
    provider.available,
    provider.status === 'online',
    providerMeta.is_online,
    providerMeta.online,
    service.is_active,
  ];
  return flags.some((flag) => Boolean(flag));
};

const getServiceLocation = (service: any) => {
  if (!service) return '';
  const providerLocation = service.provider?.location || service.provider?.raw_user_meta_data?.location;
  return (providerLocation || service.location || '').trim();
};

const getProjectLocation = (project: any) => (project?.location || '').trim();

// ServiceCard component - simplified to use provider data directly
const ServiceCard = ({ service, wrapperClassName = 'w-full' }: ServiceCardProps) => {
  const displayUsername = service.provider?.username || 'adventurousdiamond48';

  const isOnline = serviceIsOnline(service);

  return (
    <div className={wrapperClassName}>
      <Link to={`/service/${service.id}`} className="block h-full">
        <Card className="h-full min-h-[420px] hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden group cursor-pointer flex flex-col">
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

            {/* Online indicator */}
            {isOnline && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-green-50/90 border border-green-200 rounded-full px-2 py-1 text-xs font-medium text-green-700 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Online now
              </div>
            )}

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

const ProjectCard = ({ project, wrapperClassName = 'w-full' }: ProjectCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro } = useIsPro(project?.buyer_id);

  return (
    <div className={wrapperClassName}>
      <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <CardTitle className="text-base line-clamp-2 flex-1 min-w-0 flex items-center gap-2">
              {project.title}
              {isPro && <Crown className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            <Badge className="bg-green-100 text-green-800 text-xs self-start sm:self-auto flex-shrink-0">
              Open
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">{project.category}</Badge>
            {project.subcategory && (
              <Badge variant="outline" className="text-xs">{project.subcategory}</Badge>
            )}
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
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              View Full Project Details
            </Button>
            <Button
              className="w-full"
              size="sm"
              onClick={() => navigate(`/project/${project.id}/bid`, { state: { from: `${location.pathname}${location.search}` } })}
            >
              Place Bid
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

type FilterOption = 'top-rated' | 'active-now' | 'rating-high-low' | 'price-high-low' | 'price-low-high';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get('service') || '';
  const serviceLower = service.toLowerCase();
  const location = searchParams.get('location') || '';
  const filterParam = searchParams.get('filter') || '';

  const { user } = useAuth();
  const isSeller = user?.role === 'provider';
  const isBuyer = user?.role === 'client' || !user?.role;

  const FEATURED_PROJECTS_LABEL = 'Featured Projects';
  const PROJECTS_TO_BID_FOR_LABEL = 'Projects to Bid For';
  const BASED_ON_SEARCHES_LABEL = 'Based on Your Searches';

  const isFeaturedProjectsView = isSeller && service === FEATURED_PROJECTS_LABEL;
  const isProjectsToBidForView = isSeller && service === PROJECTS_TO_BID_FOR_LABEL;
  const isBasedOnSearchesView = isSeller && service === BASED_ON_SEARCHES_LABEL;

  // Data hooks based on user role
  const { services, loading: servicesLoading } = useServices();
  const shuffledServices = useMemo(() => dailyShuffle(services), [services]);
  const { projects: availableProjects, loading: projectsLoading } = useAvailableProjects(user?.id);
  const { projects: featuredProjects, loading: featuredProjectsLoading } = useFeaturedProjects(user?.id);
  const { projects: searchBasedProjects, loading: searchBasedProjectsLoading } = useSearchBasedProjects(user?.id);

  const isPersonalizedFilter = filterParam === 'personalized';
  const isSearchesFilter = filterParam === 'searches';

  const personalizedServiceIds = useMemo(() => {
    if (!isBuyer || services.length === 0) return new Set<string>();
    const curated = shuffledServices.slice(0, 6);
    return new Set(curated.map((svc: any) => svc.id));
  }, [shuffledServices, isBuyer]);

  const searchesServiceIds = useMemo(() => {
    if (!isBuyer || services.length === 0) return new Set<string>();
    const curated = shuffledServices.slice(6, 12);
    const fallback = shuffledServices.slice(0, 6);
    const source = curated.length > 0 ? curated : fallback;
    return new Set(source.map((svc: any) => svc.id));
  }, [shuffledServices, isBuyer]);

  const disableTopRatedThreshold = filterParam === 'featured' || isPersonalizedFilter || isSearchesFilter;

  const loading = servicesLoading || projectsLoading || featuredProjectsLoading || searchBasedProjectsLoading;

  const [activeFilter, setActiveFilter] = useState<FilterOption>(() => filterParam === 'featured' ? 'rating-high-low' : 'top-rated');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setActiveFilter(filterParam === 'featured' ? 'rating-high-low' : 'top-rated');
    setPage(1);
  }, [filterParam]);

  useEffect(() => {
    setPage(1);
  }, [service, location, selectedLocations, activeFilter, isSeller]);

  // Filter results by search query and location based on user role
  const ukCities = useMemo(() => (
    [
      'London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Newcastle',
      'Nottingham', 'Leicester', 'Coventry', 'Sunderland', 'Brighton', 'Hull', 'Plymouth', 'Stoke-on-Trent',
      'Wolverhampton', 'Derby', 'Southampton', 'Portsmouth', 'Reading', 'Cardiff', 'Edinburgh', 'Glasgow'
    ]
  ), []);

  const filteredServices = services.filter(svc => {
    // Match service query against service title, description, features, or category
    const serviceMatch = !service || (
      svc.title.toLowerCase().includes(serviceLower) ||
      svc.description.toLowerCase().includes(serviceLower) ||
      (svc.tags && svc.tags.some(tag => tag.toLowerCase().includes(serviceLower))) ||
      svc.category.toLowerCase().includes(serviceLower)
    );

    const locationMatchFromQuery = !location || (svc.provider?.location && svc.provider.location.toLowerCase().includes(location.toLowerCase()));
    const locationMatchFilter = selectedLocations.length === 0 || selectedLocations.includes(getServiceLocation(svc));
    const featuredMatch = filterParam !== 'featured'
      ? true
      : svc.is_featured === true && (!svc.featured_until || new Date(svc.featured_until) > new Date());
    const curatedMatch = isPersonalizedFilter
      ? personalizedServiceIds.has(svc.id)
      : isSearchesFilter
        ? searchesServiceIds.has(svc.id)
        : true;
    return serviceMatch && locationMatchFromQuery && locationMatchFilter && featuredMatch && curatedMatch;
  });

  const projectSource = isSeller
    ? isFeaturedProjectsView
      ? featuredProjects
      : isProjectsToBidForView
        ? availableProjects
        : isBasedOnSearchesView
          ? searchBasedProjects
          : availableProjects
    : [];

  const filteredProjects = projectSource.filter(project => {
    const ignoreTextMatch = isFeaturedProjectsView || isProjectsToBidForView || isBasedOnSearchesView;

    // Match project query against project title, description, or category
    const projectMatch = ignoreTextMatch || !service ? true : (
      project.title.toLowerCase().includes(serviceLower) ||
      project.description.toLowerCase().includes(serviceLower) ||
      project.category.toLowerCase().includes(serviceLower) ||
      (project.subcategory ? project.subcategory.toLowerCase().includes(serviceLower) : false)
    );

    const locationMatchFromQuery = !location || project.location.toLowerCase().includes(location.toLowerCase());
    const locationMatchFilter = selectedLocations.length === 0 || selectedLocations.includes(getProjectLocation(project));
    const featuredMatch = filterParam !== 'featured'
      ? true
      : project.is_featured === true && (!project.featured_until || new Date(project.featured_until) > new Date());
    return projectMatch && locationMatchFromQuery && locationMatchFilter && featuredMatch;
  });

  const applyServiceFilters = useMemo(() => {
    let servicesList = dailyShuffle(filteredServices);
    switch (activeFilter) {
      case 'active-now':
        servicesList = servicesList.filter(serviceIsOnline);
        servicesList.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
        break;
      case 'top-rated':
        if (!disableTopRatedThreshold) {
          const highRated = servicesList.filter((svc) => (svc.provider?.rating || 0) >= 4.5);
          if (highRated.length > 0) {
            servicesList = highRated;
          }
        }
        servicesList.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
        break;
      case 'rating-high-low':
        servicesList.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
        break;
      case 'price-high-low':
        servicesList.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'price-low-high':
        servicesList.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      default:
        break;
    }

    return servicesList;
  }, [filteredServices, activeFilter, disableTopRatedThreshold]);

  const applyProjectFilters = useMemo(() => {
    let projectsList = [...filteredProjects];
    switch (activeFilter) {
      case 'price-high-low':
        projectsList.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'price-low-high':
        projectsList.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      default:
        break;
    }

    return projectsList;
  }, [filteredProjects, activeFilter]);

  const baseResultsType = isSeller ? 'projects' : 'services';
  const specialResultsType = isSeller && (
    isFeaturedProjectsView || isProjectsToBidForView || isBasedOnSearchesView
  )
    ? service
    : null;

  const resultsType = specialResultsType || (
    filterParam === 'featured'
      ? `featured ${baseResultsType}`
      : filterParam === 'personalized'
        ? `personalized ${baseResultsType}`
        : filterParam === 'searches'
          ? `${baseResultsType} based on your searches`
          : baseResultsType
  );
  const sortedResults = useMemo(() => (isSeller ? applyProjectFilters : applyServiceFilters), [applyProjectFilters, applyServiceFilters, isSeller]);
  const totalResults = sortedResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedResults.slice(start, start + PAGE_SIZE);
  }, [sortedResults, page]);

  const startIndex = totalResults === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalResults);

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
                {totalResults} {resultsType} available
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Sort &amp; Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === 'top-rated'}
                  onCheckedChange={() => setActiveFilter('top-rated')}
                >
                  Top Rated
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === 'active-now'}
                  onCheckedChange={() => setActiveFilter('active-now')}
                >
                  Active Now
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === 'rating-high-low'}
                  onCheckedChange={() => setActiveFilter('rating-high-low')}
                >
                  Rating High → Low
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === 'price-low-high'}
                  onCheckedChange={() => setActiveFilter('price-low-high')}
                >
                  Price Low → High
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeFilter === 'price-high-low'}
                  onCheckedChange={() => setActiveFilter('price-high-low')}
                >
                  Price High → Low
                </DropdownMenuCheckboxItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>UK Cities</DropdownMenuLabel>
                {ukCities.map((city) => (
                  <DropdownMenuCheckboxItem
                    key={city}
                    checked={selectedLocations.includes(city)}
                    onCheckedChange={(checked) => {
                      setSelectedLocations((prev) =>
                        checked
                          ? [...prev, city]
                          : prev.filter((loc) => loc !== city)
                      );
                    }}
                  >
                    {city}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Loading {resultsType}...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {pagedResults.map((item) => (
              isSeller ? (
                <ProjectCard key={item.id} project={item} />
              ) : (
                <ServiceCard key={item.id} service={item} />
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalResults > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-8">
            <div className="text-sm text-gray-500">
              Showing {startIndex}-{endIndex} of {totalResults} {resultsType}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && totalResults === 0 && (
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
