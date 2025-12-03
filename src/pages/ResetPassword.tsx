import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processRecovery = async () => {
      try {
        if (window.location.hash) {
          const hash = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hash.get('access_token');
          const refresh_token = hash.get('refresh_token');
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              throw error;
            }
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          setError('Reset link is invalid or has expired. Please request a new password reset email.');
          setStatus('error');
          return;
        }

        setStatus('ready');
      } catch (e) {
        console.error('Error processing password reset link:', e);
        setError('Unable to verify reset link. Please request a new password reset email.');
        setStatus('error');
      }
    };

    processRecovery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setStatus('submitting');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      setStatus('success');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (e) {
      console.error('Error updating password:', e);
      setError(e instanceof Error ? e.message : 'Failed to update password. Please try again.');
      setStatus('ready');
    }
  };

  const showForm = status === 'ready' || status === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center py-6 text-sm text-gray-600">
              Verifying your reset link...
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="text-center">
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Go to Login
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm text-gray-700">Your password has been updated successfully.</p>
              <p className="text-xs text-gray-500">Redirecting you to the login page...</p>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'submitting'}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={status === 'submitting'}
                />
              </div>

              <Button type="submit" className="w-full" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
