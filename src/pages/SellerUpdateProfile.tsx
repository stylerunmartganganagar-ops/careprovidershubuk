import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SellerDashboardHeader } from '../components/SellerDashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Avatar } from '../components/ui/avatar';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  User,
  Camera,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  CheckCircle,
  AlertCircle,
  Save,
  Upload
} from 'lucide-react';

export default function SellerUpdateProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load real profile data from database
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    phone: '',
    email: '',
    website: '',
    languages: [] as string[],
    experience: '',
    hourlyRate: '',
    profileImage: '',
    skills: [] as string[],
    certifications: [] as string[],
    portfolioItems: 0,
    completedOrders: 0,
    rating: 0,
    reviews: 0,
    memberLevel: 'Bronze',
    accountAge: 0,
  });

  const [realStats, setRealStats] = useState({
    completedOrders: 0,
    activeOrders: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    portfolioItems: 0,
    responseTime: 0,
    memberLevel: 'Bronze',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    fields: {
      avatar: false,
      bio: false,
      skills: false,
      portfolio: false,
      certifications: false,
      kyc: false
    }
  });

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        // Load basic profile data
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
        } else if (data) {
          const userData = data as UsersRow;
          const accountAge = Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)); // months

          setProfile({
            name: userData.name || '',
            title: userData.job_title || '',
            bio: userData.bio || '',
            location: userData.location || '',
            phone: userData.phone || '',
            email: user.email || '',
            website: userData.website || '',
            languages: [], // Not stored yet
            experience: userData.experience || '',
            hourlyRate: '', // Not stored yet
            profileImage: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            skills: userData.specializations || [],
            certifications: [], // Not stored yet
            portfolioItems: 0, // Will be loaded below
            completedOrders: 0, // Will be loaded below
            rating: userData.rating || 0,
            reviews: userData.review_count || 0,
            memberLevel: 'Bronze', // Will be calculated below
            accountAge,
          });
        }

        // Load real stats
        await loadRealStats();
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadRealStats = async () => {
      if (!user?.id) return;

      try {
        // Get completed orders count
        const { count: completedCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id)
          .eq('status', 'completed');

        // Get active orders count
        const { count: activeCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id)
          .in('status', ['pending', 'in_progress', 'revision']);

        // Get total earnings
        const { data: earnings } = await supabase
          .from('orders')
          .select('price')
          .eq('provider_id', user.id)
          .eq('status', 'completed');

        const totalEarnings = (earnings || []).reduce((sum, order) => sum + parseFloat(order.price?.toString() || '0'), 0);

        // Get reviews data
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', user.id);

        const totalReviews = reviews?.length || 0;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
          : 0;

        // Get portfolio items count
        const { count: portfolioCount } = await supabase
          .from('portfolios')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id);

        // Calculate member level
        const memberLevel = calculateMemberLevel({
          completedOrders: completedCount || 0,
          activeOrders: activeCount || 0,
          totalEarnings,
          averageRating,
          totalReviews,
          accountAge: profile.accountAge,
          isVerified: profile.email ? true : false,
        });

        setRealStats({
          completedOrders: completedCount || 0,
          activeOrders: activeCount || 0,
          totalEarnings,
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews,
          portfolioItems: portfolioCount || 0,
          responseTime: 2, // Default response time
          memberLevel,
        });

        // Update profile with real stats
        setProfile(prev => ({
          ...prev,
          completedOrders: completedCount || 0,
          reviews: totalReviews,
          rating: parseFloat(averageRating.toFixed(1)),
          portfolioItems: portfolioCount || 0,
          memberLevel,
        }));
      } catch (error) {
        console.error('Error loading real stats:', error);
      }
    };

    loadProfileData();
  }, [user]);

  // Compute profile completion for this page based on current profile data (including KYC)
  // IMPORTANT: uses the same logic as SellerDashboard so percentages match
  useEffect(() => {
    if (!user?.id) {
      setProfileCompletion({
        percentage: 0,
        fields: {
          avatar: false,
          bio: false,
          skills: false,
          portfolio: false,
          certifications: false,
          kyc: false
        }
      });
      return;
    }

    const compute = async () => {
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
        console.warn('SellerUpdateProfile: failed to load KYC status for profile completion', e);
      }

      const avatar = !!profile.profileImage;
      const bio = !!profile.bio && profile.bio.trim().length > 0;
      const phone = !!profile.phone;
      const portfolio = profile.portfolioItems > 0;

      // Skills and certifications are shown visually but do NOT affect the
      // percentage, to stay in sync with SellerDashboard logic.
      const skills = profile.skills.length > 0;
      const certifications = profile.certifications.length > 0;

      let percentage = 0;

      if (kycApproved) {
        percentage = 100;
      } else {
        const flags = [avatar, bio, portfolio, phone];
        const completed = flags.filter(Boolean).length;
        const total = flags.length;
        percentage = total ? Math.round((completed / total) * 100) : 0;
      }

      setProfileCompletion({
        percentage,
        fields: {
          avatar,
          bio,
          skills,
          portfolio,
          certifications,
          kyc: kycApproved
        }
      });
    };

    compute();
  }, [user?.id, profile]);

  // Calculate member level for sellers based on various factors
  const calculateMemberLevel = ({
    completedOrders,
    activeOrders,
    totalEarnings,
    averageRating,
    totalReviews,
    accountAge,
    isVerified,
  }: {
    completedOrders: number;
    activeOrders: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    accountAge: number;
    isVerified: boolean;
  }): string => {
    let score = 0;

    // Base points for verification
    if (isVerified) score += 20;

    // Points for completed orders (up to 100 points)
    score += Math.min(completedOrders * 5, 100);

    // Points for active orders (up to 50 points)
    score += Math.min(activeOrders * 3, 50);

    // Points for total earnings (up to 100 points)
    score += Math.min(totalEarnings / 10, 100);

    // Points for reviews and rating (up to 50 points each)
    score += Math.min(totalReviews * 2, 50);
    score += averageRating * 10; // rating out of 5, max 50 points

    // Points for account age (up to 30 points)
    score += Math.min(accountAge * 1, 30);

    if (score >= 300) return 'Diamond';
    if (score >= 250) return 'Platinum';
    if (score >= 200) return 'Gold';
    if (score >= 150) return 'Silver';
    return 'Bronze';
  };

  const experienceLevels = [
    { value: '1-2', label: '1-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-8', label: '5-8 years' },
    { value: '8-10', label: '8-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const handleProfileUpdate = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profile.languages.includes(newLanguage.trim())) {
      setProfile(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== languageToRemove)
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updatePayload = {
        name: profile.name,
        job_title: profile.title,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        experience: profile.experience,
        specializations: profile.skills,
      };

      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', user?.id);

      if (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
      } else {
        alert('Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerDashboardHeader />

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
            <h1 className="text-3xl font-bold mb-2">Update Profile</h1>
            <p className="text-gray-600">
              Keep your profile up-to-date to attract more clients and improve your visibility.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <img src={profile.profileImage} alt={profile.name} />
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full p-2"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{profile.name}</h3>
                    <p className="text-gray-600">{profile.title}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center text-sm text-gray-500 mr-4">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {profile.rating} ({profile.reviews} reviews)
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Level 2 Seller
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => handleProfileUpdate('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={profile.title}
                      onChange={(e) => handleProfileUpdate('title', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                    rows={4}
                    placeholder="Describe your experience, expertise, and what makes you unique..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.bio.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="location"
                        value={profile.location}
                        onChange={(e) => handleProfileUpdate('location', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleProfileUpdate('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select value={profile.experience} onValueChange={(value) => handleProfileUpdate('experience', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate (£)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={profile.hourlyRate}
                      onChange={(e) => handleProfileUpdate('hourlyRate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a skill (e.g., CQC Registration)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <Label>Languages</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add a language (e.g., Spanish)"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                    />
                    <Button type="button" onClick={addLanguage} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((language) => (
                      <Badge key={language} variant="outline" className="flex items-center gap-1">
                        {language}
                        <button
                          type="button"
                          onClick={() => removeLanguage(language)}
                          className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {profileCompletion.percentage}%
                  </div>
                  <Progress value={profileCompletion.percentage} className="mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Complete your profile to attract more clients
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Profile photo</span>
                      {profileCompletion.fields.avatar ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Professional bio</span>
                      {profileCompletion.fields.bio ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Skills & expertise</span>
                      {profileCompletion.fields.skills ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Portfolio</span>
                      {profileCompletion.fields.portfolio ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>Certifications</span>
                      {profileCompletion.fields.certifications ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span>KYC verification</span>
                      {profileCompletion.fields.kyc ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-semibold">{realStats.totalReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">{realStats.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Orders</span>
                  <span className="font-semibold">{realStats.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Orders</span>
                  <span className="font-semibold">{realStats.activeOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Portfolio Items</span>
                  <span className="font-semibold">{realStats.portfolioItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold">£{realStats.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Level</span>
                  <Badge variant="secondary">{realStats.memberLevel}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Changes will be reviewed before going live
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
