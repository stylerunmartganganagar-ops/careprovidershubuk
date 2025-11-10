import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  MessageSquare,
  Heart,
  Share2,
  ExternalLink,
  ChevronLeft,
  Package,
  Image as ImageIcon,
  PoundSterling,
  User,
  Calendar,
  Shield,
  ThumbsUp,
  Eye,
  Award,
  Zap,
  Users
} from 'lucide-react';
import { useServiceDetail, useServiceReviews, useRelatedServices, useSellerPortfolio } from '../hooks/useProjects';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [enrichedService, setEnrichedService] = useState<any>(null);

  const { service, loading, error } = useServiceDetail(id);
  const { reviews } = useServiceReviews(id);
  const { services: relatedServices } = useRelatedServices(id, service?.category);
  const { portfolioItems } = useSellerPortfolio(service?.provider_id);
  const { user } = useAuth();

  // Enrich service with calculated ratings from reviews
  useEffect(() => {
    const enrich = async () => {
      if (!service) { setEnrichedService(null); return; }

      try {
        // First, get the service to find the provider_id (same as useServiceReviews)
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('provider_id')
          .eq('id', id)
          .single();

        if (serviceError || !serviceData?.provider_id) {
          console.error('Failed to get service provider_id:', serviceError);
          setEnrichedService(service);
          return;
        }

        const providerId = serviceData.provider_id;

        // Get all reviews for this provider
        const { data: allReviews, error: reviewError } = await supabase
          .from('reviews')
          .select('reviewee_id, rating')
          .eq('reviewee_id', providerId);

        // Also get the current user rating from the users table as backup
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, rating, review_count')
          .eq('id', providerId);

        let finalRating = 0;
        let finalReviewCount = 0;

        if (allReviews && allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, r) => sum + Number(r.rating), 0);
          finalRating = totalRating / allReviews.length;
          finalReviewCount = allReviews.length;
        } else if (userData && userData[0]) {
          finalRating = Number(userData[0].rating) || 0;
          finalReviewCount = Number(userData[0].review_count) || 0;
        }

        const enriched = {
          ...service,
          provider: {
            ...(service.provider || {}),
            rating: parseFloat(finalRating.toFixed(1)),
            review_count: finalReviewCount,
          }
        };

        setEnrichedService(enriched);
      } catch (err) {
        console.error('Error enriching service:', err);
        setEnrichedService(service);
      }
    };

    if (service) {
      enrich();
    }
  }, [service, id]);

  const currentService = enrichedService || service;

  const handleContact = async (sellerId: string) => {
    // Navigate to the seller's profile page
    navigate(`/seller/${sellerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium mb-2">Service Not Found</h3>
              <p>The service you're looking for doesn't exist or has been removed.</p>
              <Button className="mt-6" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0;
  const totalReviews = reviews.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      {/* Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="flex items-center" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile Layout - Stack vertically */}
        <div className="block lg:hidden space-y-8">
          {/* Mobile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentService.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">{averageRating.toFixed(1)}</span>
                      <span className="ml-1">({totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{currentService.delivery_time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 mb-1">£{currentService.price}</div>
                  <div className="text-sm text-gray-500">Starting price</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Image Gallery */}
          {currentService.images && currentService.images.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={currentService.images[selectedImage]}
                      alt={currentService.title}
                      className="w-full h-full object-cover"
                    />
                    {currentService.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {currentService.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              selectedImage === index ? 'bg-white scale-125' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  {currentService.images.length > 1 && (
                    <div className="p-4 grid grid-cols-4 gap-2">
                      {currentService.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile Seller Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">About the Seller</h3>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-12 w-12">
                  <img src={currentService.provider?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={currentService.provider?.name} />
                </Avatar>
                <div>
                  <div className="font-medium">{currentService.provider?.name}</div>
                  <div className="text-sm text-gray-600">@{currentService.provider?.username}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    <span>{(currentService.provider?.rating || 0).toFixed(1)} ({currentService.provider?.review_count || 0} reviews)</span>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleContact(currentService.provider_id)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Seller Profile
              </Button>
            </CardContent>
          </Card>

          {portfolioItems && portfolioItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolioItems.slice(0, 2).map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    {item.images && item.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {item.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                            <img src={image} alt={`${item.title} visual ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24 rounded-md bg-gray-100 text-gray-500 text-sm">
                        No visuals uploaded
                      </div>
                    )}
                  </div>
                ))}
                {portfolioItems.length > 2 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedImage(0)}>
                    View more in portfolio tab
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mobile Order Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">Order This Service</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span>Service Price</span>
                  <span className="font-semibold">£{currentService.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery Time</span>
                  <span>{currentService.delivery_time}</span>
                </div>
              </div>
              <Button className="w-full text-lg py-3 mb-4" size="lg" onClick={() => handleContact(currentService.provider_id)}>
                <MessageSquare className="h-5 w-5 mr-2" />
                Continue (£{currentService.price})
              </Button>
            </CardContent>
          </Card>

          {/* Mobile Tabs */}
          <Card>
            <Tabs defaultValue="description" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="faq">FAQ</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="description" className="px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">About This Service</h3>
                    <div className="text-gray-700 leading-relaxed text-lg">
                      {showFullDescription ? currentService.description : `${currentService.description?.slice(0, 500)}...`}
                      {currentService.description && currentService.description.length > 500 && (
                        <Button
                          variant="link"
                          className="p-0 h-auto font-semibold"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                        >
                          {showFullDescription ? 'Show Less' : 'Read More'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {currentService.requirements && currentService.requirements.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold mb-4">What I Need From You</h4>
                      <div className="space-y-3">
                        {currentService.requirements.map((req: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                            <span className="text-gray-700 text-lg">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="px-6 pb-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(averageRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <img src={review.user_avatar} alt={review.user_name} />
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-semibold">{review.user_name}</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-3 w-3 ${
                                            star <= review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="px-6 pb-6">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold">Portfolio & Past Work</h3>
                  {portfolioItems && portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {portfolioItems.slice(0, 6).map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base truncate">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {item.images && item.images.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {item.images.slice(0, 4).map((image, index) => (
                                  <div key={index} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                                    <img src={image} alt={`${item.title} visual ${index + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-28 rounded-md bg-gray-100 text-gray-500 text-sm">
                                No visuals uploaded
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">No portfolio items yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="faq" className="px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">How long does it take?</h4>
                      <p className="text-gray-700 text-sm">Typically {currentService.delivery_time}.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Desktop Layout - Fiverr Style */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side - Image Gallery */}
            <div className="lg:col-span-7">
              {currentService.images && currentService.images.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
                        <img
                          src={currentService.images[selectedImage]}
                          alt={currentService.title}
                          className="w-full h-full object-cover"
                        />
                        {currentService.images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {currentService.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`w-3 h-3 rounded-full transition-all ${
                                  selectedImage === index ? 'bg-white scale-125' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {currentService.images.length > 1 && (
                        <div className="p-4 grid grid-cols-5 gap-3">
                          {currentService.images.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImage(index)}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage === index ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center rounded-lg">
                      <div className="text-center text-gray-500">
                        <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg">No images available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {portfolioItems && portfolioItems.length > 0 && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="text-2xl">Portfolio Highlights</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {portfolioItems.slice(0, 4).map((item) => (
                      <Card key={item.id} className="border border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-base truncate">{item.title}</h4>
                            <Badge variant="secondary" className="text-[11px]">{item.category || 'Portfolio'}</Badge>
                          </div>
                          {item.images && item.images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {item.images.slice(0, 4).map((image, index) => (
                                <div key={index} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                                  <img src={image} alt={`${item.title} visual ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-28 rounded-md bg-gray-100 text-gray-500 text-sm">
                              No visuals uploaded
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Below Image - Tabs */}
              <Card className="mt-8">
                <Tabs defaultValue="description" className="w-full">
                  <CardHeader>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews ({totalReviews})</TabsTrigger>
                      <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                      <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <TabsContent value="description" className="px-8 pb-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-semibold mb-4">About This Service</h3>
                        <div className="text-gray-700 leading-relaxed text-lg">
                          {showFullDescription ? currentService.description : `${currentService.description?.slice(0, 500)}...`}
                          {currentService.description && currentService.description.length > 500 && (
                            <Button
                              variant="link"
                              className="p-0 h-auto font-semibold"
                              onClick={() => setShowFullDescription(!showFullDescription)}
                            >
                              {showFullDescription ? 'Show Less' : 'Read More'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {currentService.requirements && currentService.requirements.length > 0 && (
                        <div>
                          <h4 className="text-xl font-semibold mb-4">What I Need From You</h4>
                          <div className="space-y-3">
                            {currentService.requirements.map((req: string, index: number) => (
                              <div key={index} className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 text-lg">{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xl font-semibold mb-4">Why Choose This Service?</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Zap className="h-6 w-6 text-yellow-500 mr-3" />
                            <span className="text-gray-700">Fast turnaround time</span>
                          </div>
                          <div className="flex items-center">
                            <Shield className="h-6 w-6 text-blue-500 mr-3" />
                            <span className="text-gray-700">Quality guaranteed</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-6 w-6 text-purple-500 mr-3" />
                            <span className="text-gray-700">Expert knowledge</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-6 w-6 text-green-500 mr-3" />
                            <span className="text-gray-700">Personalized approach</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="px-8 pb-8">
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= Math.round(averageRating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
                          </div>
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const count = reviews.filter(r => r.rating === rating).length;
                              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                              return (
                                <div key={rating} className="flex items-center space-x-2 text-sm">
                                  <span className="w-3">{rating}</span>
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <Progress value={percentage} className="w-24 h-2" />
                                  <span className="w-8 text-gray-600">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start space-x-4">
                                <Avatar className="h-12 w-12">
                                  <img src={review.user_avatar} alt={review.user_name} />
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <div className="font-semibold">{review.user_name}</div>
                                      <div className="flex items-center space-x-2">
                                        <div className="flex">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={`h-4 w-4 ${
                                                star <= review.rating
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                          {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Helpful ({review.helpful_count})
                                    </Button>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="portfolio" className="px-8 pb-8">
                    <div className="space-y-6">
                      <h3 className="text-2xl font-semibold">Portfolio & Past Work</h3>
                      {portfolioItems && portfolioItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {portfolioItems.slice(0, 9).map((item) => (
                            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {item.images && item.images.length > 0 ? (
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.images.slice(0, 4).map((image, index) => (
                                      <div key={index} className="aspect-square rounded-md overflow-hidden border border-gray-200">
                                        <img src={image} alt={`${item.title} visual ${index + 1}`} className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-28 rounded-md bg-gray-100 text-gray-500 text-sm">
                                    No visuals uploaded
                                  </div>
                                )}
                                {item.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <h4 className="text-lg font-medium mb-2">No Portfolio Items Yet</h4>
                          <p className="text-gray-600">This seller hasn't added any portfolio items.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="faq" className="px-8 pb-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h3>
                      <Card>
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-2">How long does it take to complete this service?</h4>
                          <p className="text-gray-700">The service typically takes {currentService.delivery_time} to complete, depending on the complexity and your requirements.</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-2">Can I request revisions?</h4>
                          <p className="text-gray-700">Yes, I offer revisions to ensure you're completely satisfied with the final result.</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-6">
                          <h4 className="font-semibold mb-2">What if I'm not satisfied with the work?</h4>
                          <p className="text-gray-700">I work closely with clients to ensure satisfaction. If needed, we can discuss adjustments or refunds.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Side - Service Details */}
            <div className="lg:col-span-5 space-y-6">
              {/* Service Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentService.title}</h1>
                      <div className="flex items-center space-x-6 text-lg text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                          <span className="ml-2">({totalReviews} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          <span>{currentService.delivery_time}</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          <span>Secure</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-4">
                        {currentService.tags?.slice(0, 4).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-4xl font-bold text-gray-900 mb-2">£{currentService.price}</div>
                      <div className="text-sm text-gray-500">Starting price</div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{totalReviews}</div>
                      <div className="text-sm text-gray-600">Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{currentService.delivery_time}</div>
                      <div className="text-sm text-gray-600">Delivery</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Service Card */}
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6">Order This Service</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-lg">
                      <span>Service Price</span>
                      <span className="font-bold">£{currentService.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Delivery Time</span>
                      <span>{currentService.delivery_time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Revisions</span>
                      <span>Unlimited</span>
                    </div>
                  </div>
                  <Button className="w-full text-lg py-3 mb-4" size="lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Continue (£{currentService.price})
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    <Heart className="h-4 w-4 mr-2" />
                    Save to Favorites
                  </Button>
                </CardContent>
              </Card>

              {/* Seller Info Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">About the Seller</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-14 w-14">
                      <img src={currentService.provider?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={currentService.provider?.name} />
                    </Avatar>
                    <div>
                      <div className="font-semibold text-lg">{currentService.provider?.name}</div>
                      <div className="text-sm text-gray-600">@{currentService.provider?.username}</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">{currentService.provider?.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reviews</span>
                      <span className="font-medium">{currentService.provider?.review_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time</span>
                      <span className="font-medium">1 hour</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => navigate(`/seller/${currentService.provider_id}`)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button className="flex-1" onClick={() => handleContact(currentService.provider_id)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Why Choose Us?</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm">Secure payments & data protection</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm">Quality guaranteed</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="text-sm">Expert professionals</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="text-sm">On-time delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
