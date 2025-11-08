import { supabase } from '../lib/supabase';

export interface NotificationData {
  user_id: string;
  title: string;
  description: string;
  type: 'order' | 'message' | 'system' | 'review' | 'bid';
  related_id?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(notification: NotificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        description: notification.description,
        type: notification.type,
        related_id: notification.related_id,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
}

/**
 * Create notification when a review is submitted
 */
export async function notifyReviewSubmitted(revieweeId: string, reviewerName: string, rating: number) {
  return createNotification({
    user_id: revieweeId,
    title: 'New review received',
    description: `You received a ${rating}-star review from ${reviewerName}`,
    type: 'review'
  });
}

/**
 * Create notification when an order status changes
 */
export async function notifyOrderStatusUpdate(buyerId: string, orderTitle: string, status: string) {
  const statusMessages = {
    'in_progress': 'Your order is now in progress',
    'completed': 'Your order has been completed',
    'cancelled': 'Your order has been cancelled'
  };

  return createNotification({
    user_id: buyerId,
    title: `Order update: ${orderTitle}`,
    description: statusMessages[status as keyof typeof statusMessages] || `Order status changed to ${status}`,
    type: 'order'
  });
}

/**
 * Create notification when a bid is received
 */
export async function notifyBidReceived(providerId: string, projectTitle: string, bidderName: string) {
  return createNotification({
    user_id: providerId,
    title: 'New bid received',
    description: `${bidderName} placed a bid on your project: ${projectTitle}`,
    type: 'bid'
  });
}

/**
 * Create notification when a message is received
 */
export async function notifyMessageReceived(recipientId: string, senderName: string, messagePreview: string) {
  return createNotification({
    user_id: recipientId,
    title: `New message from ${senderName}`,
    description: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
    type: 'message'
  });
}
