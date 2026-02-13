import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);
  const [processing, setProcessing] = useState(true);

  // Step 1: Process tokens from URL (hash or query params)
  useEffect(() => {
    const processCallback = async () => {
      try {
        // 1) Handle hash fragment tokens (e.g., access_token, refresh_token from Supabase redirect)
        if (window.location.hash) {
          const hash = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hash.get('access_token');
          const refresh_token = hash.get('refresh_token');
          if (access_token && refresh_token) {
            console.log('AuthCallback: Setting session from hash tokens');
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) {
              console.error('Error setting session from hash:', error);
            } else {
              console.log('AuthCallback: Session set successfully from hash');
            }
            // Clear the hash to prevent reprocessing
            window.history.replaceState(null, '', window.location.pathname);
            setProcessing(false);
            return;
          }
        }

        // 2) Handle email confirmation with token_hash (verifyOtp)
        const search = new URLSearchParams(window.location.search);
        const token_hash = search.get('token_hash');
        const type = (search.get('type') as any) || undefined;
        const email = search.get('email') || undefined;
        if (token_hash && type) {
          console.log('AuthCallback: Verifying OTP with token_hash');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
            email,
          } as any);
          if (error) {
            console.error('Error verifying OTP:', error);
          } else {
            console.log('OTP verified successfully:', data);
            // Redirect directly to dashboard if we got a session
            const session = data?.session;
            if (session?.user) {
              const userRole = session.user.user_metadata?.role || 'client';
              const userId = session.user.id;
              hasRedirected.current = true;
              const redirectPath = userRole === 'provider'
                ? `/home/sellers/${userId}`
                : `/home/${userId}`;
              console.log('AuthCallback: Redirecting after OTP verification to:', redirectPath);
              navigate(redirectPath, { replace: true });
              return;
            }
          }
        }

        // 3) No tokens found — check if already authenticated
        if (!window.location.hash && !token_hash) {
          console.log('AuthCallback: No tokens in URL, checking existing session');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const userRole = session.user.user_metadata?.role || 'client';
            const userId = session.user.id;
            hasRedirected.current = true;
            const redirectPath = userRole === 'provider'
              ? `/home/sellers/${userId}`
              : `/home/${userId}`;
            console.log('AuthCallback: Already has session, redirecting to:', redirectPath);
            navigate(redirectPath, { replace: true });
            return;
          }
        }
      } catch (e) {
        console.error('Auth callback processing error:', e);
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
  }, [navigate]);

  // Step 2: Redirect when auth state resolves (fallback for hash token flow)
  useEffect(() => {
    if (hasRedirected.current) return;
    if (!processing && isAuthenticated && user && !loading) {
      hasRedirected.current = true;
      const redirectPath = user.role === 'provider'
        ? `/home/sellers/${user.id}`
        : `/home/${user.id}`;
      console.log('AuthCallback: Auth state resolved, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [processing, isAuthenticated, user, loading, navigate]);

  // Step 3: Timeout fallback — prevent endless spinner
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasRedirected.current) {
        console.log('AuthCallback: Timeout reached, redirecting to login');
        navigate('/login', { replace: true });
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Confirming your account...
        </h2>
        <p className="text-gray-600 mb-4">
          Please wait while we set up your CareProviders Hub account.
        </p>
        {(loading || processing) && (
          <p className="text-sm text-gray-500">
            Loading your profile...
          </p>
        )}
      </div>
    </div>
  );
}
