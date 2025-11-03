import { useState } from 'react';
import { useAuth } from '../lib/auth.tsx';
import { uploadToCloudinary } from '../lib/cloudinary';
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
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Plus,
  Save,
  AlertCircle,
  FileText,
  Eye,
  Loader2
} from 'lucide-react';

import { useCreatePortfolio, useUpdatePortfolio } from '../hooks/useProjects';
import { toast } from 'sonner';

export default function AddPortfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPortfolio, loading } = useCreatePortfolio();
  const { updatePortfolio } = useUpdatePortfolio();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'image', // 'image' or 'video'
    tags: [] as string[],
    images: [] as File[],
    imagePreviewUrls: [] as string[], // Add preview URLs array
    videoUrl: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'CQC Registration',
    'Healthcare Compliance Audit',
    'Care Home Licensing',
    'Regulatory Documentation',
    'Compliance Consulting',
    'Training Services',
    'Software Implementation',
    'Business Consulting',
    'Quality Assurance',
    'Regulatory Compliance'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Only allow supported image formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      
      if (!supportedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${file.type} is not supported. Please use JPEG, PNG, WebP, or GIF.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    if (formData.images.length + validFiles.length > 10) {
      setErrors(prev => ({ ...prev, images: 'Maximum 10 images allowed' }));
      return;
    }

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

    setErrors(prev => ({ ...prev, images: '' }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    
    // Only allow supported image formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      
      if (!supportedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${file.type} is not supported. Please use JPEG, PNG, WebP, or GIF.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      setErrors(prev => ({ ...prev, images: 'Please upload valid image files only' }));
      return;
    }

    if (formData.images.length + validFiles.length > 10) {
      setErrors(prev => ({ ...prev, images: 'Maximum 10 images allowed' }));
      return;
    }

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

    setErrors(prev => ({ ...prev, images: '' }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviewUrls: prev.imagePreviewUrls.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Portfolio title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (formData.type === 'image' && formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    if (formData.type === 'video' && !formData.videoUrl.trim()) {
      newErrors.videoUrl = 'Video URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user?.id) return;

    try {
      setSubmitting(true);
      // Create portfolio immediately with basic data
      const portfolioData = {
        provider_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        images: formData.type === 'image' ? [] : undefined,
        tags: formData.tags,
        project_url: formData.type === 'video' ? formData.videoUrl || null : null,
        completion_date: null,
        client_name: null,
        testimonial: null,
        rating: null,
        is_featured: false
      };

      // Submit form immediately
      const newPortfolio = await createPortfolio(portfolioData);
      console.log('Portfolio created successfully:', newPortfolio);

      // Show success and redirect immediately
      toast.success('Portfolio item created successfully!');

      // Upload images in background if any
      if (formData.type === 'image' && formData.images.length > 0) {
        console.log('Starting background portfolio image upload...');
        void (async () => {
          try {
            const imageUrls: string[] = [];
            for (const image of formData.images) {
              try {
                const imageUrl = await uploadToCloudinary(image, {
                  folder: 'portfolio',
                  public_id: `portfolio_${user.id}_${Date.now()}_${image.name.split('.')[0]}`
                });
                imageUrls.push(imageUrl);
              } catch (error) {
                console.error('Background portfolio image upload error:', error);
              }
            }

            if (imageUrls.length > 0) {
              try {
                await updatePortfolio(newPortfolio.id, { images: imageUrls });
                console.log('Portfolio images uploaded and item updated successfully');
                toast.success('Images uploaded successfully!');
              } catch (updateError) {
                console.error('Failed to update portfolio with images:', updateError);
              }
            }
          } catch (error) {
            console.error('Background portfolio upload failed:', error);
          }
        })();
      }

      // Navigate immediately
      navigate('/seller/portfolio');

    } catch (error) {
      console.error('Failed to create portfolio:', error);
      toast.error('Failed to create portfolio. Please try again.');
      setSubmitting(false);
      return;
    }
    // Ensure button resets if navigation doesn't happen for some reason
    setSubmitting(false);

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
              onClick={() => navigate('/seller/portfolio')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Add Portfolio Item</h1>
            <p className="text-gray-600">
              Showcase your work with images or videos to attract more clients.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Complete CQC Registration for Care Home Chain"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                    <Label htmlFor="description">Project Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the project, your approach, challenges faced, and the results achieved..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/1000 characters
                    </p>
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <Label>Tags (Optional)</Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add a tag (e.g., CQC, Compliance)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.tags.length}/5 tags added
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Media Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Media</CardTitle>
                  <p className="text-sm text-gray-600">Showcase your work with images or videos</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Media Type Selection */}
                  <div>
                    <Label>Media Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Images
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-2" />
                            Video URL
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === 'image' ? (
                    /* Image Upload */
                    <div>
                      <Label>Project Images *</Label>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragOver
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                          Drag & drop images here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          PNG, JPG, JPEG up to 10MB each (max 10 images)
                        </p>
                        <Button type="button" variant="outline" onClick={() => document.getElementById('image-upload')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Files
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      {errors.images && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.images}
                        </p>
                      )}

                      {/* Image Preview */}
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          {formData.imagePreviewUrls.map((previewUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Video URL */
                    <div>
                      <Label htmlFor="videoUrl">Video URL *</Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                        className={errors.videoUrl ? 'border-red-500' : ''}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supported platforms: YouTube, Vimeo, or direct video URLs
                      </p>
                      {errors.videoUrl && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.videoUrl}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>Use high-quality images that clearly show your work</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>Write detailed descriptions explaining your process and results</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>Include relevant tags to help clients find your work</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>Show before/after scenarios when applicable</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting || loading}
                  >
                    {submitting || loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Add to Portfolio
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Your portfolio item will be reviewed before publishing
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
