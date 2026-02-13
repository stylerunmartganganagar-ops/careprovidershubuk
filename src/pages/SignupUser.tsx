import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useCategories';

interface RegistrationData {
  service: string;
  urgency: string;
  budget: string;
  notes: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessType: string;
  businessSize: string;
  location: string;
  phone: string;
}

interface SignupUserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialService?: string;
  initialLocation?: string;
}

export default function SignupUser({ open, onOpenChange, initialService, initialLocation }: SignupUserProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [hasInitialService, setHasInitialService] = useState(false);
  const [formData, setFormData] = useState<RegistrationData>({
    service: initialService || '',
    urgency: '',
    budget: '',
    notes: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: '',
    businessSize: '',
    location: initialLocation || '',
    phone: '',
  });

  // Reset form when modal opens with new initial data
  useEffect(() => {
    if (open) {
      setIsWaitingForConfirmation(false);
      setIsSigningUp(false);
      setSignupEmail('');
      
      // If service is already selected, start from step 2, otherwise step 1
      const hasInitial = !!initialService;
      setHasInitialService(hasInitial);
      const startStep = hasInitial ? 2 : 1;
      setCurrentStep(startStep);
      
      setFormData({
        service: initialService || '',
        urgency: '',
        budget: '',
        notes: '',
        email: '',
        password: '',
        confirmPassword: '',
        businessType: '',
        businessSize: '',
        location: initialLocation || '',
        phone: '',
      });
    }
  }, [open, initialService, initialLocation]);

  // Listen for auth state changes during email verification
  useEffect(() => {
    if (!isWaitingForConfirmation || !signupEmail) return;

    console.log('Waiting for email confirmation for:', signupEmail);

    // The AuthProvider will handle the auth state changes
    // When the user confirms their email, the auth state will change
    // and the modal should close automatically due to the auth state listener

    // Set up a timeout to close the modal if confirmation takes too long
    const timeout = setTimeout(() => {
      if (isWaitingForConfirmation) {
        console.log('Email confirmation timeout, closing modal');
        setIsWaitingForConfirmation(false);
        onOpenChange(false);
        alert('Email confirmation is taking longer than expected. Please try refreshing the page or check your email again.');
      }
    }, 300000); // 5 minutes timeout

    return () => clearTimeout(timeout);
  }, [isWaitingForConfirmation, signupEmail, onOpenChange]);

  // Auto-close modal when user becomes authenticated after verification
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && isWaitingForConfirmation) {
      console.log('User authenticated after verification, closing signup modal');
      setIsWaitingForConfirmation(false);
      onOpenChange(false);
    }
  }, [auth.isAuthenticated, auth.user, isWaitingForConfirmation, onOpenChange]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Validation for each step
    switch (currentStep) {
      case 1:
        if (!formData.service) {
          alert('Please select a service to continue.');
          return;
        }
        break;
      case 2:
        if (!formData.urgency) {
          alert('Please select a timeline to continue.');
          return;
        }
        break;
      case 3:
        if (!formData.budget) {
          alert('Please select a budget range to continue.');
          return;
        }
        break;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    // If we have an initial service and we're going back from step 2, skip to step 1 (which is actually step 2 in UI)
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      // If we have an initial service and new step would be 1, skip to step 2
      if (hasInitialService && newStep === 1) {
        setCurrentStep(2); // Stay at step 2 (timeline) since step 1 is not needed
      } else {
        setCurrentStep(newStep);
      }
    }
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsSigningUp(true);
    console.log('Starting signup process...');

    try {
      // Use Supabase signup to create the user account
      const result = await auth.signup(
        formData.email,
        formData.password,
        formData.email.split('@')[0], // Use email prefix as name initially
        'client' // Default role for signup users
      );

      console.log('Signup result:', result);
      setIsSigningUp(false); // Always set loading to false after API call

      if (result.success) {
        if (result.requiresConfirmation) {
          console.log('Email confirmation required, switching to step 5');
          // Email confirmation required - keep modal open and show waiting state
          setSignupEmail(formData.email);
          setIsWaitingForConfirmation(true);
          setCurrentStep(5); // Show confirmation waiting step
        } else {
          console.log('No confirmation required, closing modal');
          // No confirmation required - close modal immediately
          onOpenChange(false);
          // Navigation will be handled by auth state change
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setIsSigningUp(false); // Ensure loading is set to false on error
      alert('Registration failed. Please try again or contact support.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-center mb-2">What service do you need?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Select the primary service you're looking for
              </p>
            </div>
            {categoriesLoading && (
              <p className="text-sm text-muted-foreground text-center">
                Loading services...
              </p>
            )}

            {!categoriesLoading && categoriesError && (
              <p className="text-sm text-red-500 text-center">
                Unable to load services. Please try again.
              </p>
            )}

            {!categoriesLoading && !categoriesError && categories.length > 0 && (
              <div className="space-y-4">
                {categories.map((category) => {
                  // Skip categories that don't make sense for buyers
                  if (category.name === 'Buyers') return null;
                  
                  const value = category.name;
                  const isSelected = formData.service === value;
                  return (
                    <div
                      key={category.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                      onClick={() => handleChange('service', value)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.subcategories?.length || 0} services available
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                No services available yet.
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-center mb-2">When do you need this service?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                How soon are you looking to get started?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "asap", label: "ASAP", desc: "Within the next week - urgent need", icon: "🚨" },
                { value: "soon", label: "Soon", desc: "Within the next month", icon: "📅" },
                { value: "flexible", label: "Flexible", desc: "No specific timeline", icon: "🕐" },
              ].map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.urgency === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => handleChange('urgency', option.value)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.desc}</div>
                    </div>
                    {formData.urgency === option.value && (
                      <div className="ml-auto w-6 h-6 bg-primary rounded-full flex items-center justify-center md:hidden">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-center mb-2">What's your budget range?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Help us find services that match your budget
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { value: "under-1000", label: "Under £1,000", desc: "Basic services and consultations" },
                { value: "1000-5000", label: "£1,000 - £5,000", desc: "Standard service packages" },
                { value: "5000-15000", label: "£5,000 - £15,000", desc: "Comprehensive solutions" },
                { value: "over-15000", label: "Over £15,000", desc: "Enterprise-level services" },
                { value: "discuss", label: "Let's discuss", desc: "Prefer to discuss pricing options" },
              ].map((budget) => (
                <div
                  key={budget.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.budget === budget.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                  onClick={() => handleChange('budget', budget.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{budget.label}</div>
                      <div className="text-sm text-muted-foreground">{budget.desc}</div>
                    </div>
                    {formData.budget === budget.value && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center md:hidden">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-center mb-2">Create your account</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Set up your login credentials to get started
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="mt-1"
                  placeholder="Create a strong password"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="mt-1"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Your Service Request:</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Service:</span> {formData.service || 'Not selected'}</p>
                <p><span className="font-medium">Timeline:</span> {formData.urgency || 'Not selected'}</p>
                <p><span className="font-medium">Budget:</span> {formData.budget || 'Not selected'}</p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Verify Your Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We've sent a verification email to <strong>{signupEmail}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Please click the confirmation link in your email.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Waiting for email confirmation...</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>This window will automatically close once you confirm your email.</p>
              <button
                onClick={() => {
                  setIsWaitingForConfirmation(false);
                  setCurrentStep(4);
                }}
                className="text-blue-600 hover:underline mt-2"
              >
                Wrong email? Go back to change it.
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[1280px] !max-w-[1280px] max-h-[85vh] overflow-y-auto" style={{ width: '1280px !important', maxWidth: '1280px !important' }}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStep < 5 ? (
              <>
                Join Providers Hub
                <div className="text-sm font-normal text-muted-foreground mt-2">
                  Step {hasInitialService ? currentStep - 1 : currentStep} of {hasInitialService ? 3 : 4}
                </div>
              </>
            ) : (
              'Email Confirmation Required'
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); currentStep === 4 && !isSigningUp && handleSubmit(); }} className="space-y-6">
          {renderStepContent()}

          {currentStep < 4 && (
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
              <div className="ml-auto">
                <Button type="button" onClick={currentStep === 4 ? handleSubmit : nextStep}>
                  {currentStep === 4 ? 'Create Account' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex justify-center mt-8">
              <Button type="submit" disabled={isSigningUp} className="w-full">
                {isSigningUp ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          )}
        </form>

        {currentStep === 1 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
