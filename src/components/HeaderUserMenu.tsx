import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Bell,
  MessageSquare,
  BookOpen,
  Heart,
  User,
  Package,
  DollarSign,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';

import { MessageDrawer } from './MessageDrawer';
import { NotificationDrawer } from './NotificationDrawer';
import { HelpDrawer } from './HelpDrawer';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';

export function HeaderUserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const { unreadCount: unreadNotificationsCount, refetch: refetchNotifications } = useNotifications();
  
  const hasInitializedRef = useRef(false);
  const prevMessagesOpenRef = useRef(messagesOpen);
  const prevNotificationsOpenRef = useRef(notificationsOpen);
  // delay dropdown mount to avoid mount-time loops
  const [menuMountReady, setMenuMountReady] = useState(false);
  // keep stable references to callback functions to avoid effect retriggers on identity change
  const refetchNotificationsRef = useRef(refetchNotifications);
  const fetchUnreadMessagesRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchUnreadMessages = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessagesCount(0);
      return;
    }

    try {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      setUnreadMessagesCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      setUnreadMessagesCount(0);
    }
  }, [user?.id]);

  // Keep latest function refs synced
  useEffect(() => {
    refetchNotificationsRef.current = refetchNotifications;
  }, [refetchNotifications]);
  useEffect(() => {
    fetchUnreadMessagesRef.current = fetchUnreadMessages;
  }, [fetchUnreadMessages]);

  useEffect(() => {
    // allow dropdown to mount after first paint
    setMenuMountReady(true);
  }, []);

  // Initial load only
  useEffect(() => {
    if (!hasInitializedRef.current && user?.id) {
      hasInitializedRef.current = true;
      fetchUnreadMessagesRef.current();
    }
  }, [user?.id]);

  // Refetch when drawers close
  useEffect(() => {
    if (prevMessagesOpenRef.current && !messagesOpen) {
      fetchUnreadMessagesRef.current();
    }
    prevMessagesOpenRef.current = messagesOpen;
  }, [messagesOpen]);

  useEffect(() => {
    if (prevNotificationsOpenRef.current && !notificationsOpen) {
      refetchNotificationsRef.current?.();
    }
    prevNotificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  const isSeller = useMemo(() => user?.role === 'provider', [user?.role]);
  const isBuyer = useMemo(() => user?.role === 'client', [user?.role]);

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="relative" onClick={() => setNotificationsOpen(true)}>
          <Bell className="h-5 w-5" />
          {unreadNotificationsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setMessagesOpen(true)}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadMessagesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)}>
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate('/favorites')}>
          <Heart className="h-5 w-5" />
        </Button>

        {/* Temporary replacement for DropdownMenu to isolate render loop */}
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          onClick={() => navigate('/user-profile')}
          title={user?.email || 'Profile'}
        >
          <Avatar className="h-8 w-8">
            <img src={user?.avatar} alt={user?.name} />
          </Avatar>
        </Button>
      </div>
      <MessageDrawer open={messagesOpen} onOpenChange={setMessagesOpen} />
      <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
