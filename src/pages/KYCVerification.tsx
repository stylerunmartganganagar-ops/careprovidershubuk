import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  ArrowLeft,
  Upload,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  CreditCard,
  Users,
  Home,
  Car
} from 'lucide-react';

type KycDocument = {
  document_type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement' | 'other';
  front_document_url: string;
  back_document_url?: string;
  selfie_url?: string;
};

const documentTypes = [
  { value: 'passport', label: 'Passport', icon: FileText, requiresBack: true },
  { value: 'drivers_license', label: 'Driver\'s License', icon: Car, requiresBack: true },
  { value: 'national_id', label: 'National ID Card', icon: CreditCard, requiresBack: true },
  { value: 'utility_bill', label: 'Utility Bill', icon: Home, requiresBack: true },
  { value: 'bank_statement', label: 'Bank Statement', icon: Users, requiresBack: true },
  { value: 'other', label: 'Other Document', icon: FileText, requiresBack: true },
];

export default function KYCVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<KycDocument>({
    document_type: 'passport',
    front_document_url: '',
    back_document_url: '',
    selfie_url: '',
  });

  const [frontDocumentFile, setFrontDocumentFile] = useState<File | null>(null);
  const [backDocumentFile, setBackDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || process.env?.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'kyc_documents';

    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured. Please set VITE_CLOUDINARY_CLOUD_NAME environment variable.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleFileUpload = useCallback(async (file: File, type: 'front' | 'back' | 'selfie') => {
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);

      if (type === 'front') {
        setFormData(prev => ({ ...prev, front_document_url: url }));
        setFrontDocumentFile(file);
      } else if (type === 'back') {
        setFormData(prev => ({ ...prev, back_document_url: url }));
        setBackDocumentFile(file);
      } else {
        setFormData(prev => ({ ...prev, selfie_url: url }));
        setSelfieFile(file);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!user?.id || !formData.front_document_url || !formData.back_document_url) {
      setError('Please upload both front and back photos of your document before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const kycData = {
        user_id: user.id,
        document_type: formData.document_type,
        front_document_url: formData.front_document_url,
        back_document_url: formData.back_document_url || null,
        selfie_url: formData.selfie_url || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      };

      const { error: submitError } = await (supabase
        .from('kyc_documents')
        .insert(kycData) as any);

      if (submitError) throw submitError;

      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('KYC submission failed:', error);
      setError('Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Identity Verification</h2>
              <p className="text-gray-600">
                Please select the type of document you want to use for verification.
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="document-type">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, document_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={nextStep}>Continue</Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upload Documents</h2>
              <p className="text-gray-600">
                Upload both front and back photos of your selected document.
              </p>
            </div>

            <div className="space-y-4">
              {/* Front Document Upload */}
              <div>
                <Label htmlFor="front-document-upload">Front of Document</Label>
                <div className="mt-2">
                  <input
                    id="front-document-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'front')}
                    className="hidden"
                  />
                  <label htmlFor="front-document-upload">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      {frontDocumentFile ? (
                        <div>
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm text-green-600">{frontDocumentFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Front uploaded</p>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload front photo</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Back Document Upload */}
              <div>
                <Label htmlFor="back-document-upload">Back of Document</Label>
                <div className="mt-2">
                  <input
                    id="back-document-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'back')}
                    className="hidden"
                  />
                  <label htmlFor="back-document-upload">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      {backDocumentFile ? (
                        <div>
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm text-green-600">{backDocumentFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Back uploaded</p>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload back photo</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <Label htmlFor="selfie-upload">Selfie (Optional)</Label>
                <div className="mt-2">
                  <input
                    id="selfie-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'selfie')}
                    className="hidden"
                  />
                  <label htmlFor="selfie-upload">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      {selfieFile ? (
                        <div>
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                          <p className="text-sm text-green-600">{selfieFile.name}</p>
                        </div>
                      ) : (
                        <div>
                          <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload selfie</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {uploading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button
                onClick={nextStep}
                disabled={
                  !formData.front_document_url ||
                  !formData.back_document_url ||
                  uploading
                }
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Review & Submit</h2>
              <p className="text-gray-600">
                Please review your information before submitting.
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Document Type</Label>
                  <p className="text-sm text-gray-600">
                    {documentTypes.find(t => t.value === formData.document_type)?.label}
                  </p>
                </div>

                {/* Front Document Preview */}
                {formData.front_document_url && (
                  <div>
                    <Label className="text-sm font-medium">Front of Document</Label>
                    <img
                      src={formData.front_document_url}
                      alt="Front document preview"
                      className="w-full max-w-sm mx-auto mt-2 rounded-lg border"
                    />
                  </div>
                )}

                {/* Back Document Preview */}
                {formData.back_document_url && (
                  <div>
                    <Label className="text-sm font-medium">Back of Document</Label>
                    <img
                      src={formData.back_document_url}
                      alt="Back document preview"
                      className="w-full max-w-sm mx-auto mt-2 rounded-lg border"
                    />
                  </div>
                )}

                {/* Selfie Preview */}
                {formData.selfie_url && (
                  <div>
                    <Label className="text-sm font-medium">Selfie</Label>
                    <img
                      src={formData.selfie_url}
                      alt="Selfie preview"
                      className="w-32 h-32 mx-auto mt-2 rounded-full border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your documents will be reviewed by our team within 24-48 hours.
                You'll receive an email notification once the review is complete.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your KYC documents have been submitted successfully. We'll review them within 24-48 hours.
            </p>
            <Button onClick={() => navigate('/profile')} className="w-full">
              Return to Profile
            </Button>
          </CardContent>
        </Card>
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
              Back to Profile
            </Button>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
            <p className="text-gray-600">
              Complete your identity verification to unlock all platform features.
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Document Type</span>
            <span>Upload Documents</span>
            <span>Review & Submit</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="w-full" />
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
