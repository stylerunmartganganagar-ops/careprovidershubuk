import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { MessageSquare, Send, Users, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { CreateMilestonesDialog } from '../components/CreateMilestonesDialog';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  attachments?: string[];
  message_type?: string; // 'text' | 'order_start' | 'order_accept' | 'milestone_created' | 'milestone_completed' | 'milestone_order_start' | 'milestone_order_accept'
  metadata?: any;
  is_read?: boolean;
  milestone_order_id?: string;
}

interface MessageInsert {
  sender_id: string;
  receiver_id: string;
  content: string;
  attachments?: string[];
  message_type?: string;
  metadata?: any;
  milestone_order_id?: string;
}

interface ChatPartner {
  id: string;
  name: string;
  avatar: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Conversation {
  partner: ChatPartner;
  messages: Message[];
  lastActivity: string;
  hasNewMessage?: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<ChatPartner | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [attachments, setAttachments] = useState<string[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'client' | 'provider' | 'admin' | null>(null);

  // Accepted milestone order for milestone creation
  const [acceptedMilestoneOrderId, setAcceptedMilestoneOrderId] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestonesLoaded, setMilestonesLoaded] = useState(false);

  // Milestones for individual milestone order messages
  const [messageMilestones, setMessageMilestones] = useState<Record<string, any[]>>({});
  const [loadingMilestones, setLoadingMilestones] = useState<Set<string>>(new Set());

  // Start Order dialog state
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [orderTitle, setOrderTitle] = useState('');
  const [orderPrice, setOrderPrice] = useState<number>(0);
  const [orderDeliveryDays, setOrderDeliveryDays] = useState<number>(3);
  const [orderRequirements, setOrderRequirements] = useState('');

  // Start Milestone Order dialog state
  const [showStartMilestoneDialog, setShowStartMilestoneDialog] = useState(false);
  const [milestoneOrderTitle, setMilestoneOrderTitle] = useState('');
  const [milestoneOrderTotalAmount, setMilestoneOrderTotalAmount] = useState<number>(0);
  const [milestoneOrderRequirements, setMilestoneOrderRequirements] = useState('');
  const [milestonesOrder, setMilestonesOrder] = useState<Array<{
    title: string;
    description: string;
    amount: string;
    due_date: string;
  }>>([{ title: '', description: '', amount: '', due_date: '' }]);

  const { user } = useAuth();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const chatWith = searchParams.get('chatWith') || searchParams.get('with');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backfilledIdsRef = useRef<Set<string>>(new Set());
  const autoSelectedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const activeChatRef = useRef<string | null>(null);

  const markConversationAsRead = async (partnerId: string) => {
    if (!user?.id) return;
    try {
      await (supabase.from('messages') as any)
        .update({ is_read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setMessages(prev =>
        prev.map(msg =>
          msg.sender_id === partnerId ? { ...msg, is_read: true } : msg
        )
      );

      setConversations(prev =>
        prev.map(conv =>
          conv.partner.id === partnerId
            ? {
                ...conv,
                hasNewMessage: false,
                messages: conv.messages.map(msg =>
                  msg.sender_id === partnerId ? { ...msg, is_read: true } : msg
                ),
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark conversation as read', error);
    }
  };

  // Backfill any conversations with missing partner details (e.g., due to RLS on join)
  useEffect(() => {
    const missingIds = conversations
      .filter(c => !c.partner.name || c.partner.name === 'Unknown User')
      .map(c => c.partner.id)
      .filter(id => !backfilledIdsRef.current.has(id)); // Only fetch IDs we haven't backfilled yet

    if (missingIds.length === 0) return;

    (async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('id,name,username,avatar,role')
          .in('id', missingIds);
        if (!data) return;

        // Mark these IDs as backfilled
        missingIds.forEach(id => backfilledIdsRef.current.add(id));

        setConversations(prev => prev.map(c => {
          const u = data.find(d => d.id === c.partner.id);
          if (!u) return c;
          return {
            ...c,
            partner: {
              ...c.partner,
              name: (u as any).name || (u as any).username || c.partner.name,
              avatar: (u as any).avatar || c.partner.avatar,
              role: (u as any).role || c.partner.role
            }
          };
        }));
        if (activeChat) {
          const u = data.find(d => d.id === activeChat);
          if (u) {
            setPartnerInfo(p => p ? {
              ...p,
              name: (u as any).name || (u as any).username || p.name,
              avatar: (u as any).avatar || p.avatar,
              role: (u as any).role || p.role
            } : p);
          }
        }
      } catch {}
    })();
  }, [conversations.length, activeChat]);

  // Load conversations and set up real-time
  useEffect(() => {
    if (user?.id) {
      userIdRef.current = user.id;
      loadConversations();
      const channelCleanup = setupRealtime();
      // Load current user role for permissioned actions (e.g., Start Order by provider only)
      (async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!error && data) setCurrentUserRole((data as any).role as any);
        } catch {}
      })();

      return () => {
        if (channelCleanup) channelCleanup();
      };
    }
  }, [user?.id]);

  // When arriving with chatWith param, auto-select AFTER conversations are loaded
  useEffect(() => {
    if (chatWith && conversations.length > 0) {
      setShowChatList(false);
      selectChat(chatWith);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatWith, conversations.length]);

  // Prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Auto-select chat on load: priority -> URL param -> last selected -> first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeChat && !autoSelectedRef.current) {
      autoSelectedRef.current = true; // Mark as auto-selected to prevent re-runs

      if (chatWith) {
        selectChat(chatWith);
        return;
      }

      // Try restore last selected chat for this user
      try {
        const key = `last_chat_${user?.id}`;
        const last = key ? localStorage.getItem(key) : null;
        if (last) {
          const exists = conversations.some(c => c.partner.id === last);
          if (exists) {
            selectChat(last);
            return;
          }
        }
      } catch {}

      // Fallback: select the first conversation (most recent)
      if (conversations[0]) {
        selectChat(conversations[0].partner.id);
      }
    }
  }, [chatWith, conversations, activeChat, user?.id]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Scroll to bottom when switching chats
  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
    }
  }, [activeChat]);

  // Periodic refresh when disconnected
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        if (connectionStatus === 'disconnected' &&
            Date.now() - lastRefresh.getTime() > 10000) {
          manualRefresh();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id, connectionStatus, lastRefresh]);

  // Load milestones for milestone order start messages
  useEffect(() => {
    messages.forEach(message => {
      if (message.message_type === 'milestone_order_start' && message.milestone_order_id && !messageMilestones[message.id]) {
        loadMessageMilestones(message.milestone_order_id, message.id);
      }
    });
  }, [messages]);

  const setupRealtime = () => {
    const channel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user?.id}`
      }, (payload) => {
        setConnectionStatus('connected');
        handleNewMessage(payload.new as Message);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`
      }, (payload) => {
        setConnectionStatus('connected');
        handleNewMessage(payload.new as Message);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('connected');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          setTimeout(manualRefresh, 2000);
        }
      });

    return () => supabase.removeChannel(channel);
  };

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      console.log('Loading conversations for user:', user.id);

      // Get all messages for this user
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          id, sender_id, receiver_id, content, created_at, attachments, message_type, metadata,
          sender:users!messages_sender_id_fkey(id, name, username, avatar, role),
          receiver:users!messages_receiver_id_fkey(id, name, username, avatar, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Loaded messages:', allMessages?.length || 0);

      if (!allMessages || allMessages.length === 0) {
        console.log('No messages found in database. User needs to start conversations first.');
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();

      allMessages?.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partner: {
              id: partner.id,
              name: partner.name || partner.username || 'Unknown User',
              avatar: partner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              role: partner.role || 'user',
              lastMessage: msg.content,
              lastMessageTime: msg.created_at,
            },
            messages: [],
            lastActivity: msg.created_at
          });
        }

        conversationMap.get(partnerId)!.messages.unshift({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          created_at: msg.created_at,
          attachments: msg.attachments || [],
          message_type: msg.message_type || 'text',
          metadata: msg.metadata || null,
          is_read: msg.is_read,
        });
      });

      const conversationList = Array.from(conversationMap.values())
        .map(conv => ({
          ...conv,
          hasNewMessage: conv.messages.some(m => m.receiver_id === user.id && !m.is_read),
        }))
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

      console.log('Created conversations:', conversationList.length);
      setConversations(conversationList);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      setLoading(false);
    }
  };

  const selectChat = async (partnerId: string) => {
    const conversation = conversations.find(conv => conv.partner.id === partnerId);

    if (conversation) {
      setMessages(conversation.messages);
      setPartnerInfo(conversation.partner);
      setConversations(prev => prev.map(conv =>
        conv.partner.id === partnerId ? { ...conv, hasNewMessage: false } : conv
      ));
      // restore cached attachments for this chat
      try {
        const cached = localStorage.getItem(`chat_attachments_${partnerId}`);
        setAttachments(cached ? JSON.parse(cached) : []);
      } catch {
        setAttachments([]);
      }
      await markConversationAsRead(partnerId);

      // Find accepted milestone order in messages
      const acceptedMilestoneOrderMessage = conversation.messages.find(msg =>
        msg.message_type === 'milestone_order_accept' && msg.metadata?.proposal_id
      );

      if (acceptedMilestoneOrderMessage) {
        // Get the milestone order ID from the message
        setAcceptedMilestoneOrderId(acceptedMilestoneOrderMessage.milestone_order_id || null);
        setMilestonesLoaded(false); // Reset to force reload
      } else {
        setAcceptedMilestoneOrderId(null);
        setMilestonesLoaded(false);
      }
    } else {
      // Load messages for new conversation
      const { data: chatMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      const messagesToShow = (chatMessages || []).map(msg => ({ ...msg, is_read: msg.is_read ?? false }));
      setMessages(messagesToShow);
      setPartnerInfo({
        id: partnerId,
        name: 'Unknown User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        role: 'user'
      });

      // Try to hydrate partner info if conversations aren't ready yet
      try {
        const { data: partner } = await supabase
          .from('users')
          .select('id,name,username,avatar,role')
          .eq('id', partnerId)
          .single();
        if (partner) {
          setPartnerInfo({
            id: partner.id,
            name: partner.name || partner.username || 'User',
            avatar: partner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            role: (partner as any).role || 'user'
          });
        }
      } catch {}
      await markConversationAsRead(partnerId);

      // Find accepted milestone order in loaded messages
      const acceptedMilestoneOrderMessage = messagesToShow.find(msg =>
        msg.message_type === 'milestone_order_accept' && msg.metadata?.proposal_id
      );

      if (acceptedMilestoneOrderMessage) {
        setAcceptedMilestoneOrderId(acceptedMilestoneOrderMessage.milestone_order_id || null);
        setMilestonesLoaded(false);
      } else {
        setAcceptedMilestoneOrderId(null);
        setMilestonesLoaded(false);
      }
    }

    // persist selection per user so it survives refresh
    try {
      if (user?.id) localStorage.setItem(`last_chat_${user.id}`, partnerId);
    } catch {}

    setActiveChat(partnerId);
    setShowChatList(false);
    // Ensure we scroll to the latest message when opening a chat
    scrollToBottom();
  };

  const handleNewMessage = (newMessage: Message) => {
    const currentUserId = userIdRef.current;
    const currentActiveChat = activeChatRef.current;

    if (!currentUserId) return;

    const isActiveChatMessage =
      (newMessage.sender_id === currentUserId && newMessage.receiver_id === currentActiveChat) ||
      (newMessage.sender_id === currentActiveChat && newMessage.receiver_id === currentUserId);

    if (isActiveChatMessage) {
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      scrollToBottom();

      if (newMessage.sender_id === currentActiveChat && newMessage.receiver_id === currentUserId) {
        markConversationAsRead(newMessage.sender_id);
      }
    }

    setConversations(prev => {
      let conversationMatched = false;
      const updated = prev.map(conv => {
        const isRelevant = conv.partner.id === newMessage.sender_id || conv.partner.id === newMessage.receiver_id;
        if (!isRelevant) {
          return conv;
        }

        conversationMatched = true;

        const shouldMarkNew = newMessage.sender_id !== currentUserId && conv.partner.id !== currentActiveChat;
        const alreadyHasMessage = conv.messages.some(msg => msg.id === newMessage.id);

        return {
          ...conv,
          messages: alreadyHasMessage ? conv.messages : [...conv.messages, newMessage],
          lastActivity: newMessage.created_at,
          hasNewMessage: shouldMarkNew || conv.hasNewMessage,
          partner: {
            ...conv.partner,
            lastMessage: newMessage.content,
            lastMessageTime: newMessage.created_at,
          },
        };
      });

      if (!conversationMatched) {
        const partnerId = newMessage.sender_id === currentUserId ? newMessage.receiver_id : newMessage.sender_id;
        const isIncoming = newMessage.sender_id !== currentUserId;

        return [
          ...updated,
          {
            partner: {
              id: partnerId,
              name: 'Unknown User',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              role: 'user',
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
            },
            messages: [newMessage],
            lastActivity: newMessage.created_at,
            hasNewMessage: isIncoming,
          },
        ].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
      }

      return updated.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || !user?.id || !activeChat) return;

    const messageData: MessageInsert = {
      sender_id: user.id,
      receiver_id: activeChat,
      content: input.trim(),
      attachments: attachments.length ? attachments : undefined,
      message_type: 'text',
    };
    setInput('');
    setAttachments([]);

    // Create optimistic message outside try block
    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      ...messageData,
      created_at: new Date().toISOString()
    };

    try {
      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await (supabase.from('messages') as any)
        .insert(messageData as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const insertedMessage = data as Message;
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticMessage.id ? insertedMessage : msg
        ));

        // Immediately scroll down to show more message history
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const currentScroll = container.scrollTop;
          const scrollAmount = 80; // Scroll down 80px to show more history
          container.scrollTo({
            top: currentScroll + scrollAmount,
            behavior: 'smooth'
          });
        }

      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setInput(messageData.content);
    }
  };

  const manualRefresh = async () => {
    setLastRefresh(new Date());
    await loadConversations();
    if (activeChat) await selectChat(activeChat);
  };

  const completeMilestone = async (milestoneId: string) => {
    if (!user?.id || !acceptedMilestoneOrderId) return;

    try {
      // Update milestone status to completed
      const { error: updateError } = await supabase
        .from('milestones')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', milestoneId)
        .eq('seller_id', user.id); // Ensure only seller can complete

      if (updateError) throw updateError;

      // Send milestone completed message
      const messageData: MessageInsert = {
        sender_id: user.id,
        receiver_id: activeChat!,
        content: 'Milestone completed and payment processed',
        message_type: 'milestone_completed',
        milestone_order_id: acceptedMilestoneOrderId,
        metadata: { milestone_id: milestoneId }
      };

      await supabase.from('messages').insert(messageData);

      // Here you would typically trigger payment processing
      // For now, just mark as paid
      await supabase
        .from('milestones')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      // Update milestone order payment status
      const { data: allMilestones } = await supabase
        .from('milestones')
        .select('payment_status, amount')
        .eq('milestone_order_id', acceptedMilestoneOrderId);

      if (allMilestones) {
        const totalPaid = allMilestones
          .filter(m => m.payment_status === 'paid')
          .reduce((sum, m) => sum + m.amount, 0);

        const allCompleted = allMilestones.every(m => m.payment_status === 'paid');

        await supabase
          .from('milestone_orders')
          .update({
            paid_amount: totalPaid,
            payment_status: allCompleted ? 'paid' : 'partially_paid',
            status: allCompleted ? 'completed' : 'in_progress',
            completed_at: allCompleted ? new Date().toISOString() : null
          })
          .eq('id', acceptedMilestoneOrderId);
      }

      toast.success('Milestone completed successfully!');
    } catch (error) {
      console.error('Failed to complete milestone', error);
      toast.error('Failed to complete milestone');
    }
  };

  const sendOrderStart = async () => {
    if (!user?.id || !activeChat) return;
    if (currentUserRole !== 'provider') {
      alert('Only providers can start orders');
      return;
    }
    if (!orderTitle.trim() || orderPrice <= 0 || orderDeliveryDays <= 0) return;

    const meta = {
      title: orderTitle.trim(),
      price: orderPrice,
      delivery_days: orderDeliveryDays,
      requirements: orderRequirements.trim() || null,
    };

    try {
      // First create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: activeChat, // partner is buyer
          provider_id: user.id, // current user is provider
          service_id: null,
          title: meta.title,
          description: meta.requirements,
          price: meta.price,
          status: 'pending',
          delivery_date: new Date(Date.now() + meta.delivery_days * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order', orderError);
        alert('Failed to create order');
        return;
      }

      // Then send the message
      const messageData: MessageInsert = {
        sender_id: user.id,
        receiver_id: activeChat,
        content: `Order proposal: ${meta.title} - £${meta.price} (${meta.delivery_days} days)`,
        message_type: 'order_start',
        metadata: meta,
      };

      const { data, error } = await (supabase.from('messages') as any)
        .insert(messageData as any)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        handleNewMessage(data as Message);
      }
      setShowStartDialog(false);
      setOrderTitle('');
      setOrderPrice(0);
      setOrderDeliveryDays(3);
      setOrderRequirements('');
      alert('Order proposal sent!');
    } catch (e) {
      console.error('Failed to start order', e);
      alert('Failed to send order proposal');
    }
  };

  const acceptOrder = async (proposalMessage: Message) => {
    if (!user?.id || !activeChat) return;

    const messageData: MessageInsert = {
      sender_id: user.id,
      receiver_id: activeChat,
      content: 'Order accepted ✅',
      message_type: 'order_accept',
      metadata: { proposal_id: proposalMessage.id },
    };
    try {
      const { data, error } = await (supabase.from('messages') as any)
        .insert(messageData as any)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        handleNewMessage(data as Message);
        // update linked pending order to in_progress
        const proposalId = proposalMessage.id;
        await (supabase.from('orders') as any)
          .update({ status: 'in_progress' })
          .eq('proposal_message_id', proposalId);
      }
    } catch (e) {
      console.error('Failed to accept order', e);
    }
  };

  const acceptMilestoneOrder = async (proposalMessage: Message) => {
    if (!user?.id || !activeChat) return;

    const messageData: MessageInsert = {
      sender_id: user.id,
      receiver_id: activeChat,
      content: 'Milestone order accepted ✅',
      message_type: 'milestone_order_accept',
      milestone_order_id: proposalMessage.milestone_order_id,
      metadata: { proposal_id: proposalMessage.id },
    };
    try {
      const { data, error } = await (supabase.from('messages') as any)
        .insert(messageData as any)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        handleNewMessage(data as Message);
        // update linked pending milestone order to in_progress
        const orderId = proposalMessage.milestone_order_id;
        await (supabase.from('milestone_orders') as any)
          .update({ status: 'in_progress' })
          .eq('id', orderId);
      }
    } catch (e) {
      console.error('Failed to accept milestone order', e);
    }
  };

  const addMilestone = () => {
    setMilestonesOrder(prev => [...prev, { title: '', description: '', amount: '', due_date: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestonesOrder(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof typeof milestonesOrder[0], value: string) => {
    setMilestonesOrder(prev => prev.map((milestone, i) =>
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const loadMessageMilestones = async (milestoneOrderId: string, messageId: string) => {
    if (loadingMilestones.has(messageId) || messageMilestones[messageId]) return;

    setLoadingMilestones(prev => new Set(prev).add(messageId));

    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('milestone_order_id', milestoneOrderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessageMilestones(prev => ({
        ...prev,
        [messageId]: data || []
      }));
    } catch (error) {
      console.error('Failed to load message milestones', error);
    } finally {
      setLoadingMilestones(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const sendMilestoneOrderStart = async () => {
    if (!user?.id || !activeChat) return;
    if (currentUserRole !== 'provider') {
      alert('Only providers can start milestone orders');
      return;
    }
    if (!milestoneOrderTitle.trim() || milestoneOrderTotalAmount <= 0) return;

    // Validate milestones
    const validMilestones = milestonesOrder.filter(m => m.title.trim() && m.description.trim() && m.amount && m.due_date);
    if (validMilestones.length === 0) {
      alert('Please add at least one milestone');
      return;
    }

    // Validate milestone amounts and due dates
    let totalMilestoneAmount = 0;
    for (const milestone of validMilestones) {
      const amount = parseFloat(milestone.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter valid amounts for all milestones');
        return;
      }
      totalMilestoneAmount += amount;

      const dueDate = new Date(milestone.due_date);
      if (dueDate <= new Date()) {
        alert('All milestone due dates must be in the future');
        return;
      }
    }

    if (totalMilestoneAmount > milestoneOrderTotalAmount) {
      alert(`Total milestone amounts (£${totalMilestoneAmount}) cannot exceed order total (£${milestoneOrderTotalAmount})`);
      return;
    }

    const meta = {
      title: milestoneOrderTitle.trim(),
      total_amount: milestoneOrderTotalAmount,
      requirements: milestoneOrderRequirements.trim() || null,
      milestone_count: validMilestones.length,
    };

    try {
      // First create the milestone order
      const { data: milestoneOrder, error: orderError } = await supabase
        .from('milestone_orders')
        .insert({
          buyer_id: activeChat, // partner is buyer
          provider_id: user.id, // current user is provider
          title: meta.title,
          description: meta.requirements,
          total_amount: meta.total_amount,
          currency: 'GBP',
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create milestone order', orderError);
        alert('Failed to create milestone order');
        return;
      }

      // Create the milestones
      const milestonesData = validMilestones.map(milestone => ({
        milestone_order_id: milestoneOrder.id,
        seller_id: user.id,
        buyer_id: activeChat,
        title: milestone.title.trim(),
        description: milestone.description.trim(),
        amount: parseFloat(milestone.amount),
        currency: 'GBP',
        due_date: new Date(milestone.due_date).toISOString(),
        status: 'pending'
      }));

      const { error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestonesData);

      if (milestonesError) {
        console.error('Failed to create milestones', milestonesError);
        alert('Failed to create milestones');
        return;
      }

      // Then send the message
      const messageData: MessageInsert = {
        sender_id: user.id,
        receiver_id: activeChat,
        content: `Milestone order proposal: ${meta.title} - ${validMilestones.length} milestone(s) totaling £${totalMilestoneAmount.toFixed(2)}`,
        message_type: 'milestone_order_start',
        milestone_order_id: milestoneOrder.id,
        metadata: meta,
      };

      const { data, error } = await (supabase.from('messages') as any)
        .insert(messageData as any)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        handleNewMessage(data as Message);
      }
      setShowStartMilestoneDialog(false);
      setMilestoneOrderTitle('');
      setMilestoneOrderTotalAmount(0);
      setMilestoneOrderRequirements('');
      setMilestonesOrder([{ title: '', description: '', amount: '', due_date: '' }]);
      alert(`Milestone order proposal sent with ${validMilestones.length} milestone(s)!`);
    } catch (e) {
      console.error('Failed to start milestone order', e);
      alert('Failed to send milestone order proposal');
    }
  };

  const getConnectionStatusColor = () =>
    connectionStatus === 'connected' ? 'text-green-500' :
    connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500';

  const getConnectionStatusText = () =>
    connectionStatus === 'connected' ? 'Real-time connected' :
    connectionStatus === 'connecting' ? 'Connecting...' :
    'Disconnected - Manual refresh required';

  const getDisplayName = () =>
    partnerInfo?.name ||
    conversations.find(conv => conv.partner.id === activeChat)?.partner.name ||
    'Chat';

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current!.scrollTop = messagesContainerRef.current!.scrollHeight;
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6 overflow-hidden h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
          {/* Conversations Sidebar */}
          <div className={`md:col-span-1 border rounded-lg flex flex-col h-full ${showChatList ? 'block' : 'hidden md:block'}`}>
            <div className="flex-shrink-0 p-3 border-b font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Conversations ({conversations.length})
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto max-h-[400px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium mb-2">No conversations yet</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    Start a conversation by clicking "Contact" on any service or seller profile.
                  </p>
                  <p className="text-xs text-gray-400">
                    Messages you send will appear here once you start chatting with service providers.
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600">
                      💡 Tip: Browse services on the dashboard and click "Continue" to start a conversation with sellers.
                    </p>
                  </div>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.partner.id}
                    onClick={() => selectChat(conversation.partner.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors border-b border-gray-100 last:border-b-0 min-h-[72px] ${
                      activeChat === conversation.partner.id ? 'bg-accent/60 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <img src={conversation.partner.avatar} alt={conversation.partner.name} />
                      </Avatar>
                      {conversation.hasNewMessage && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-medium truncate ${conversation.hasNewMessage ? 'text-blue-600' : ''}`}>
                          {conversation.partner.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {conversation.partner.lastMessageTime ?
                            new Date(conversation.partner.lastMessageTime).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${conversation.hasNewMessage ? 'font-medium text-gray-900' : 'text-muted-foreground'}`}>
                        {conversation.partner.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`md:col-span-3 border rounded-lg flex flex-col h-full ${!showChatList ? 'block' : 'hidden md:block'}`}>
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="flex-shrink-0 p-3 border-b font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setShowChatList(true)} className="md:hidden p-1 rounded hover:bg-gray-100">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar className="h-8 w-8">
                      <img src={partnerInfo?.avatar} alt={getDisplayName()} />
                    </Avatar>
                    <div>
                      <span className="font-medium">{getDisplayName()}</span>
                      <div className="text-xs text-gray-500 capitalize">{partnerInfo?.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 text-xs ${getConnectionStatusColor()}`}>
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-500' :
                        connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="hidden sm:inline">{getConnectionStatusText()}</span>
                    </div>
                    <button onClick={manualRefresh} className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800" title="Refresh messages">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50 max-h-[calc(100vh-330px)] md:max-h-[400px]">

                  {connectionStatus === 'disconnected' && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Real-time connection lost</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>Messages will update automatically every 10 seconds. Click the refresh button for immediate updates.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium mb-2">Start a conversation</h4>
                      <p className="text-sm text-gray-400 mb-4">Send the first message to begin your discussion</p>
                      <p className="text-xs text-gray-400">Messages are delivered instantly and securely</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div key={message.id} className={`flex mb-3 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`w-full max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.sender_id === user?.id ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md'
                          }`}>
                            {(!message.message_type || message.message_type === 'text') && (
                              <>
                                {message.content && (
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                )}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {message.attachments.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border-2 border-white/20 hover:opacity-90 transition-opacity">
                                        <img src={url} alt={`attachment-${idx + 1}`} className="w-full h-32 object-cover" loading="lazy" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}

                            {message.message_type === 'milestone_order_start' && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={message.sender_id === user?.id ? 'secondary' : 'default'}>Milestone Order Proposal</Badge>
                                  <span className="text-xs opacity-80">{new Date(message.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium">{message.metadata?.title}</div>
                                  <div>Total Amount: £{message.metadata?.total_amount}</div>
                                  {message.metadata?.requirements && (
                                    <div className="mt-1 text-xs opacity-90 whitespace-pre-wrap">Req: {message.metadata?.requirements}</div>
                                  )}
                                </div>

                                {/* Individual Milestones */}
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Milestones</div>
                                  {loadingMilestones.has(message.id) ? (
                                    <div className="text-xs text-gray-500">Loading milestones...</div>
                                  ) : messageMilestones[message.id]?.length > 0 ? (
                                    messageMilestones[message.id].map((milestone: any, index: number) => (
                                      <div key={milestone.id} className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{milestone.title}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                              £{milestone.amount} • Due: {new Date(milestone.due_date).toLocaleDateString()}
                                            </div>
                                            {milestone.description && (
                                              <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                                                {milestone.description}
                                              </div>
                                            )}
                                            <Badge
                                              variant={milestone.status === 'accepted' ? 'default' : milestone.status === 'completed' ? 'default' : 'secondary'}
                                              className="text-xs mt-2"
                                            >
                                              {milestone.status}
                                            </Badge>
                                          </div>
                                          {message.receiver_id === user?.id && milestone.status === 'pending' && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => acceptIndividualMilestone(milestone, message)}
                                              className="ml-2 text-xs"
                                            >
                                              Accept
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-gray-500">No milestones found</div>
                                  )}
                                </div>

                                {/* Overall Accept Button (kept for backward compatibility) */}
                                {message.receiver_id === user?.id && (
                                  <div className="pt-1">
                                    <Button size="sm" variant="secondary" onClick={() => acceptMilestoneOrder(message)}>
                                      Accept All Milestones
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}

                            {message.message_type === 'order_start' && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={message.sender_id === user?.id ? 'secondary' : 'default'}>Order Proposal</Badge>
                                  <span className="text-xs opacity-80">{new Date(message.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-sm">
                                  <div className="font-medium">{message.metadata?.title}</div>
                                  <div>Price: £{message.metadata?.price}</div>
                                  <div>Delivery: {message.metadata?.delivery_days} day(s)</div>
                                  {message.metadata?.requirements && (
                                    <div className="mt-1 text-xs opacity-90 whitespace-pre-wrap">Req: {message.metadata?.requirements}</div>
                                  )}
                                </div>
                                {message.receiver_id === user?.id && (
                                  <div className="pt-1">
                                    {messages.some(m => m.message_type === 'order_accept' && m.metadata?.proposal_id === message.id) ? (
                                      <Button size="sm" variant="secondary" disabled>
                                        Accepted
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="secondary" onClick={() => acceptOrder(message)}>
                                        Accept Order
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {message.message_type === 'milestone_order_accept' && (
                              <div className="space-y-1">
                                <Badge variant="default">Milestone Order Accepted</Badge>
                                <div className="text-sm">The milestone order has been accepted and can proceed.</div>
                              </div>
                            )}

                            {message.message_type === 'milestone_created' && (
                              <div className="space-y-1">
                                <Badge variant="default">Milestones Created</Badge>
                                <div className="text-sm">
                                  {message.metadata?.milestone_count} milestone(s) created totaling £{message.metadata?.total_amount?.toFixed(2)}
                                </div>
                              </div>
                            )}

                            {message.message_type === 'milestone_completed' && (
                              <div className="space-y-1">
                                <Badge variant="default">Milestone Completed</Badge>
                                <div className="text-sm">
                                  A milestone has been marked as completed and payment has been processed.
                                </div>
                              </div>
                            )}

                            <span className={`block text-[10px] mt-2 ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Milestones Section */}
                {acceptedMilestoneOrderId && milestones.length > 0 && (
                  <div className="flex-shrink-0 p-4 border-t bg-gray-50">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-sm">Order Milestones</h3>
                      <Badge variant="outline">{milestones.length} milestone(s)</Badge>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{milestone.title}</div>
                            <div className="text-xs text-gray-600">£{milestone.amount} • Due: {new Date(milestone.due_date).toLocaleDateString()}</div>
                            <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {milestone.status}
                            </Badge>
                          </div>
                          {currentUserRole === 'provider' && milestone.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeMilestone(milestone.id)}
                              className="ml-2"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input with Attachments and Start Order */}
                <div className="flex-shrink-0 p-4 border-t bg-white space-y-3">
                  {/* Image Previews */}
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {attachments.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={url} alt={`preview-${idx}`} className="w-20 h-20 object-cover rounded-lg border" />
                          <button
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                            onClick={() => {
                              setAttachments(prev => {
                                const next = prev.filter((_, i) => i !== idx);
                                try { localStorage.setItem(`chat_attachments_${activeChat}`, JSON.stringify(next)); } catch {}
                                return next;
                              });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const max = 5 * 1024 * 1024; // 5MB
                          if (file.size > max) {
                            alert('Image should be less than 5MB');
                            (e.target as HTMLInputElement).value = '';
                            return;
                          }
                          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
                          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
                          if (!cloudName || !uploadPreset) {
                            alert('Missing Cloudinary configuration');
                            return;
                          }
                          const form = new FormData();
                          form.append('file', file);
                          form.append('upload_preset', uploadPreset);
                          try {
                            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method: 'POST', body: form });
                            const json = await res.json();
                            if (json.secure_url) {
                            // Directly send image as a message (no need to press Send)
                            if (!user?.id || !activeChat) {
                              alert('Select a conversation first');
                            } else {
                              const url = json.secure_url as string;
                              const messageData: any = {
                                sender_id: user.id,
                                receiver_id: activeChat,
                                content: '',
                                attachments: [url],
                                message_type: 'text',
                              };
                              const optimistic: Message = {
                                id: `optimistic_${Date.now()}`,
                                ...messageData,
                                created_at: new Date().toISOString(),
                              };
                              setMessages(prev => [...prev, optimistic]);
                              try {
                                const { data, error } = await (supabase.from('messages') as any)
                                  .insert(messageData)
                                  .select()
                                  .single();
                                if (error) throw error;
                                if (data) {
                                  const inserted = data as Message;
                                  setMessages(prev => prev.map(m => m.id === optimistic.id ? inserted : m));
                                }
                              } catch (errSend) {
                                console.error('Failed to send image message', errSend);
                                setMessages(prev => prev.filter(m => m.id !== optimistic.id));
                                alert('Failed to send image');
                              }
                            }
                          } else {
                              alert('Upload failed');
                            }
                          } catch (err) {
                            console.error('Cloudinary upload failed', err);
                            alert('Upload failed');
                          } finally {
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
                      {currentUserRole === 'provider' && acceptedMilestoneOrderId && (
                        <CreateMilestonesDialog
                          milestoneOrderId={acceptedMilestoneOrderId}
                          trigger={<Button variant="outline" size="sm">Manage Milestones</Button>}
                        />
                      )}
                      {currentUserRole === 'provider' && (
                        <Dialog open={showStartMilestoneDialog} onOpenChange={setShowStartMilestoneDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Start Milestone Order</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Start Milestone Order</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Order Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label>Title</Label>
                                  <Input value={milestoneOrderTitle} onChange={e => setMilestoneOrderTitle(e.target.value)} placeholder="e.g. Website Development Project" />
                                </div>
                                <div>
                                  <Label>Total Amount (£)</Label>
                                  <Input type="number" min={1} value={milestoneOrderTotalAmount} onChange={e => setMilestoneOrderTotalAmount(Number(e.target.value))} />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label>Requirements (optional)</Label>
                                <Textarea rows={3} value={milestoneOrderRequirements} onChange={e => setMilestoneOrderRequirements(e.target.value)} placeholder="Describe the project requirements" />
                              </div>

                              {/* Milestones Section */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-base font-medium">Milestones</Label>
                                  <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Milestone
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  {milestonesOrder.map((milestone, index) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Milestone {index + 1}</h4>
                                        {milestonesOrder.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeMilestone(index)}
                                          >
                                            Remove
                                          </Button>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label htmlFor={`milestone-title-${index}`}>Title</Label>
                                          <Input
                                            id={`milestone-title-${index}`}
                                            value={milestone.title}
                                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                            placeholder="e.g., Initial Assessment"
                                          />
                                        </div>

                                        <div>
                                          <Label htmlFor={`milestone-amount-${index}`}>Amount (£)</Label>
                                          <Input
                                            id={`milestone-amount-${index}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={milestone.amount}
                                            onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                                            placeholder="0.00"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <Label htmlFor={`milestone-description-${index}`}>Description</Label>
                                        <Textarea
                                          id={`milestone-description-${index}`}
                                          value={milestone.description}
                                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                                          placeholder="Describe what will be delivered in this milestone..."
                                          rows={2}
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor={`milestone-due-date-${index}`}>Due Date</Label>
                                        <Input
                                          id={`milestone-due-date-${index}`}
                                          type="date"
                                          value={milestone.due_date}
                                          onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                                          min={new Date().toISOString().split('T')[0]}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Total validation */}
                                {milestonesOrder.filter(m => m.amount).length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    Total milestone amounts: £{milestonesOrder.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)} / £{milestoneOrderTotalAmount}
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowStartMilestoneDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={sendMilestoneOrderStart} disabled={!milestoneOrderTitle.trim() || milestoneOrderTotalAmount <= 0}>
                                  Send Proposal
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {currentUserRole === 'provider' && (
                        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Start Order</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Start an Order</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                            <div className="space-y-1">
                              <Label>Title</Label>
                              <Input value={orderTitle} onChange={e => setOrderTitle(e.target.value)} placeholder="e.g. CQC Registration Support" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Price (£)</Label>
                                <Input type="number" min={1} value={orderPrice} onChange={e => setOrderPrice(Number(e.target.value))} />
                              </div>
                              <div>
                                <Label>Delivery (days)</Label>
                                <Input type="number" min={1} value={orderDeliveryDays} onChange={e => setOrderDeliveryDays(Number(e.target.value))} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label>Requirements (optional)</Label>
                              <Textarea rows={4} value={orderRequirements} onChange={e => setOrderRequirements(e.target.value)} placeholder="Any notes or requirements" />
                            </div>
                            <div className="flex justify-end">
                              <Button onClick={sendOrderStart} disabled={!orderTitle.trim() || orderPrice <= 0 || orderDeliveryDays <= 0}>Send Proposal</Button>
                            </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${getDisplayName()}...`}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="flex-1 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="mb-2">Select a conversation to start messaging</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose a conversation from the list to view messages
                  </p>
                  {conversations.length === 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-md">
                      <p className="font-medium mb-1">No conversations available</p>
                      <p>Visit the dashboard to browse services and contact sellers to start conversations.</p>
                    </div>
                  )}
                  <button onClick={() => setShowChatList(true)} className="md:hidden mt-4 text-blue-500 hover:text-blue-600">
                    View conversations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
