import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  Star,
  MapPin,
  Filter,
  Search,
  SlidersHorizontal,
  Grid,
  List,
  ArrowLeft,
  Heart,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  pricing_type: 'fixed' | 'hourly' | 'starting_from';
  delivery_time: number;
  revisions: number;
  features: string[];
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  provider: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    review_count: number;
    company?: string;
    job_title?: string;
    location?: string;
    is_verified: boolean;
  };
}

export default function AllServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { services, title, subtitle } = location.state || {};

  const [sortBy, setSortBy] = useState('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [enrichedServices, setEnrichedServices] = useState<any[] | null>(null);

  // Enrich provider rating/review_count from reviews for accurate display
  useEffect(() => {
    const enrich = async () => {
      try {
        if (!services || services.length === 0) { setEnrichedServices(null); return; }

        let servicesWithIds = services;

        // Get provider_ids for services that don't have them
        const servicesWithoutProviderId = services.filter((s: any) => !s.provider?.id && !s.provider_id);
        if (servicesWithoutProviderId.length > 0) {
          const serviceIds = servicesWithoutProviderId.map((s: any) => s.id);
          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .select('id, provider_id')
            .in('id', serviceIds);

          if (!serviceError && serviceData) {
            const serviceMap = Object.fromEntries(serviceData.map((s: any) => [s.id, s.provider_id]));
            servicesWithIds = services.map((s: any) => ({
              ...s,
              provider_id: s.provider_id || s.provider?.id || serviceMap[s.id]
            }));
          }
        }

        const providerIds = Array.from(new Set(servicesWithIds
          .map((s: any) => s.provider?.id || s.provider_id)
          .filter(Boolean)));

        if (providerIds.length === 0) { setEnrichedServices(services); return; }

        // Get all reviews for these providers
        const { data: allReviews, error } = await supabase
          .from('reviews')
          .select('reviewee_id, rating')
          .in('reviewee_id', providerIds);

        if (error) throw error;

        // Also get the current user ratings from the users table as backup
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, rating, review_count')
          .in('id', providerIds);

        // Build rating map from reviews
        const ratingMap: Record<string, { sum: number; count: number }> = {};
        (allReviews || []).forEach((r: any) => {
          const id = r.reviewee_id;
          const rating = Number(r.rating) || 0;
          if (!ratingMap[id]) ratingMap[id] = { sum: 0, count: 0 };
          ratingMap[id].sum += rating;
          ratingMap[id].count += 1;
        });

        // Build user data map
        const userMap: Record<string, { rating: number; review_count: number }> = {};
        (userData || []).forEach((u: any) => {
          userMap[u.id] = {
            rating: Number(u.rating) || 0,
            review_count: Number(u.review_count) || 0
          };
        });

        const merged = servicesWithIds.map((s: any) => {
          const pid = s.provider?.id || s.provider_id;
          const reviewAgg = pid ? ratingMap[pid] : undefined;
          const userAgg = pid ? userMap[pid] : undefined;

          // Prefer calculated rating from reviews, fallback to user table
          let finalRating = 0;
          let finalReviewCount = 0;

          if (reviewAgg && reviewAgg.count > 0) {
            finalRating = reviewAgg.sum / reviewAgg.count;
            finalReviewCount = reviewAgg.count;
          } else if (userAgg) {
            finalRating = userAgg.rating;
            finalReviewCount = userAgg.review_count;
          }

          return {
            ...s,
            provider: {
              ...(s.provider || {}),
              id: pid,
              rating: parseFloat(finalRating.toFixed(1)),
              review_count: finalReviewCount,
            }
          };
        });

        setEnrichedServices(merged);
      } catch (err) {
        console.error('Error enriching services:', err);
        setEnrichedServices(services || null);
      }
    };
    enrich();
  }, [services]);

  // If no services data, show error or redirect
  if (!services || !title) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-4">No services data available.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sourceServices = enrichedServices || services || [];

  // Filter services based on current filters
  const filteredServices = sourceServices.filter((service: any) => {
    if (priceRange === 'under-500' && service.price >= 500) return false;
    if (priceRange === '500-2000' && (service.price < 500 || service.price > 2000)) return false;
    if (priceRange === 'over-2000' && service.price <= 2000) return false;

    if (ratingFilter === '4-plus' && (service.provider.rating || 0) < 4) return false;
    if (ratingFilter === '4.5-plus' && (service.provider.rating || 0) < 4.5) return false;

    return true;
  });

  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.provider.rating || 0) - (a.provider.rating || 0);
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      default:
        return 0;
    }
  });

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
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {subtitle && <p className="text-gray-600">{subtitle}</p>}
            <p className="text-sm text-gray-500 mt-2">
              {sortedServices.length} services available
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-500">Under £500</SelectItem>
                  <SelectItem value="500-2000">£500 - £2,000</SelectItem>
                  <SelectItem value="over-2000">Over £2,000</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4-plus">4+ Stars</SelectItem>
                  <SelectItem value="4.5-plus">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedServices.map((service) => (
              <Link key={service.id} to={`/seller/${service.provider.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="aspect-video relative">
                    <img
                      src={service.images?.[0] || '/placeholder-service.jpg'}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <img src={service.provider.avatar} alt={service.provider.name} />
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{service.provider.name}</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs ml-1">{service.provider.rating?.toFixed(1) || '0.0'}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({service.provider.review_count || 0})
                            </span>
                          </div>
                          {service.provider.is_verified && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {service.title}
                    </h3>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        {service.provider.location || 'Location not specified'}
                      </div>
                      <span className="text-xs text-gray-500">
                        {service.delivery_time} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">£{service.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">/hr</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedServices.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 relative flex-shrink-0">
                      <img
                        src={service.images?.[0] || '/placeholder-service.jpg'}
                        alt={service.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <img src={service.provider.avatar} alt={service.provider.name} />
                            </Avatar>
                            <span className="text-sm font-medium">{service.provider.name}</span>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs ml-1">{service.provider.rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({service.provider.review_count || 0} reviews)
                              </span>
                            </div>
                            {service.provider.is_verified && (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {service.provider.location || 'Location not specified'}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.delivery_time} days
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary mb-2">
                            £{service.price.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">/{service.pricing_type}</div>
                          <Badge variant="outline" className="mb-2">
                            {service.category}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Heart className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" asChild>
                              <Link to={`/seller/${service.provider.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {sortedServices.length >= 12 && (
          <div className="text-center mt-8">
            <Button variant="outline">
              Load More Services
            </Button>
          </div>
        )}

        {/* Empty State */}
        {sortedServices.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setPriceRange('all');
                setRatingFilter('all');
                setSortBy('recommended');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
