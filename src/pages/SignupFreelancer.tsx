import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function SignupFreelancer() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    serviceCategory: '',
    experience: '',
    bio: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupData, setSignupData] = useState<any>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Handle automatic redirection when email is confirmed
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && isWaitingForConfirmation) {
      console.log('Freelancer authenticated after email confirmation, saving profile data and redirecting...', auth.user);
      // Save additional profile data now that user is authenticated
      if (signupData) {
        saveProfileData(signupData);
      }
      // Redirect to seller dashboard
      navigate(`/home/sellers/${auth.user.id}`, { replace: true });
    }
  }, [auth.isAuthenticated, auth.user, isWaitingForConfirmation, navigate, signupData]);

  const saveProfileData = async (data: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        const updatePayload: Database['public']['Tables']['users']['Update'] = {
          name: fullName,
          company: data.businessName || null,
          job_title: data.serviceCategory || null,
          bio: data.bio || null,
          experience: data.experience || null,
          specializations: data.serviceCategory ? [data.serviceCategory] : null,
          location: null,
          website: null,
        };

        await supabase
          .from('users')
          // @ts-ignore: TypeScript incorrectly infers Update type as never
          .update(updatePayload)
          .eq('id', user.user.id);

        console.log('Profile data saved successfully');
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsRegistering(true);
    console.log('Starting freelancer signup process...');

    try {
      // Create full name from first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      console.log('Freelancer signup - calling auth.signup with:', {
        email: formData.email,
        name: fullName,
        role: 'provider'
      });

      // Use Supabase signup to create the provider account
      const result = await auth.signup(
        formData.email,
        formData.password,
        fullName,
        'provider' // Role for freelancers/providers
      );

      console.log('Freelancer signup result:', result);
      setIsRegistering(false); // Always set loading to false after API call

      if (result.success) {
        if (result.requiresConfirmation) {
          console.log('Email confirmation required, switching to verification waiting state');
          // Email confirmation required - show waiting state and save data for later
          setSignupEmail(formData.email);
          setSignupData(formData); // Save form data for profile creation after confirmation
          setIsWaitingForConfirmation(true);
        } else {
          console.log('No confirmation required, saving profile data and redirecting to login');
          // Save additional profile data
          await saveProfileData(formData);
          navigate('/login');
        }
      }
    } catch (error) {
      console.error('Freelancer registration failed:', error);
      setIsRegistering(false);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again or contact support.');
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!formData.email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    try {
      setResetLoading(true);
      await auth.resetPassword(formData.email);
      setResetMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {isWaitingForConfirmation ? 'Email Confirmation Required' : 'Join as a Professional'}
          </CardTitle>
          {!isWaitingForConfirmation && (
            <p className="text-center text-muted-foreground">
              Create your account to offer your services on Providers Hub
            </p>
          )}
        </CardHeader>
        <CardContent>
          {isWaitingForConfirmation ? (
            // Verification waiting state - same as SignupUser.tsx step 5
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
                <p>This page will automatically redirect once you confirm your email.</p>
                <button
                  onClick={() => {
                    setIsWaitingForConfirmation(false);
                    setSignupEmail('');
                  }}
                  className="text-blue-600 hover:underline mt-2 block"
                >
                  Wrong email? Go back to change it.
                </button>
              </div>
            </div>
          ) : (
            // Registration form
            <>
              {error && (
                <Alert className="mb-6" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {resetMessage && !error && (
                <Alert className="mb-6">
                  <AlertDescription>{resetMessage}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="mt-1"
                      disabled={isRegistering}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="mt-1"
                      disabled={isRegistering}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name (Optional)
                  </label>
                  <Input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    className="mt-1"
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700">
                    Service Category
                  </label>
                  <Select value={formData.serviceCategory} onValueChange={(value) => handleChange('serviceCategory', value)} disabled={isRegistering}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your service category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cqc">CQC Registration</SelectItem>
                      <SelectItem value="consulting">Business Consulting</SelectItem>
                      <SelectItem value="software">Care Software</SelectItem>
                      <SelectItem value="training">Training Services</SelectItem>
                      <SelectItem value="visa">Sponsor Visa</SelectItem>
                      <SelectItem value="accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <Select value={formData.experience} onValueChange={(value) => handleChange('experience', value)} disabled={isRegistering}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio (Optional)
                  </label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your expertise and experience..."
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className="mt-1"
                    rows={3}
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="mt-1"
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="mt-1"
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="mt-1"
                    disabled={isRegistering}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isRegistering}>
                  {isRegistering ? (
                    <>
                      <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating Professional Account...
                    </>
                  ) : (
                    'Create Professional Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/login" className="text-primary hover:underline">
                      Sign in here
                    </a>
                  </p>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
                    disabled={isRegistering || resetLoading}
                  >
                    {resetLoading ? 'Sending reset link...' : 'Forgot your password?'}
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
