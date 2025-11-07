import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from './supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: 'client' | 'provider' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: 'provider' | 'client' | 'admin') => Promise<void>;
  signup: (email: string, password: string, name: string, role?: 'provider' | 'client' | 'admin') => Promise<{ success: boolean; message: string; requiresConfirmation?: boolean }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple username generator used when creating a new profile
function generateUsername() {
  const adjectives = ['bright', 'swift', 'clear', 'calm', 'brave', 'smart'];
  const animals = ['lion', 'eagle', 'panda', 'otter', 'wolf', 'fox'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${animal}-${suffix}`;
}

type DBProfile = Partial<User> & { id?: string };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');

        // Check if there's any auth data in localStorage
        const authKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
        console.log('Auth keys in localStorage:', authKeys.length);

        // Get initial session - trust the stored tokens
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log('Session check result:', { hasSession: !!session, userId: session?.user?.id });

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('Session found, setting user');
          await setUserFromSession(session);
        } else if (mounted) {
          console.log('No session found, setting user to null');
          setUser(null);
        }

        if (mounted) {
          setLoading(false);
          console.log('Initial auth setup complete, loading:', false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user);

      try {
        if (session?.user) {
          await setUserFromSession(session);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('Auth state change processed, loading set to false');
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserFromSession = async (session: Session) => {
    const { user: supabaseUser } = session;
    console.log('setUserFromSession called:', {
      userId: supabaseUser.id,
      email: supabaseUser.email,
      metadata: supabaseUser.user_metadata,
      roleFromMetadata: supabaseUser.user_metadata?.role
    });

    // Immediately set user with session data (non-blocking)
    const initialUserData: User = {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      username: supabaseUser.user_metadata?.username || '', // Will be filled by hook
      email: supabaseUser.email || '',
      avatar: supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
      role: supabaseUser.user_metadata?.role || 'client',
    };

    console.log('Setting initial user data:', initialUserData);
    setUser(initialUserData);

    // Asynchronously load/update profile data
    try {
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 1000)
      );

      const { data: profile, error } = (await Promise.race([queryPromise, timeoutPromise])) as { data: DBProfile | null; error: any };

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it with username
        const username = generateUsername();
        console.log(`Creating profile with username: ${username} for user ${supabaseUser.id}`);

        const { data: newProfile, error: insertError } = await (supabase.from('users') as any)
          .upsert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
            username: username, // Always create username during profile creation
            role: supabaseUser.user_metadata?.role || 'client',
            avatar: supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
          }, { onConflict: 'id' })
          .select()
          .single();

        if (!insertError && newProfile) {
          const updatedUserData: User = {
            id: supabaseUser.id,
            name: (newProfile as DBProfile).name || initialUserData.name,
            username: (newProfile as DBProfile).username || username, // Should always have username
            email: supabaseUser.email || '',
            avatar: (newProfile as DBProfile).avatar || initialUserData.avatar,
            role: (newProfile as DBProfile).role || initialUserData.role,
          };
          setUser(updatedUserData);
          console.log('Created new profile with username:', updatedUserData.username);
        } else {
          console.error('Failed to create profile with username:', insertError);
        }
      } else if (!error && profile) {
        // Profile exists, update user data
        const updatedUserData: User = {
          id: supabaseUser.id,
          name: (profile as DBProfile).name || initialUserData.name,
          username: (profile as DBProfile).username || initialUserData.username,
          email: supabaseUser.email || '',
          avatar: (profile as DBProfile).avatar || initialUserData.avatar,
          role: (profile as DBProfile).role || initialUserData.role,
        };
        setUser(updatedUserData);
        console.log('Updated user with existing profile data:', updatedUserData);
      }
    } catch (err) {
      // Only log actual errors, not timeouts (which are expected and non-blocking)
      if (!(err instanceof Error) || !err.message.includes('timeout')) {
        console.error('Profile loading error (non-blocking):', err);
      }
      // Profile loading failed, but user is already set with session data
      // This is acceptable - user can still use the app
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'provider' | 'client' | 'admin' = 'client') => {
    console.log('Auth.signup called with:', { email, name, role });
    try {
      // Get the current origin and construct auth callback URL
      const callbackUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: callbackUrl, // Redirect to auth callback
        },
      });

      console.log('Supabase signup response:', { data: data?.user?.id, user: data?.user, error });

      if (error) throw error;

      // For admin users, always try to create the profile immediately
      // This ensures admin accounts are available even before email confirmation
      if (data.user && role === 'admin') {
        console.log('Creating admin profile immediately...');
        try {
          const adminUsername = generateUsername();
          console.log(`Creating admin profile with username: ${adminUsername}`);

          const { error: profileError } = await (supabase.from('users') as any)
            .upsert({
              id: data.user.id,
              email,
              name,
              username: adminUsername, // Generate username for admin
              role: 'admin', // Explicitly set admin role
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
            }, { onConflict: 'id' });

          if (profileError) {
            console.error('Error creating admin profile:', profileError);
            // For admin accounts, this is critical - throw the error
            throw new Error('Failed to create admin profile. Please try again.');
          } else {
            console.log('Admin profile created successfully');
          }
        } catch (profileErr) {
          console.error('Profile creation error:', profileErr);
          throw profileErr;
        }
      }

      // If user is created and confirmed immediately (no email confirmation required)
      if (data.user && data.session) {
        console.log('User created with session, profile already created above for admin');

        // User will be set by the auth state change listener
        return { success: true, message: 'Account created successfully!' };
      } else if (data.user && !data.session) {
        console.log('User created, email confirmation required.');

        // For non-admin users, profile creation happens after confirmation
        // For admin users, profile was already created above
        return {
          success: true,
          message: role === 'admin'
            ? 'Admin account created! You can now login to the admin panel.'
            : 'Please verify your account by confirming your email address.',
          requiresConfirmation: role !== 'admin'
        };
      }

    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, role?: 'provider' | 'client') => {
    console.log('Login called for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful');
      // User will be set by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout called');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      console.log('Supabase signOut successful, setting user to null');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
