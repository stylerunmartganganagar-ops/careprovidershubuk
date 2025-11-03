// Username generation utility
import { useState, useEffect } from 'react';

// Cache for generated usernames to avoid duplicates
const usernameCache = new Map<string, string>();

// Generate a unique username from adjective + noun + number
function generateUsername(): string {
  const adjectives = [
    'Swift', 'Bright', 'Clever', 'Quick', 'Smart', 'Sharp', 'Bold', 'Calm',
    'Cool', 'Fair', 'Fine', 'Fresh', 'Glad', 'Great', 'Happy', 'Kind',
    'Nice', 'Proud', 'Pure', 'Right', 'Safe', 'Sound', 'Sure', 'True'
  ];

  const nouns = [
    'Eagle', 'Tiger', 'Lion', 'Wolf', 'Bear', 'Fox', 'Owl', 'Hawk',
    'Deer', 'Horse', 'Fish', 'Bird', 'Tree', 'River', 'Lake', 'Star',
    'Moon', 'Sun', 'Cloud', 'Wind', 'Rain', 'Snow', 'Fire', 'Ice'
  ];

  let attempts = 0;
  while (attempts < 100) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999) + 1;
    const username = `${adj}${noun}${num}`;

    // Check if already used
    if (!usernameCache.has(username)) {
      return username;
    }
    attempts++;
  }

  // Fallback
  return `User${Date.now()}`;
}

// Synchronous fallback for when async fails
function getUsernameSync(userId: string): string {
  const cached = usernameCache.get(userId);
  if (cached) return cached;

  const username = generateUsername();
  usernameCache.set(userId, username);
  return username;
}

// Async function to get username from database or generate new one
export async function getUsername(userId: string): Promise<string> {
  // Check cache first
  const cached = usernameCache.get(userId);
  if (cached) {
    return cached;
  }

  try {
    // Import supabase dynamically to avoid circular imports
    const { supabase } = await import('./supabase');

    // Fetch username from database
    const { data: user, error } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (!error && (user as any)?.username) {
      // Cache and return existing username
      const username = (user as any).username;
      usernameCache.set(userId, username);
      return username;
    }

    // If no username found, generate one and save it
    const newUsername = generateUsername();
    console.log(`Generated new username: ${newUsername}`);

    // Update the user record with the new username
    const { error: updateError, data: updateData } = await (supabase as any)
      .from('users')
      .update({ username: newUsername } as any)
      .eq('id', userId)
      .select('username')
      .single();

    console.log('Update result:', { updateError, updateData: (updateData as any)?.username });

    if (updateError) {
      console.error('Failed to save username to database:', updateError);
      // Return generated username anyway
      usernameCache.set(userId, newUsername);
      return newUsername;
    }

    // Cache and return the new username
    usernameCache.set(userId, newUsername);
    console.log(`Generated and saved username for user ${userId}: ${newUsername}`);
    return newUsername;

  } catch (error) {
    console.error('Error fetching/saving username:', error);
    // Fallback to generating a username without saving
    const fallbackUsername = generateUsername();
    usernameCache.set(userId, fallbackUsername);
    console.log(`Using fallback username: ${fallbackUsername}`);
    return fallbackUsername;
  }
}

// React hook for managing usernames
export const useUsername = (userId: string) => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    getUsername(userId).then((fetchedUsername) => {
      setUsername(fetchedUsername);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load username:', error);
      setUsername(getUsernameSync(userId)); // Fallback
      setLoading(false);
    });
  }, [userId]);

  return { username, loading };
};
