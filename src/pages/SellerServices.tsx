import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth.tsx';
import { SellerDashboardLayout } from '../components/SellerDashboardLayout';
import { Footer } from '../components/Footer';
import { uploadToCloudinary } from '../lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Edit,
  Plus,
  Eye,
  PoundSterling,
  Clock,
  Star,
  Trash2,
  X
} from 'lucide-react';
import { useSellerServices, useUpdateService, useDeleteService } from '../hooks/useProjects';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function SellerServices() {
  const { user } = useAuth();
  const { services, loading, error, refetch } = useSellerServices(user?.id);
  const { updateService } = useUpdateService();
  const { deleteService } = useDeleteService();

  const [editingService, setEditingService] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Image handling for edit
  const [editImages, setEditImages] = useState<File[]>([]);
  const [editImagePreviewUrls, setEditImagePreviewUrls] = useState<string[]>([]);
  const [editKeywordInput, setEditKeywordInput] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + editImages.length > 4) {
      toast.error('You can upload up to 4 images only');
      return;
    }
    
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
      
      if (file.size > 5 * 1024 * 1024) {
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
          setEditImages(prev => [...prev, ...validFiles]);
          setEditImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setEditImagePreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const addEditKeyword = () => {
    if (editKeywordInput.trim() && !editKeywords.includes(editKeywordInput.trim()) && editKeywords.length < 5) {
      setEditKeywords(prev => [...prev, editKeywordInput.trim()]);
      setEditKeywordInput('');
    }
  };

  const removeEditKeyword = (keywordToRemove: string) => {
    setEditKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove));
  };

  // No cleanup needed for data URLs (they're automatically garbage collected)

  const handleEditService = async () => {
    console.log('Edit form submitted!');
    console.log('Editing service:', editingService);
    console.log('Edit keywords:', editKeywords);
    console.log('Edit images:', editImages);
    if (!editingService) {
      console.error('No editing service found');
      return;
    }

    try {
      // Update service immediately with basic data
      await updateService(editingService.id, {
        title: editingService.title,
        description: editingService.description,
        category: editingService.category,
        price: editingService.price,
        delivery_time: editingService.delivery_time,
        revisions: editingService.revisions,
        tags: editKeywords.length > 0 ? editKeywords : editingService.tags,
        images: editingService.images || [], // Keep existing images initially
        is_active: editingService.is_active
      });

      console.log('Service updated successfully');

      // Close dialog and refresh immediately
      setEditDialogOpen(false);
      setEditingService(null);
      setEditImages([]);
      setEditImagePreviewUrls([]);
      setEditKeywords([]);
      refetch();
      toast.success('Service updated successfully!');

      // Upload new images in background if any
      if (editImages.length > 0) {
        console.log('Starting background image upload for edit...');

        setTimeout(async () => {
          try {
            const imageUrls: string[] = editingService.images || [];
            for (const image of editImages) {
              try {
                const imageUrl = await uploadToCloudinary(image, {
                  folder: 'services',
                  public_id: `service_edit_${user?.id}_${Date.now()}_${image.name.split('.')[0]}`
                });
                imageUrls.push(imageUrl);
              } catch (error) {
                console.error('Background edit image upload error:', error);
              }
            }

            // Update service with new image URLs
            if (imageUrls.length > (editingService.images?.length || 0)) {
              try {
                await updateService(editingService.id, { images: imageUrls });
                console.log('Edit images uploaded and service updated successfully');
                toast.success('Images uploaded successfully!');
                refetch(); // Refresh to show new images
              } catch (updateError) {
                console.error('Failed to update service with edit images:', updateError);
              }
            }
          } catch (error) {
            console.error('Background edit upload failed:', error);
          }
        }, 100);
      }

    } catch (error) {
      console.error('Failed to update service:', error);
      toast.error('Failed to update service. Please try again.');
    }
  };

  const handleDeleteService = async () => {
    if (!deleteServiceId) return;

    try {
      await deleteService(deleteServiceId);
      setDeleteDialogOpen(false);
      setDeleteServiceId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  if (loading) {
    return (
      <SellerDashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading services...</div>
        </div>
        <Footer />
      </SellerDashboardLayout>
    );
  }

  if (error) {
    return (
      <SellerDashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-red-600">{error}</div>
        </div>
        <Footer />
      </SellerDashboardLayout>
    );
  }

  return (
    <SellerDashboardLayout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Services</h1>
            <p className="text-gray-600 mt-2">Manage your posted services and gigs</p>
          </div>
          <Link to="/create-service">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Service
            </Button>
          </Link>
        </div>

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{service.title}</CardTitle>
                    <Badge
                      variant={
                        service.is_active ? 'default' : 'secondary'
                      }
                    >
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{service.category}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 text-sm line-clamp-3">{service.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <PoundSterling className="h-3 w-3 mr-1" />
                        £{service.price}
                      </span>
                      <span className="text-gray-500">Hourly</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.delivery_time}
                      </span>
                      <span>{service.revisions} revisions</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingService(service);
                        setEditKeywords(service.tags || []);
                        setEditImages([]);
                        setEditImagePreviewUrls([]);
                        setEditKeywordInput('');
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteServiceId(service.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No services created yet</div>
            <Link to="/create-service">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Service
              </Button>
            </Link>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update your service details, images, and settings.
              </DialogDescription>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Service Title */}
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={editingService.title}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    required
                  />
                </div>

                {/* Service Description */}
                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium">Category *</label>
                  <Select
                    value={editingService.category}
                    onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CQC Registration">CQC Registration</SelectItem>
                      <SelectItem value="Business Consulting">Business Consulting</SelectItem>
                      <SelectItem value="Care Software">Care Software</SelectItem>
                      <SelectItem value="Training Services">Training Services</SelectItem>
                      <SelectItem value="Sponsor Visa">Sponsor Visa</SelectItem>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price and Delivery Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price (£) *</label>
                    <Input
                      type="number"
                      value={editingService.price}
                      onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Delivery Time *</label>
                    <Input
                      value={editingService.delivery_time}
                      onChange={(e) => setEditingService({ ...editingService, delivery_time: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Revisions and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Revisions *</label>
                    <Input
                      type="number"
                      value={editingService.revisions}
                      onChange={(e) => setEditingService({ ...editingService, revisions: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={editingService.is_active ? 'active' : 'inactive'}
                      onValueChange={(value) => setEditingService({ ...editingService, is_active: value === 'active' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Keywords/Tags */}
                <div>
                  <label className="text-sm font-medium">Keywords/Tags (1-5)</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add keyword"
                        value={editKeywordInput}
                        onChange={(e) => setEditKeywordInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditKeyword())}
                        disabled={editKeywords.length >= 5}
                      />
                      <Button
                        type="button"
                        onClick={addEditKeyword}
                        variant="outline"
                        disabled={editKeywords.length >= 5}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {editKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeEditKeyword(keyword)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500">
                      {editKeywords.length}/5 keywords
                    </p>
                  </div>
                </div>

                {/* Current Images */}
                {editingService.images && editingService.images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Current Images</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {editingService.images.map((image: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={image}
                            alt={`Current ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <label className="text-sm font-medium">Add New Images (Optional)</label>
                  <div className="mt-2">
                    <label htmlFor="edit-image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="text-center">
                          <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-600">Click to add images (JPEG, JPG, PNG, WebP, GIF)</p>
                        </div>
                      </div>
                      <input
                        id="edit-image-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleEditImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* New Image Preview */}
                  {editImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {editImagePreviewUrls.map((previewUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={previewUrl}
                              alt={`New ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-1">
                    Total images after upload: {(editingService.images?.length || 0) + editImages.length}/4
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditService}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this service? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteService}>
                Delete Service
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
      <Footer />
    </SellerDashboardLayout>
  );
}
