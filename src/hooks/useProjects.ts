import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  category: string;
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
  featured?: boolean;
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

export function useBuyerProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchProjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
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

export function useProjectBids(projectId: string | undefined) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchBids() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bids')
          .select(`
            *,
            seller:users!bids_seller_id_fkey (
              id,
              name,
              avatar,
              rating,
              review_count,
              company,
              job_title,
              location,
              is_verified
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBids(data || []);
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
        const { data, error } = await supabase
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
        setMessages(data || []);
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
        const { data, error } = await supabase
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

      const { data, error } = await (supabase as any)
        .from('bids')
        .insert({
          project_id: projectId,
          bid_amount: bidAmount,
          message: message || null
        })
        .select()
        .single();

      if (error) throw error;
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

      const { data, error } = await (supabase as any)
        .from('project_messages')
        .insert({
          project_id: projectId,
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
        const { data, error } = await supabase
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
        // Get high-budget projects that are open and not posted by this seller
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'open')
          .neq('user_id', sellerId)
          .gte('budget', 500) // Consider projects over £500 as featured
          .order('budget', { ascending: false })
          .limit(6);

        if (error) throw error;
        setProjects(data || []);
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('provider_id', sellerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [sellerId]);

  return { services, loading, error, refetch: () => {
    if (sellerId) {
      supabase
        .from('services')
        .select('*')
        .eq('provider_id', sellerId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) setServices(data);
        });
    }
  }};
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
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              rating,
              review_count,
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
          setService(data);
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

export function useServiceReviews(serviceId: string | undefined) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    async function fetchReviews() {
      try {
        setLoading(true);
        // For now, return mock reviews since we don't have a reviews table yet
        const mockReviews = [
          {
            id: '1',
            user_id: 'user1',
            user_name: 'John Smith',
            user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
            rating: 5,
            comment: 'Excellent service! Very professional and delivered exactly what was promised. Highly recommend!',
            created_at: '2024-01-15',
            helpful_count: 12
          },
          {
            id: '2',
            user_id: 'user2',
            user_name: 'Sarah Johnson',
            user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
            rating: 5,
            comment: 'Outstanding work quality and communication. The seller went above and beyond to ensure everything was perfect.',
            created_at: '2024-01-10',
            helpful_count: 8
          },
          {
            id: '3',
            user_id: 'user3',
            user_name: 'Mike Wilson',
            user_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
            rating: 4,
            comment: 'Great service overall. Quick delivery and good quality work. Will definitely use again.',
            created_at: '2024-01-08',
            helpful_count: 5
          }
        ];
        setReviews(mockReviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
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
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              rating,
              review_count
            )
          `)
          .eq('category', category)
          .neq('id', serviceId || '')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setServices(data || []);
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
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            username,
            email,
            avatar,
            rating,
            review_count,
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
        setSeller(data);
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
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            provider:users!services_provider_id_fkey (
              id,
              name,
              username,
              avatar,
              rating,
              review_count,
              company,
              job_title,
              location
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('useServices: Fetched services with provider usernames:', (data as any)?.map((service: any) => ({
          serviceId: service.id,
          providerId: service.provider_id,
          providerUsername: service.provider?.username,
          providerName: service.provider?.name
        })));
        setServices(data as any || []);
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
        const { data, error } = await supabase
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
      supabase
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
