import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { DashboardHeader } from '../components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
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
  ChevronRight,
  Eye,
  Users,
  Award,
  Shield,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Package as PackageIcon,
  Image as ImageIcon,
  Plus,
  Edit
} from 'lucide-react';
import { useSellerProfile, useSellerServices } from '../hooks/useProjects';

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const { seller, loading, error } = useSellerProfile(id);
  const { services: sellerServices, loading: servicesLoading } = useSellerServices(id);
  const { user } = useAuth();

  const handleContact = async (sellerId: string) => {
    // Navigate to messages with the seller ID to start chat
    navigate(`/messages?with=${sellerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Seller Not Found</h3>
              <p>Seller profile not found or unavailable.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Keywords/Tags (what they rank for)
  const keywords = [
    'CQC Registration',
    'Healthcare Compliance',
    'Care Home Licensing',
    'Regulatory Documentation',
    'Medical Practice Setup',
    'Compliance Audit',
    'Healthcare Consulting',
    'CQC Application',
    'Care Quality Commission',
    'Healthcare Regulation',
    'Medical Compliance',
    'Nursing Home License',
    'Healthcare Accreditation'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      {/* Mobile Layout - More Airy and Spacious */}
      <div className="block lg:hidden">
        {/* Hero Section - Large Avatar and Basic Info */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-6 ring-4 ring-gray-100">
                <img src={seller.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={seller.name} />
              </Avatar>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
                <div className="text-lg text-gray-600">@{seller.username || 'username'}</div>
                <div className="flex items-center justify-center space-x-1 mt-3">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-lg">{seller.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-500 ml-1">({seller.review_count || 0} reviews)</span>
                </div>
                {seller.location && (
                  <div className="flex items-center justify-center space-x-1 text-gray-600 mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{seller.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Stats Cards - More Spacious */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">{seller.review_count || 0}</div>
                <div className="text-sm text-gray-600">Reviews</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">{seller.rating?.toFixed(1) || '0.0'}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* About Section - More Airy */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">About This Seller</h2>
              <div className="text-gray-700 leading-relaxed text-lg space-y-4">
                <p>{seller.bio || 'This seller specializes in healthcare services and compliance solutions.'}</p>
                {seller.company && (
                  <div className="pt-4 border-t">
                    <div className="font-medium text-gray-900 mb-1">Company</div>
                    <div className="text-gray-600">{seller.company}</div>
                  </div>
                )}
                {seller.job_title && (
                  <div>
                    <div className="font-medium text-gray-900 mb-1">Role</div>
                    <div className="text-gray-600">{seller.job_title}</div>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="font-medium text-gray-900 mb-1">Member Since</div>
                  <div className="text-gray-600">{new Date(seller.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information - More Spacious */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-4">
                {seller.email && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 mr-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Email</div>
                      <div className="text-gray-600">{seller.email}</div>
                    </div>
                  </div>
                )}
                {seller.phone && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 mr-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Phone</div>
                      <div className="text-gray-600">{seller.phone}</div>
                    </div>
                  </div>
                )}
                {seller.website && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <ExternalLink className="h-5 w-5 mr-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Website</div>
                      <a href={seller.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {seller.website}
                      </a>
                    </div>
                  </div>
                )}
                {seller.linkedin && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <ExternalLink className="h-5 w-5 mr-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">LinkedIn</div>
                      <a href={seller.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        LinkedIn Profile
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-6">Specializes in</h3>
              <div className="flex flex-wrap gap-3">
                {keywords.slice(0, 8).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="px-4 py-2 text-sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Section - More Airy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Services Offered</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center py-8">
                <PackageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h4 className="text-lg font-medium mb-2">No Services Available</h4>
                <p className="text-gray-600">This seller hasn't published any services yet.</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card - More Prominent */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Work Together?</h3>
              <p className="text-gray-600 mb-6">Contact this seller to discuss your project requirements.</p>
              <Button size="lg" className="w-full py-3 text-lg" onClick={() => navigate('/messages')}>
                <MessageSquare className="h-5 w-5 mr-2" />
                Contact Seller
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" className="flex items-center" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Seller Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <img src={seller.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={seller.name} />
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h1 className="text-2xl font-bold">{seller.name}</h1>
                          {seller.is_verified && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          @{seller.username || 'username'}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-medium">{seller.rating?.toFixed(1) || '0.0'}</span>
                            <span className="ml-1">({seller.review_count || 0} reviews)</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {seller.location || 'Location not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Member since</div>
                      <div className="font-medium">{new Date(seller.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                      {seller.company && (
                        <div className="text-sm text-gray-600 mt-1">{seller.company}</div>
                      )}
                      {seller.job_title && (
                        <div className="text-sm text-gray-600">{seller.job_title}</div>
                      )}
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">About This Seller</h2>
                    <div className="text-gray-700 leading-relaxed">
                      {seller.bio || 'This seller specializes in healthcare services and compliance solutions.'}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      {seller.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{seller.email}</span>
                        </div>
                      )}
                      {seller.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{seller.phone}</span>
                        </div>
                      )}
                      {seller.website && (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          <a href={seller.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {seller.website}
                          </a>
                        </div>
                      )}
                      {seller.linkedin && (
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                          <a href={seller.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Experience & Specializations */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Experience & Specializations</h3>
                    <div className="space-y-3">
                      {seller.experience && (
                        <div>
                          <div className="text-sm font-medium text-gray-700">Experience Level</div>
                          <div className="text-sm text-gray-600">{seller.experience}</div>
                        </div>
                      )}
                      {seller.specializations && seller.specializations.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Specializations</div>
                          <div className="flex flex-wrap gap-2">
                            {seller.specializations.map((spec: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <h3 className="font-medium mb-2">Specializes in</h3>
                    <div className="flex flex-wrap gap-2">
                      {keywords.slice(0, 8).map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered ({sellerServices?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading services...</p>
                    </div>
                  ) : (
                    <>
                      {sellerServices && sellerServices.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sellerServices.slice(0, 6).map((service) => (
                              <Card key={service.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                      {service.images && service.images.length > 0 ? (
                                        <img
                                          src={service.images[0]}
                                          alt={service.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <PackageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 truncate">{service.title}</h4>
                                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{service.description}</p>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="text-lg font-bold text-gray-900">£{service.price}</div>
                                        <div className="text-xs text-gray-500">{service.delivery_time}</div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {sellerServices.length > 6 && (
                            <p className="text-center py-4 text-sm text-gray-500">
                              And {sellerServices.length - 6} more services...
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <PackageIcon className="h-12 w-12 mx-auto mb-4" />
                          <p>This seller hasn't published any services yet.</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Contact Seller</h3>
                  <div className="space-y-3">
                    <Button className="w-full" size="lg" onClick={() => handleContact(id!)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Me
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Rating</span>
                      <span className="font-medium">{seller.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reviews</span>
                      <span className="font-medium">{seller.review_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Member since</span>
                      <span className="font-medium">{new Date(seller.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
