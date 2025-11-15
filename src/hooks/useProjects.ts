import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Deterministic daily shuffle helper
export function dailyShuffle<T>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length <= 1) return items;
  const today = new Date();
  const seed = Number(
    `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(today.getUTCDate()).padStart(2, '0')}`
  );
  // Simple seeded PRNG (LCG)
  let s = seed % 2147483647;
  const rand = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  budget: number;
  budget_type: 'fixed' | 'hourly' | 'monthly';
  location: string;
  deadline: string;
  urgency: 'low' | 'medium' | 'high';
  skills: string[];
  requirements?: string;
  attachments?: string[];
  status: 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  featured_until?: string | null;
  featured_reason?: string | null;
}

export interface Bid {
  id: string;
  project_id: string;
  seller_id: string;
  bid_amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  seller?: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    rating: number;
    review_count: number;
    company?: string;
    job_title?: string;
    location?: string;
    is_verified: boolean;
  };
}

export interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  price: number;
  delivery_time: string; // Changed from number to string to match DB
  revisions?: number;
  requirements?: string[];
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  featured_until?: string;
  featured_reason?: string;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  approval_status?: string;
  provider?: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    review_count?: number;
    company?: string;
    job_title?: string;
    location?: string;
    is_verified?: boolean;
  };
}

export interface Portfolio {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  tags?: string[];
  project_url?: string;
  completion_date?: string;
  client_name?: string;
  testimonial?: string;
  rating?: number;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
  // UI-only fields for backward compatibility
  status?: 'draft' | 'published';
  type?: 'image' | 'video';
  views?: number;
}

type PortfolioInsert = {
  provider_id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  tags?: string[];
  project_url?: string | null;
  completion_date?: string | null;
  client_name?: string | null;
  testimonial?: string | null;
  rating?: number | null;
  is_featured?: boolean;
};

type ProjectInsert = {
  user_id: string;
  title: string;
  category: string;
  subcategory?: string | null;
  description: string;
  budget: number;
  budget_type: 'fixed' | 'hourly' | 'monthly';
  location: string;
  deadline: string;
  urgency: 'low' | 'medium' | 'high';
  skills: string[];
  requirements?: string | null;
  attachments?: string[] | null;
  status?: 'pending' | 'open' | 'in_progress' | 'completed' | 'cancelled';
};

export function useCreateProject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (projectData: ProjectInsert) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { createProject, loading, error };
}

export function useBuyerProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchProjects() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [userId]);

  return { projects, loading, error, refetch: () => {
    if (userId) {
      supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setProjects(data);
        });
    }
  }};
}

export function useUpdateProjectStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProjectStatus = async (projectId: string, status: Project['status']) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project status';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { updateProjectStatus, loading, error };
}

export function useProjectBids(projectId: string | undefined) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchBids() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('bids')
          .select(`
            *,
            seller:users!bids_seller_id_fkey (
              id,
              name,
              username,
              avatar,
              company,
              job_title,
              location,
              is_verified
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const baseBids = (data || []) as Bid[];
        let enrichedBids = baseBids;

        const missingSellerIds = enrichedBids
          .filter(b => !b.seller)
          .map(b => b.seller_id);

        if (missingSellerIds.length > 0) {
          try {
            const { data: missingUsers } = await (supabase as any)
              .from('users')
              .select('id, name, username, avatar, rating, review_count, company, job_title, location, is_verified')
              .in('id', missingSellerIds);

            if (missingUsers && Array.isArray(missingUsers)) {
              enrichedBids = enrichedBids.map(bid => {
                if (bid.seller) return bid;
                const userMatch = (missingUsers as any[]).find(u => u.id === bid.seller_id);
                if (!userMatch) return bid;
                return {
                  ...bid,
                  seller: {
                    id: userMatch.id,
                    name: userMatch.name || '',
                    username: userMatch.username || undefined,
                    avatar: userMatch.avatar || undefined,
                    rating: typeof userMatch.rating === 'number' ? userMatch.rating : Number(userMatch.rating) || 0,
                    review_count: userMatch.review_count || 0,
                    company: userMatch.company || undefined,
                    job_title: userMatch.job_title || undefined,
                    location: userMatch.location || undefined,
                    is_verified: !!userMatch.is_verified,
                  }
                } as Bid;
              });
            }
          } catch (missingErr) {
            console.error('Failed to backfill seller profiles for bids:', missingErr);
          }
        }

        // Enrich ratings from reviews to ensure accuracy
        const sellerIds = Array.from(new Set(enrichedBids.map(b => b.seller_id).filter(Boolean)));
        if (sellerIds.length) {
          try {
            const { data: revs } = await (supabase as any)
              .from('reviews')
              .select('reviewee_id, rating')
              .in('reviewee_id', sellerIds);
            const map: Record<string, { sum: number; count: number }> = {};
            (revs || []).forEach((r: any) => {
              const id = r.reviewee_id; const rating = Number(r.rating) || 0;
              if (!map[id]) map[id] = { sum: 0, count: 0 };
              map[id].sum += rating; map[id].count += 1;
            });
            const merged = enrichedBids.map(b => {
              const agg = map[b.seller_id];
              if (agg) {
                const avg = agg.count ? agg.sum / agg.count : 0;
                return {
                  ...b,
                  seller: {
                    ...b.seller,
                    rating: avg,
                    review_count: agg.count,
                  }
                } as Bid;
              }
              return b;
            });
            setBids(merged);
          } catch {
            setBids(enrichedBids);
          }
        } else {
          setBids(enrichedBids);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bids');
      } finally {
        setLoading(false);
      }
    }

    fetchBids();
  }, [projectId]);

  return { bids, loading, error };
}

interface ProjectMessage {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  sent_at: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}
export function useProjectMessages(projectId: string | undefined) {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchMessages() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('project_messages')
          .select(`
            *,
            sender:users!project_messages_sender_id_fkey (
              id,
              name,
              avatar
            )
          `)
          .eq('project_id', projectId)
          .order('sent_at', { ascending: true });

        if (error) throw error;
        setMessages((data as any) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [projectId]);

  return { messages, loading, error };
}

export function useProjectDetail(projectId: string | undefined) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Project not found');
        } else {
          setProject(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project');
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
}

export function useSubmitBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitBid = async (projectId: string, bidAmount: number, message?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const sellerId = authData?.user?.id;
      if (!sellerId) throw new Error('Not authenticated');

      // Check token balance first
      const { data: userRow, error: userErr } = await (supabase as any)
        .from('users')
        .select('bid_tokens, name, username')
        .eq('id', sellerId)
        .single();
      if (userErr) throw userErr;
      const currentTokens = (userRow as any)?.bid_tokens ?? 0;
      if (currentTokens < 1) {
        throw new Error('You do not have enough tokens to place a bid.');
      }

      const { data, error } = await (supabase as any)
        .from('bids')
        .insert({
          project_id: projectId,
          seller_id: sellerId,
          bid_amount: bidAmount,
          message: message || null
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct 1 token after successful bid insert
      const { error: tokenErr } = await (supabase as any)
        .from('users')
        .update({ bid_tokens: Math.max(0, (currentTokens ?? 0) - 1) })
        .eq('id', sellerId);
      if (tokenErr) throw tokenErr;
      try {
        const { data: proj } = await (supabase as any)
          .from('projects')
          .select('user_id, title')
          .eq('id', projectId)
          .single();
        const ownerId = (proj as any)?.user_id;
        const sellerName = (userRow as any)?.name || (userRow as any)?.username || 'A seller';
        const bidId = (data as any)?.id;
        if (ownerId) {
          await (supabase.from('notifications') as any).insert({
            user_id: ownerId,
            title: `New bid from ${sellerName}`,
            description: `${sellerName} placed a bid of £${bidAmount} on your project "${(proj as any)?.title ?? ''}"`,
            type: 'bid',
            related_id: bidId ?? null,
            is_read: false
          });
        }
      } catch {}
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit bid';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { submitBid, loading, error };
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (projectId: string, recipientId: string, content: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const senderId = authData?.user?.id;
      if (!senderId) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: senderId,
          recipient_id: recipientId,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}

export function useUpdateBidStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBidStatus = async (bidId: string, status: 'accepted' | 'rejected') => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('bids')
        .update({ status })
        .eq('id', bidId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update bid status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { updateBidStatus, loading, error };
}

export function useAvailableProjects(sellerId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchAvailableProjects() {
      try {
        setLoading(true);
        // Get projects that are open and not posted by this seller
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('status', 'open')
          .neq('user_id', sellerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available projects');
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableProjects();
  }, [sellerId]);

  return { projects, loading, error, refetch: () => {
    if (sellerId) {
      supabase
        .from('projects')
        .select('*')
        .eq('status', 'open')
        .neq('user_id', sellerId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setProjects(data);
        });
    }
  }};
}

export function useFeaturedProjects(sellerId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchFeaturedProjects() {
      try {
        setLoading(true);
        const { data: featuredProjects, error: projErr } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('status', 'open')
          .eq('is_featured', true)
          .neq('user_id', sellerId)
          .order('featured_until', { ascending: false, nullsLast: true })
          .order('created_at', { ascending: false })
          .limit(24);
        if (projErr) throw projErr;

        const activeFeatured = (featuredProjects || []).filter((project: Project) => {
          if (!project.featured_until) return true;
          return new Date(project.featured_until) > new Date();
        });

        const shuffled = dailyShuffle<Project>(activeFeatured);
        setProjects(shuffled.slice(0, 6));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch featured projects');
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProjects();
  }, [sellerId]);

  return { projects, loading, error };
}

export function useSearchBasedProjects(sellerId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchSearchBasedProjects() {
      try {
        setLoading(true);
        // For now, just get recent projects. In a real app, this would be based on seller's search history
        const { data, error } = await (supabase as any)
          .from('projects')
          .select('*')
          .eq('status', 'open')
          .neq('user_id', sellerId)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch search-based projects');
      } finally {
        setLoading(false);
      }
    }

    fetchSearchBasedProjects();
  }, [sellerId]);

  return { projects, loading, error };
}

export function useSellerServices(sellerId: string | undefined) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchServices() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              company,
              job_title,
              location
            )
          `)
          .eq('provider_id', sellerId)
          .eq('is_active', true) // Only fetch active services
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching seller services:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [sellerId]);

  const refetch = async () => {
    if (!sellerId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('services')
        .select(`
          *,
          provider:users!services_provider_id_fkey (
            id,
            name,
            username,
            avatar,
            company,
            job_title,
            location
          )
        `)
        .eq('provider_id', sellerId)
        .eq('is_active', true) // Only fetch active services
        .order('created_at', { ascending: false });

      if (!error && data) {
        setServices(data);
      }
      return { data, error };
    } catch (err) {
      console.error('Error refetching services:', err);
      return { error: err };
    }
  };

  return { services, loading, error, refetch };
}

export function useUpdateService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateService = async (serviceId: string, updates: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('services')
        .update(updates)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update service';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { updateService, loading, error };
}

export function useCreateService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create service';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createService, loading, error };
}

export function useServiceDetail(serviceId: string | undefined) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    async function fetchService() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              company,
              job_title,
              location
            )
          `)
          .eq('id', serviceId)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Service not found');
        } else {
          // For buyers, only show username instead of real name
          const modifiedData = {
            ...data,
            provider: {
              ...data.provider,
              // Buyers see only username, not real name
              name: data.provider?.username || 'Unknown Seller'
            }
          };
          setService(modifiedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch service');
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [serviceId]);

  return { service, loading, error };
}

// Function to update seller's rating and review count in the users table
export async function updateSellerRating(revieweeId: string) {
  try {
    // Get all reviews for this seller
    const { data: reviews, error: fetchError } = await (supabase as any)
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', revieweeId);

    if (fetchError) throw fetchError;

    // Calculate new average rating and review count
    const reviewCount = reviews?.length || 0;
    const totalRating = (reviews as { rating: number }[] | null)?.reduce((sum, review) => sum + (review.rating || 0), 0) || 0;
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    const updatePayload: any = {
      rating: parseFloat(averageRating.toFixed(1)),
      review_count: reviewCount,
      updated_at: new Date().toISOString()
    };

    // Update the user's record
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update(updatePayload)
      .eq('id', revieweeId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error('Error updating seller rating:', error);
    return { error };
  }
}

export function useServiceReviews(serviceId: string | undefined) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    async function fetchReviews() {
      try {
        setLoading(true);
        
        // First, get the service to find the provider_id
        const { data: serviceData, error: serviceError } = await (supabase as any)
          .from('services')
          .select('provider_id')
          .eq('id', serviceId)
          .single();

        if (serviceError) throw serviceError;
        if (!serviceData?.provider_id) {
          setReviews([]);
          return;
        }

        // Fetch all reviews for this provider (across all services)
        const { data, error: reviewsError } = await (supabase as any)
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            order_id,
            reviewer:users!reviews_reviewer_id_fkey (
              id,
              name,
              avatar
            )
          `)
          .eq('reviewee_id', serviceData.provider_id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        // Transform the data to match the expected format
        const formattedReviews = (data || []).map((review: any) => ({
          id: review.id,
          user_id: review.reviewer?.id,
          user_name: review.reviewer?.name || 'Anonymous',
          user_avatar: review.reviewer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer?.id || 'user'}`,
          rating: review.rating,
          comment: review.comment,
          created_at: new Date(review.created_at).toISOString().split('T')[0],
          helpful_count: 0 // This would need to be implemented if you track helpful votes
        }));

        setReviews(formattedReviews);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setReviews([]); // Return empty array on error
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [serviceId]);

  return { reviews, loading, error };
}

export function useRelatedServices(serviceId: string | undefined, category?: string) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;

    async function fetchRelatedServices() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar
            )
          `)
          .eq('category', category)
          .neq('id', serviceId || '')
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        
        // Modify data to show only username for buyers
        const modifiedData = (data as any)?.map((service: any) => ({
          ...service,
          provider: {
            ...service.provider,
            // Buyers see only username, not real name
            name: service.provider?.username || 'Unknown Seller'
          }
        }));
        
        setServices(modifiedData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch related services');
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedServices();
  }, [serviceId, category]);

  return { services, loading, error };
}

export function useSellerProfile(sellerId: string | undefined) {
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    async function fetchSeller() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('users')
          .select(`
            id,
            name,
            username,
            email,
            avatar,
            company,
            job_title,
            location,
            bio,
            is_verified,
            created_at
          `)
          .eq('id', sellerId)
          .single();

        if (error) throw error;
        let computedRating = 0;
        let computedReviewCount = 0;

        const { data: reviewsData, error: reviewsError } = await (supabase as any)
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', sellerId);

        if (reviewsError) {
          console.error('Failed to load seller reviews for profile:', reviewsError);
        } else if (reviewsData) {
          computedReviewCount = reviewsData.length;
          if (computedReviewCount > 0) {
            const totalRating = (reviewsData as { rating: number }[]).reduce(
              (sum, review) => sum + Number(review.rating || 0),
              0
            );
            computedRating = totalRating / computedReviewCount;
          }
        }

        setSeller({
          ...data,
          rating: parseFloat(computedRating.toFixed(1)),
          review_count: computedReviewCount
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch seller profile');
      } finally {
        setLoading(false);
      }
    }

    fetchSeller();
  }, [sellerId]);

  return { seller, loading, error };
}

export function useDeleteService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteService = async (serviceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await (supabase as any)
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete service';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { deleteService, loading, error };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              company,
              job_title,
              location
            )
          `)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('useServices: Error fetching services:', error);
          throw error;
        }
        console.log('useServices: Fetched services with provider usernames:', (data as any)?.map((service: any) => ({
          serviceId: service.id,
          providerId: service.provider_id,
          providerUsername: service.provider?.username,
          providerName: service.provider?.name
        })));
        
        // Modify data to show only username for buyers
        const modifiedData: Service[] = (data as any)?.map((service: any) => ({
          ...service,
          provider: {
            ...service.provider,
            name: service.provider?.username || 'Unknown Seller'
          }
        })) || [];

        // Prioritize featured services, shuffle featured daily, then append non-featured
        const featured = modifiedData.filter((s: any) => s.is_featured === true && (!s.featured_until || new Date(s.featured_until) > new Date()));
        const nonFeatured = modifiedData.filter((s: any) => !featured.includes(s as any));
        const shuffledFeatured = dailyShuffle(featured);
        setServices([...shuffledFeatured, ...nonFeatured]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  return { services, loading, error };
}

export function useCreatePortfolio() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPortfolio = async (portfolioData: PortfolioInsert) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create portfolio item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createPortfolio, loading, error };
}

export function useSellerPortfolio(providerId: string | undefined) {
  const [portfolioItems, setPortfolioItems] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!providerId) return;

    async function fetchPortfolio() {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('portfolios')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPortfolioItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
      } finally {
        setLoading(false);
      }
    }

    fetchPortfolio();
  }, [providerId]);

  return { portfolioItems, loading, error, refetch: () => {
    if (providerId) {
      (supabase as any)
        .from('portfolios')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setPortfolioItems(data);
        });
    }
  }};
}

export function useUpdatePortfolio() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePortfolio = async (portfolioId: string, updates: Partial<PortfolioInsert>) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await (supabase as any)
        .from('portfolios')
        .update(updates)
        .eq('id', portfolioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update portfolio item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { updatePortfolio, loading, error };
}

export function useDeletePortfolio() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deletePortfolio = async (portfolioId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await (supabase as any)
        .from('portfolios')
        .delete()
        .eq('id', portfolioId);

      if (error) throw error;
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete portfolio item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { deletePortfolio, loading, error };
}
