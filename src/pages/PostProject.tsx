import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useSimpleCategories, useSubcategoriesByCategory } from '../hooks/useCategories';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { ArrowLeft, Plus, X, Calendar, DollarSign, MapPin, Clock, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth.tsx';
import { useCreateProject } from '../hooks/useProjects';

export default function PostProject() {
  const navigate = useNavigate();
  const { categories: categoryOptions } = useSimpleCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const { subcategories: subcategoryOptions, loading: subcategoriesLoading } = useSubcategoriesByCategory(selectedCategory || null);
  const { user } = useAuth();
  const { createProject, loading: creatingProject } = useCreateProject();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    budget: '',
    budgetType: 'fixed',
    location: '',
    deadline: '',
    urgency: 'medium',
    skills: [] as string[],
    requirements: '',
    attachments: [] as File[]
  });

  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' }
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

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subcategory) newErrors.subcategory = 'Subcategory is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.budget) newErrors.budget = 'Budget is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (!user) {
        toast.error('You must be logged in to post a project.');
        return;
      }

      const budgetValue = Number(formData.budget);
      if (Number.isNaN(budgetValue)) {
        setErrors(prev => ({ ...prev, budget: 'Budget must be a valid number' }));
        return;
      }

      try {
        await createProject({
          user_id: user.id,
          title: formData.title.trim(),
          category: formData.category,
          subcategory: formData.subcategory || null,
          description: formData.description.trim(),
          budget: budgetValue,
          budget_type: formData.budgetType as 'fixed' | 'hourly' | 'monthly',
          location: formData.location.trim(),
          deadline: formData.deadline,
          urgency: formData.urgency as 'low' | 'medium' | 'high',
          skills: formData.skills,
          requirements: formData.requirements ? formData.requirements.trim() : null,
          attachments: null,
          status: 'pending'
        });

        toast.success('Project submitted successfully!');
        navigate(`/home/${user.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to post project';
        toast.error(message);
      }
    }
  };

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1); // At least 1 day from now

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
            <h1 className="text-3xl font-bold mb-2">Post a New Project</h1>
            <p className="text-gray-600">
              Describe your project requirements and connect with qualified healthcare professionals.
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
                      placeholder="e.g., CQC Registration for New Care Home"
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
                    <Select value={selectedCategory} onValueChange={handleCategoryChange} disabled={creatingProject}>
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
                      disabled={!selectedCategory || subcategoriesLoading || creatingProject}
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
                    <Label htmlFor="description">Project Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project in detail. Include specific requirements, goals, and any background information that will help freelancers understand your needs."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={6}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/2000 characters
                    </p>
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="requirements">Additional Requirements</Label>
                    <Textarea
                      id="requirements"
                      placeholder="Any specific requirements, qualifications, or preferences for the freelancer."
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional - {formData.requirements.length}/500 characters
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Required *</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill (e.g., CQC Registration)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {errors.skills && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.skills}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="attachments">Upload Files</Label>
                      <Input
                        id="attachments"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={handleFileChange}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
                      </p>
                    </div>

                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Files:</Label>
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget & Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget & Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Budget *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="budget"
                          type="number"
                          placeholder="5000"
                          value={formData.budget}
                          onChange={(e) => handleInputChange('budget', e.target.value)}
                          className={`pl-10 ${errors.budget ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.budget && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.budget}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="budgetType">Type</Label>
                      <Select value={formData.budgetType} onValueChange={(value) => handleInputChange('budgetType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Price</SelectItem>
                          <SelectItem value="hourly">Hourly Rate</SelectItem>
                          <SelectItem value="monthly">Monthly Retainer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deadline">Project Deadline *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.deadline}
                        min={minDeadline.toISOString().split('T')[0]}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        className={`pl-10 ${errors.deadline ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.deadline && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.deadline}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Urgency Level</Label>
                    <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {urgencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color.split(' ')[0]}`}></div>
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="location">Project Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="location"
                        placeholder="e.g., London, UK"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.location}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Card>
                <CardContent className="pt-6">
                  <Button type="submit" className="w-full" size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Post Project
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Your project will be reviewed before being published
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
