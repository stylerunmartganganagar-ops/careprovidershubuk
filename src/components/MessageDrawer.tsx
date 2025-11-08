import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';

interface Conversation {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
}

const recentConversations: Conversation[] = [];

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  return date.toLocaleDateString();
}

export function MessageDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>(recentConversations);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !open) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            created_at,
            sender:users!messages_sender_id_fkey (id, name, username, avatar),
            receiver:users!messages_receiver_id_fkey (id, name, username, avatar)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) throw error;

        const conversationMap = new Map<string, Conversation>();

        data?.forEach((message: any) => {
          const isSender = message.sender_id === user.id;
          const partner = isSender ? message.receiver : message.sender;
          if (!partner?.id) return;

          const partnerId = partner.id;
          const existing = conversationMap.get(partnerId);
          if (!existing || new Date(message.created_at) > new Date(existing.lastMessageTime)) {
            conversationMap.set(partnerId, {
              id: partnerId,
              partnerId,
              partnerName: partner.name || partner.username || 'Unknown user',
              partnerAvatar: partner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
              lastMessage: message.content,
              lastMessageTime: message.created_at,
              unreadCount: 0 // We'll calculate this separately
            });
          }
        });

        const conversationsList = Array.from(conversationMap.values())
          .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
          .slice(0, 5); // Show only 5 most recent

        // Calculate unread counts
        for (const conv of conversationsList) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', conv.partnerId)
            .eq('receiver_id', user.id)
            .eq('read', false);

          conv.unreadCount = count || 0;
        }

        setConversations(conversationsList);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user?.id, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Recent Messages</SheetTitle>
        </SheetHeader>
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start chatting with service providers!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <Link key={c.id} to={`/messages?chatWith=${c.partnerId}`} onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <img src={c.partnerAvatar} alt={c.partnerName} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{c.partnerName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(c.lastMessageTime))}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                    </div>
                    {c.unreadCount && c.unreadCount > 0 && (
                      <Badge className="bg-green-500 text-white">{c.unreadCount}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="p-3 border-t mt-2">
            <Link to="/messages" onClick={() => onOpenChange(false)}>
              <Button className="w-full">View all messages</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
