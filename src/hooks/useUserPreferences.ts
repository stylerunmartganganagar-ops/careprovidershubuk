import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserPreferences {
    id: string;
    user_id: string;
    preferred_service: string | null;
    preferred_urgency: string | null;
    preferred_budget: string | null;
    preferred_location: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Hook to fetch user preferences from the database.
 * Used to curate the dashboard experience.
 */
export function useUserPreferences(userId: string | undefined) {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setPreferences(null);
            setLoading(false);
            return;
        }

        async function fetchPreferences() {
            try {
                setLoading(true);
                const { data, error } = await (supabase as any)
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (error) throw error;
                setPreferences(data || null);
            } catch (err) {
                console.error('Error fetching user preferences:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
            } finally {
                setLoading(false);
            }
        }

        fetchPreferences();
    }, [userId]);

    return { preferences, loading, error };
}

/**
 * Save or update user preferences after signup.
 */
export async function saveUserPreferences(
    userId: string,
    prefs: {
        preferred_service?: string;
        preferred_urgency?: string;
        preferred_budget?: string;
        preferred_location?: string;
    }
) {
    try {
        const { data, error } = await (supabase as any)
            .from('user_preferences')
            .upsert({
                user_id: userId,
                preferred_service: prefs.preferred_service || null,
                preferred_urgency: prefs.preferred_urgency || null,
                preferred_budget: prefs.preferred_budget || null,
                preferred_location: prefs.preferred_location || null,
                onboarding_completed: true,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error saving user preferences:', err);
        throw err;
    }
}

/**
 * Helper: Convert a budget preference string into a numeric range [min, max].
 * Returns [0, Infinity] for unknown values.
 */
export function budgetToRange(budget: string | null): [number, number] {
    switch (budget) {
        case 'under-1000': return [0, 1000];
        case '1000-5000': return [1000, 5000];
        case '5000-15000': return [5000, 15000];
        case 'over-15000': return [15000, Infinity];
        case 'discuss': return [0, Infinity];
        default: return [0, Infinity];
    }
}
