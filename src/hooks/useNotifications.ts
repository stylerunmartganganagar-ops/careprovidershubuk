import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  timestamp: string;
  unread?: boolean;
  type: 'order' | 'message' | 'warning' | 'review' | 'bid';
  related_id?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch notifications from database
      const { data: dbNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform to our format
      const transformed: Notification[] = (dbNotifications || []).map(n => ({
        id: n.id,
        title: n.title,
        description: n.message ?? '',
        time: formatTimeAgo(new Date(n.created_at)),
        timestamp: n.created_at,
        unread: !n.is_read,
        type: (n.type as Notification['type']) || 'warning',
        related_id: n.related_id
      }));

      const bidRelatedIds = new Set(
        transformed
          .filter(n => n.type === 'bid' && n.related_id)
          .map(n => n.related_id as string)
      );

      // Backfill older bids that never created notifications
      const { data: ownedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      const projectIds = (ownedProjects || []).map(p => p.id).filter(Boolean);

      let combined = [...transformed];

      if (projectIds.length > 0) {
        const { data: bidRows, error: bidsError } = await (supabase as any)
          .from('bids')
          .select(`id, bid_amount, created_at,
            seller:users!bids_seller_id_fkey(name, username),
            project:projects!bids_project_id_fkey(id, title)`)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (bidsError) throw bidsError;

        const syntheticBidNotifications: Notification[] = (bidRows || [])
          .filter((bid: any) => !bidRelatedIds.has(bid.id))
          .map((bid: any) => {
            const sellerName = bid?.seller?.name || bid?.seller?.username || 'A seller';
            const projectTitle = bid?.project?.title || 'your project';
            const createdAt = bid?.created_at ? new Date(bid.created_at) : new Date();
            return {
              id: `bid-${bid.id}`,
              title: `Bid from ${sellerName}`,
              description: `${sellerName} placed a bid of £${Number(bid?.bid_amount ?? 0).toFixed(2)} on your project "${projectTitle}"`,
              time: formatTimeAgo(createdAt),
              timestamp: createdAt.toISOString(),
              unread: false,
              type: 'bid',
              related_id: bid?.id
            } as Notification;
          });

        combined = [...combined, ...syntheticBidNotifications];
      }

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(combined);
      setUnreadCount(combined.filter(n => n.unread).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase.from('notifications') as any)
        .update({ is_read: true } as any)
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, unread: false } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await (supabase.from('notifications') as any)
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      await fetchNotifications();
    };

    load();

    if (!user?.id) {
      return () => { isMounted = false; };
    }

    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString();
}
