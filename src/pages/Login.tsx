import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Building2, Shield } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      console.log('Attempting login...');
      await auth.login(email, password);
      console.log('Login API call completed');

      // Don't check auth state immediately - let the auth state change listener handle it
      // The useEffect below will detect when user becomes authenticated

    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    try {
      setResetLoading(true);
      await auth.resetPassword(email);
      setResetMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle redirect after authentication - only when auth state naturally updates
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !auth.loading) {
      console.log('User authenticated, redirecting...', auth.user);
      // Redirect based on user role and actual user ID
      const redirectPath = auth.user.role === 'provider'
        ? `/home/sellers/${auth.user.id}`
        : `/home/${auth.user.id}`;
      console.log('Redirect path:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [auth.isAuthenticated, auth.user, auth.loading, navigate]);

  // Add a fallback timeout in case auth state never updates
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          console.log('Login timeout - auth state never updated');
          setError('Login is taking longer than expected. Please try again.');
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-white/90" />
              <h1 className="text-4xl font-bold mb-2">Healthcare Nexus</h1>
              <p className="text-xl text-blue-100">Connecting Care Providers</p>
            </div>
            <div className="space-y-4 text-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-3 text-green-400" />
                <span>Secure & Trusted Platform</span>
              </div>
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-3 text-green-400" />
                <span>Professional Healthcare Services</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo - only show on mobile */}
          <div className="lg:hidden text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Healthcare Nexus</h1>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8">
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
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-sm text-blue-600 hover:text-blue-500"
                    disabled={isLoading || resetLoading}
                  >
                    {resetLoading ? 'Sending reset link...' : 'Forgot your password?'}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup/freelancer" className="text-blue-600 hover:text-blue-500 font-medium">
                    Sign up as Provider
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}