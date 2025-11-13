import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Edit,
  Star,
  Award,
  Calendar,
  Building,
  Shield,
  CheckCircle,
  UploadCloud,
  Loader2
} from 'lucide-react';
import { Crown } from 'lucide-react';
import { useIsPro } from '../hooks/usePro';
import { uploadToCloudinary } from '../lib/cloudinary';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  company: string;
  jobTitle: string;
  website: string;
  linkedin: string;
  experience: string;
  specializations: string[];
  avatarUrl?: string;
};

type ProfileStats = {
  orders: number;
  reviews: number;
  rating: number;
  memberSince: string;
  completedProjects: number;
  activeProjects: number;
  memberLevel: string;
};

type UsersRow = Database['public']['Tables']['users']['Row'];
type UsersUpdate = Database['public']['Tables']['users']['Update'];

export default function UserProfile() {
  const { user, updateUserAvatar } = useAuth();
  const navigate = useNavigate();
  const { isPro } = useIsPro(user?.id);

  const defaultProfile: ProfileData = {
    name: user?.name || user?.email?.split('@')[0] || 'Your Name',
    email: user?.email || '',
    phone: '+44 20 1234 5678',
    location: 'London, UK',
    bio: 'Healthcare professional with 8+ years of experience in compliance and regulatory affairs. Passionate about ensuring healthcare facilities meet the highest standards.',
    company: '',
    jobTitle: '',
    website: '',
    linkedin: '',
    experience: '',
    specializations: [],
    avatarUrl: user?.avatar,
  };

  const [profileData, setProfileData] = useState<ProfileData>(defaultProfile);
  const [originalProfileData, setOriginalProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [specializationsInput, setSpecializationsInput] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    orders: 0,
    reviews: 0,
    rating: 0,
    memberSince: '2023',
    completedProjects: 0,
    activeProjects: 0,
    memberLevel: 'Bronze',
  });

  // Handle profile data changes
  const handleProfileChange = (field: keyof ProfileData, value: string | string[]) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Add specialization
  const addSpecialization = () => {
    if (specializationsInput.trim() && !profileData.specializations.includes(specializationsInput.trim())) {
      const newSpecializations = [...profileData.specializations, specializationsInput.trim()];
      handleProfileChange('specializations', newSpecializations);
      setSpecializationsInput('');
    }
  };

  // Remove specialization
  const removeSpecialization = (specToRemove: string) => {
    const newSpecializations = profileData.specializations.filter(spec => spec !== specToRemove);
    handleProfileChange('specializations', newSpecializations);
  };

  // Load profile data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          setErrorMessage('Failed to load profile data');
        } else if (profile) {
          const userProfile = profile as UsersRow;
          const avatarSource = userProfile.avatar || user?.avatar || undefined;
          const loadedProfile: ProfileData = {
            name: userProfile.name || '',
            email: userProfile.email || '',
            phone: userProfile.phone || '',
            location: userProfile.location || '',
            bio: userProfile.bio || '',
            company: userProfile.company || '',
            jobTitle: userProfile.job_title || '',
            website: userProfile.website || '',
            linkedin: userProfile.linkedin || '',
            experience: userProfile.experience || '',
            specializations: userProfile.specializations || [],
            avatarUrl: avatarSource,
          };
          setProfileData(loadedProfile);
          setOriginalProfileData(loadedProfile);

          if (avatarSource && user) {
            (supabase.auth.setSession as any)?.({
              access_token: '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setErrorMessage('Failed to load profile data');
      } finally {
        setLoadingProfile(false);
      }
    };

    const loadUserStats = async () => {
      if (!user?.id) return;

      try {
        // Get user role
        const { data: userData } = await supabase
          .from('users')
          .select('role, created_at, rating, review_count, is_verified')
          .eq('id', user.id)
          .single();

        if (!userData) return;

        const userDataTyped = userData as UsersRow;
        const isProvider = userDataTyped.role === 'provider';

        setIsProvider(isProvider);

        // Fetch stats based on user role
        let completedProjects = 0;
        let activeProjects = 0;
        let totalReviews = 0;
        let avgBuyerRating = 0; // Declare at function scope
        let providerRating = userDataTyped.rating || 0;

        if (isProvider) {
          // For providers: count orders they've completed as sellers
          const { count: completedCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .eq('status', 'completed');

          const { count: activeCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .in('status', ['pending', 'in_progress', 'revision']);

          const { count: reviewCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('reviewee_id', user.id);

          const { data: providerReviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('reviewee_id', user.id);

          completedProjects = completedCount || 0;
          activeProjects = activeCount || 0;
          totalReviews = reviewCount || 0;
          if (providerReviews && providerReviews.length > 0) {
            const sum = providerReviews.reduce((acc: number, review: { rating: number | null }) => acc + (review.rating || 0), 0);
            providerRating = providerReviews.length ? sum / providerReviews.length : 0;
          }
        } else {
          // For clients: count orders they've placed
          const { count: completedCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('buyer_id', user.id)
            .eq('status', 'completed');

          const { count: activeCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('buyer_id', user.id)
            .in('status', ['pending', 'in_progress', 'revision']);

          // For buyers, get buyer ratings (how sellers rated them)
          const { data: buyerOrders } = await supabase
            .from('orders')
            .select('id')
            .eq('buyer_id', user.id)
            .eq('status', 'completed');

          let buyerRatingCount = 0;

          if (buyerOrders && buyerOrders.length > 0) {
            const orderIds = (buyerOrders as Array<{ id: string }>).map(order => order.id);
            const { data: buyerReviews } = await supabase
              .from('reviews')
              .select('buyer_rating')
              .in('order_id', orderIds)
              .not('buyer_rating', 'is', null);

            buyerRatingCount = buyerReviews?.length || 0;
            avgBuyerRating = buyerRatingCount > 0
              ? (buyerReviews as Array<{ buyer_rating: number | null }>).reduce((sum, review) => sum + (review.buyer_rating || 0), 0) / buyerRatingCount
              : 0;
          }

          completedProjects = completedCount || 0;
          activeProjects = activeCount || 0;
          totalReviews = buyerRatingCount; // Use buyer ratings as "reviews" for clients
        }

        // Calculate member level based on various factors
        const memberLevel = calculateMemberLevel({
          completedProjects,
          activeProjects,
          totalReviews,
          rating: isProvider ? providerRating : avgBuyerRating,
          accountAge: new Date(userDataTyped.created_at),
          isVerified: userDataTyped.is_verified || false,
          isProvider,
        });

        setStats({
          orders: completedProjects,
          reviews: totalReviews,
          rating: parseFloat((isProvider ? providerRating : avgBuyerRating).toFixed(1)),
          memberSince: new Date(userDataTyped.created_at).getFullYear().toString(),
          completedProjects,
          activeProjects,
          memberLevel,
        });
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    loadProfile();
    loadUserStats();
  }, [user?.id]);

  // Calculate member level based on user activity
  const calculateMemberLevel = ({
    completedProjects,
    activeProjects,
    totalReviews,
    rating,
    accountAge,
    isVerified,
    isProvider,
  }: {
    completedProjects: number;
    activeProjects: number;
    totalReviews: number;
    rating: number;
    accountAge: Date;
    isVerified: boolean;
    isProvider: boolean;
  }): string => {
    const accountAgeInMonths = (Date.now() - accountAge.getTime()) / (1000 * 60 * 60 * 24 * 30);

    let score = 0;

    // Base points for verification
    if (isVerified) score += 20;

    // Points for completed projects
    score += Math.min(completedProjects * 10, 100);

    // Points for active projects
    score += Math.min(activeProjects * 5, 50);

    // Points for reviews and rating (for providers)
    if (isProvider) {
      score += Math.min(totalReviews * 5, 50);
      score += rating * 10; // rating is out of 5, so max 50 points
    }

    // Points for account age
    score += Math.min(accountAgeInMonths * 2, 30);

    if (score >= 200) return 'Diamond';
    if (score >= 150) return 'Platinum';
    if (score >= 100) return 'Gold';
    if (score >= 50) return 'Silver';
    return 'Bronze';
  };

  // Save profile to Supabase
  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatePayload: UsersUpdate = {
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        company: profileData.company,
        job_title: profileData.jobTitle,
        website: profileData.website,
        linkedin: profileData.linkedin,
        experience: profileData.experience,
        specializations: profileData.specializations,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('users')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) throw error;

      setOriginalProfileData(profileData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing - revert changes
  const handleCancel = () => {
    if (originalProfileData) {
      setProfileData(originalProfileData);
    }
    setIsEditing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-600">
              Manage your personal information and professional details.
            </p>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="h-24 w-24">
                      <img src={profileData.avatarUrl || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt={profileData.name} />
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      id="avatar-upload"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file || !user?.id) return;

                        setUploadingAvatar(true);
                        try {
                          const url = await uploadToCloudinary(file, {
                            folder: 'user-avatars',
                            public_id: `avatar_${user.id}`,
                          });

                          const { error } = await supabase
                            .from('users')
                            .update({ avatar: url })
                            .eq('id', user.id);

                          if (error) throw error;

                          setProfileData(prev => ({ ...prev, avatarUrl: url }));
                          updateUserAvatar(url);
                          toast.success('Profile logo updated');
                        } catch (uploadError) {
                          console.error('Avatar upload failed:', uploadError);
                          toast.error('Failed to upload logo. Please try again.');
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full p-2"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    </Button>
                  </div>

                  <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                    {profileData.name}
                    {isPro && <Crown className="h-4 w-4 text-yellow-500" />}
                  </h2>
                  <p className="text-gray-600 mb-2">{profileData.jobTitle}</p>
                  {isPro && <Badge className="mb-4">Premium Member</Badge>}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.rating.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 flex items-center justify-center">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                        Rating
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.orders}</div>
                      <div className="text-xs text-gray-500">Orders</div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {profileData.email}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {profileData.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {profileData.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Member since {stats.memberSince}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-semibold">{stats.reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{isProvider ? 'Average Rating' : 'Buyer Rating'}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{stats.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Projects</span>
                    <span className="font-semibold">{stats.completedProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Projects</span>
                    <span className="font-semibold">{stats.activeProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Items</span>
                    <span className="font-semibold">{isProvider ? stats.completedProjects : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Level</span>
                    <Badge variant="secondary">{stats.memberLevel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Personal Information</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!isEditing}
                        rows={4}
                      />
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="professional" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Professional Details</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={profileData.company}
                          onChange={(e) => handleProfileChange('company', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={profileData.jobTitle}
                          onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Select
                          value={profileData.experience}
                          onValueChange={(value) => handleProfileChange('experience', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-2">0-2 years</SelectItem>
                            <SelectItem value="2-5">2-5 years</SelectItem>
                            <SelectItem value="5-8">5-8 years</SelectItem>
                            <SelectItem value="8-10">8-10 years</SelectItem>
                            <SelectItem value="10+">10+ years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Specializations</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.specializations.map((spec, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {spec}
                            {isEditing && (
                              <button
                                onClick={() => removeSpecialization(spec)}
                                className="ml-1 text-xs hover:text-red-500"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Add specialization..."
                            value={specializationsInput}
                            onChange={(e) => setSpecializationsInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addSpecialization()}
                          />
                          <Button type="button" variant="outline" onClick={addSpecialization}>
                            Add
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={(e) => handleProfileChange('website', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <Input
                          id="linkedin"
                          value={profileData.linkedin}
                          onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="account" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive updates about your orders and messages</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Privacy Settings</h3>
                          <p className="text-sm text-gray-600">Control who can see your profile and activity</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Password</h3>
                          <p className="text-sm text-gray-600">Last changed 3 months ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span>Email Verified</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <span>Phone Verified</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-gray-400 mr-2" />
                            <span>ID Verification</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate('/kyc-verification')}>
                            Verify Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
