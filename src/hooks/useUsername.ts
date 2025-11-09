import { useEffect } from 'react';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { getUsername } from '../lib/usernames';

export function useEnsureUsername() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const ensureUsername = async () => {
      try {
        // Check if user already has a username
        const { data: userData, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking username:', error);
          return;
        }

        // If user has a username, we're done
        if (userData?.username) {
          console.log('User already has username:', userData.username);
          return;
        }

        // Generate and save username
        const newUsername = ensureUsername();
        console.log('Generating username for user:', user.id, '->', newUsername);

        const { error: updateError } = await supabase
          .from('users')
          .update({ username: newUsername })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to save username:', updateError);
        } else {
          console.log('Successfully saved username:', newUsername);
        }
      } catch (error) {
        console.error('Error in ensureUsername:', error);
      }
    };

    ensureUsername();
  }, [user?.id]);
}
