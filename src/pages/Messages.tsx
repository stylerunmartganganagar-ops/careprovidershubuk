import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MessageSquare, Send, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface MessageInsert {
  sender_id: string;
  receiver_id: string;
  content: string;
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
  const [recentlySentMessages, setRecentlySentMessages] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { user } = useAuth();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const chatWith = searchParams.get('with');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations and set up real-time
  useEffect(() => {
    if (user?.id) {
      loadConversations();
      setupRealtime();
    }
  }, [user?.id]);

  // Prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Auto-select chat from URL
  useEffect(() => {
    if (conversations.length > 0 && !activeChat) {
      if (chatWith) {
        selectChat(chatWith);
      } else if (conversations.length === 1) {
        selectChat(conversations[0].partner.id);
      }
    }
  }, [chatWith, conversations, activeChat]);

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

  // Auto-scroll for new messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender_id !== user?.id &&
        Date.now() - new Date(lastMessage.created_at).getTime() < 5000) {
      scrollToBottom();
    }
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
          id, sender_id, receiver_id, content, created_at,
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
          created_at: msg.created_at
        });
      });

      const conversationList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

      console.log('Created conversations:', conversationList.length);
      setConversations(conversationList);

    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
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
    } else {
      // Load messages for new conversation
      const { data: chatMessages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      const messagesToShow = chatMessages || [];
      setMessages(messagesToShow);
      setPartnerInfo({
        id: partnerId,
        name: 'Unknown User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        role: 'user'
      });
    }

    setActiveChat(partnerId);
    setShowChatList(false);
  };

  const handleNewMessage = (newMessage: Message) => {
    if (recentlySentMessages.has(newMessage.id)) return;

    if (messages.some(msg => msg.id === newMessage.id)) return;

    // Add to active chat
    if ((newMessage.sender_id === user?.id && newMessage.receiver_id === activeChat) ||
        (newMessage.sender_id === activeChat && newMessage.receiver_id === user?.id)) {
      setMessages(prev => [...prev, newMessage]);
    }

    // Update conversation cache
    setConversations(prev => prev.map(conv => {
      const isRelevant = conv.partner.id === newMessage.sender_id || conv.partner.id === newMessage.receiver_id;
      if (!isRelevant) return conv;

      const shouldMarkNew = newMessage.sender_id !== user?.id && conv.partner.id !== activeChat;

      return {
        ...conv,
        messages: [...conv.messages, newMessage],
        lastActivity: newMessage.created_at,
        hasNewMessage: shouldMarkNew || conv.hasNewMessage,
        partner: {
          ...conv.partner,
          lastMessage: newMessage.content,
          lastMessageTime: newMessage.created_at
        }
      };
    }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()));
  };

  const sendMessage = async () => {
    if (!input.trim() || !user?.id || !activeChat) return;

    const messageData: MessageInsert = {
      sender_id: user.id,
      receiver_id: activeChat,
      content: input.trim()
    };
    setInput('');

    // Create optimistic message outside try block
    const optimisticMessage: Message = {
      id: `optimistic_${Date.now()}`,
      ...messageData,
      created_at: new Date().toISOString()
    };

    try {
      setMessages(prev => [...prev, optimisticMessage]);

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData as any)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const insertedMessage = data as Message;
        setRecentlySentMessages(prev => new Set(prev).add(insertedMessage.id));
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

        setTimeout(() => {
          setRecentlySentMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(insertedMessage.id);
            return newSet;
          });
        }, 5000);
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current!.scrollTop = messagesContainerRef.current!.scrollHeight;
      }, 100);
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

      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6 overflow-hidden h-[calc(100vh-120px)]">
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
                <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 overflow-y-auto bg-gray-50 max-h-[400px]">
                  {/* Debug Info */}
                  <div className="mb-4 p-3 bg-gray-50 border rounded-lg text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Conversations:</strong> {conversations.length}</div>
                      <div><strong>Active Chat:</strong> {activeChat || 'None'}</div>
                      <div><strong>Messages:</strong> {messages.length}</div>
                      <div><strong>Connection:</strong> {connectionStatus}</div>
                    </div>
                    {conversations.length === 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                        No conversations found. Visit dashboard to browse services and contact sellers.
                      </div>
                    )}
                  </div>

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
                          <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${
                            message.sender_id === user?.id ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-900 rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <span className={`block text-[10px] mt-1 ${
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

                {/* Message Input */}
                <div className="flex-shrink-0 p-4 border-t bg-white">
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
