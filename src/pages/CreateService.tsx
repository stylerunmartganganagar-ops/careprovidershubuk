import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { uploadToCloudinary, testCloudinaryConnection } from '../lib/cloudinary';
import { SellerDashboardHeader } from '../components/SellerDashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { ArrowLeft, Plus, X, DollarSign, Clock, Users, AlertCircle, Tag, ImageIcon } from 'lucide-react';
import { useSimpleCategories, useSubcategoriesByCategory } from '../hooks/useCategories';
import { useCreateService, useUpdateService } from '../hooks/useProjects';
import { toast } from 'sonner';

export default function CreateService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createService, loading: hookLoading } = useCreateService();
  const { updateService } = useUpdateService();
  const { categories: categoryOptions, loading: categoriesLoading } = useSimpleCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const { subcategories: subcategoryOptions, loading: subcategoriesLoading } = useSubcategoriesByCategory(selectedCategory || null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    header: '',
    description: '',
    category: '',
    subcategory: '',
    hourlyRate: '',
    experience: '',
    keywords: [] as string[],
    languages: [] as string[],
    availability: 'full-time',
    responseTime: '24',
    images: [] as File[], // Add images array
    imagePreviewUrls: [] as string[], // Add preview URLs array
    portfolioItems: ''
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const experienceLevels = [
    { value: '1-2', label: '1-2 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '5-10', label: '5-10 years' },
    { value: '10+', label: '10+ years' }
  ];

  const availabilityOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'project-based', label: 'Project-based' }
  ];

  const responseTimeOptions = [
    { value: '1', label: '1 hour' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '24 hours' },
    { value: '48', label: '48 hours' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const selected = categoryOptions.find(category => category.id === categoryId);
    setFormData(prev => ({
      ...prev,
      category: selected?.name || '',
      subcategory: ''
    }));
    setSelectedSubcategory('');
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
    if (errors.subcategory) {
      setErrors(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    const selected = subcategoryOptions.find(subcategory => subcategory.id === subcategoryId);
    setFormData(prev => ({
      ...prev,
      subcategory: selected?.name || ''
    }));
    if (errors.subcategory) {
      setErrors(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() &&
        !formData.keywords.includes(keywordInput.trim()) &&
        formData.keywords.length < 5) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const addLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()]
      }));
      setLanguageInput('');
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(language => language !== languageToRemove)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 4) {
      toast.error('You can upload up to 4 images only');
      return;
    }

    // Check file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      
      // Only allow supported image formats
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!supportedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${file.type} is not supported. Please use JPEG, PNG, WebP, or GIF.`);
        return false;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create data URLs for preview
    const newPreviewUrls: string[] = [];
    let processedCount = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviewUrls.push(e.target?.result as string);
        processedCount++;

        // When all files are processed, update state
        if (processedCount === validFiles.length) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validFiles],
            imagePreviewUrls: [...prev.imagePreviewUrls, ...newPreviewUrls]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
      imagePreviewUrls: prev.imagePreviewUrls.filter((_, index) => index !== indexToRemove)
    }));
  };

  // No cleanup needed for data URLs (they're automatically garbage collected)

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.header.trim()) newErrors.header = 'Service header is required';
    if (formData.header.length > 180) newErrors.header = 'Header must be 180 characters or less';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 2500) newErrors.description = 'Description must be 2500 characters or less';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subcategory) newErrors.subcategory = 'Subcategory is required';
    if (!formData.hourlyRate) newErrors.hourlyRate = 'Hourly rate is required';
    if (!formData.experience) newErrors.experience = 'Experience level is required';
    if (formData.keywords.length === 0) newErrors.keywords = 'At least one keyword is required';
    if (formData.keywords.length > 5) newErrors.keywords = 'Maximum 5 keywords allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.id) return;

    setLoading(true);

    try {
      // Create service immediately with basic data
      const serviceData = {
        provider_id: user.id,
        title: formData.header || 'Test Service',
        description: formData.description || 'Test description',
        category: formData.category || 'CQC Registration',
        subcategory: formData.subcategory,
        price: parseFloat(formData.hourlyRate) || 100,
        delivery_time: '1 day',
        revisions: 1,
        tags: formData.keywords.length > 0 ? formData.keywords : ['test'],
        images: [], // Empty initially, will be updated in background
        is_active: true,
        approval_status: 'pending'
      };

      // Submit form immediately
      const newService = await createService(serviceData);
      console.log('Service created successfully:', newService);

      // Show success and redirect immediately
      toast.success('Service created successfully!');

      // Upload images in background if any
      if (formData.images.length > 0) {
        console.log('Starting background image upload...');

        // Process images in background without blocking UI
        setTimeout(async () => {
          try {
            const imageUrls: string[] = [];
            for (const image of formData.images) {
              try {
                const imageUrl = await uploadToCloudinary(image, {
                  folder: 'services',
                  public_id: `service_${user.id}_${Date.now()}_${image.name.split('.')[0]}`
                });
                imageUrls.push(imageUrl);
              } catch (error) {
                console.error('Background image upload error:', error);
              }
            }

            // Update service with image URLs if any were uploaded successfully
            if (imageUrls.length > 0) {
              try {
                await updateService(newService.id, { images: imageUrls });
                console.log('Images uploaded and service updated successfully');
                toast.success('Images uploaded successfully!');
              } catch (updateError) {
                console.error('Failed to update service with images:', updateError);
              }
            }
          } catch (error) {
            console.error('Background upload failed:', error);
          }
        }, 100); // Small delay to ensure service creation completes first
      }

      // Navigate immediately
      navigate('/seller/services');

    } catch (error) {
      console.error('Failed to create service:', error);
      toast.error('Failed to create service. Please try again.');
      setLoading(false);
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
            <h1 className="text-3xl font-bold mb-2">Create New Service</h1>
            <p className="text-gray-600">
              Set up your professional service and help clients find your expertise.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Header */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Header *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Textarea
                      placeholder="Brief, compelling description of your service (max 180 characters)"
                      value={formData.header}
                      onChange={(e) => handleInputChange('header', e.target.value)}
                      rows={2}
                      maxLength={180}
                      className={errors.header ? 'border-red-500' : ''}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {formData.header.length}/180 characters
                      </span>
                      {errors.header && (
                        <p className="text-red-500 text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.header}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Description *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Textarea
                      placeholder="Detailed description of your service, experience, and what clients can expect..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={8}
                      maxLength={2500}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500">
                        {formData.description.length}/2500 characters
                      </span>
                      {errors.description && (
                        <p className="text-red-500 text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="h-5 w-5 mr-2" />
                    Keywords (1-5) *
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Add up to 5 keywords that best describe your service
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., CQC Registration, Healthcare Compliance"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                        disabled={formData.keywords.length >= 5}
                      />
                      <Button
                        type="button"
                        onClick={addKeyword}
                        variant="outline"
                        disabled={formData.keywords.length >= 5}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500">
                      {formData.keywords.length}/5 keywords added
                    </p>

                    {errors.keywords && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.keywords}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Service Images (Optional)
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload up to 4 images to showcase your service (Max 5MB each)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Image Upload Button */}
                    <div className="flex items-center justify-center">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                          <div className="text-center">
                            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to upload images</p>
                            <p className="text-xs text-gray-500">JPEG, PNG, WebP, GIF up to 5MB</p>
                          </div>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Image Preview Grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.imagePreviewUrls.map((previewUrl, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border">
                              <img
                                src={previewUrl}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-gray-500 text-center">
                      {formData.images.length}/4 images uploaded
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardHeader>
                  <CardTitle>Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., English, Spanish"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      />
                      <Button type="button" onClick={addLanguage} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.languages.map((language) => (
                        <Badge key={language} variant="outline" className="flex items-center gap-1">
                          {language}
                          <button
                            type="button"
                            onClick={() => removeLanguage(language)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
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
              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="subcategory">Subcategory *</Label>
                    <Select 
                      value={selectedSubcategory} 
                      onValueChange={handleSubcategoryChange}
                      disabled={!selectedCategory || subcategoriesLoading}
                    >
                      <SelectTrigger className={errors.subcategory ? 'border-red-500' : ''}>
                        <SelectValue placeholder={!selectedCategory ? "Select a category first" : "Select a subcategory"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoryOptions.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subcategory && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.subcategory}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="hourlyRate"
                        type="number"
                        placeholder="75"
                        value={formData.hourlyRate}
                        onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                        className={`pl-10 ${errors.hourlyRate ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.hourlyRate && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.hourlyRate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience Level *</Label>
                    <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                      <SelectTrigger className={errors.experience ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.experience && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.experience}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availabilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="responseTime">Response Time</Label>
                    <Select value={formData.responseTime} onValueChange={(value) => handleInputChange('responseTime', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {responseTimeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="portfolioItems">Portfolio Items</Label>
                    <Input
                      id="portfolioItems"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.portfolioItems}
                      onChange={(e) => handleInputChange('portfolioItems', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Card>
                <CardContent className="pt-6">
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Service...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Create Service
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Your service will be reviewed before being published
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
