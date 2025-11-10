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
  TrendingUp,
  Crown,
  Coins,
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              title={user?.email || 'Profile'}
            >
              <Avatar className="h-8 w-8">
                <img src={user?.avatar} alt={user?.name} />
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end">
            <DropdownMenuLabel>
              <div className="font-semibold">{user?.name || 'Account'}</div>
              <div className="text-xs text-muted-foreground">
                {user?.role || 'user'}, Premium
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate('/user-profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Overview</span>
            </DropdownMenuItem>

            {isBuyer && (
              <>
                <DropdownMenuItem onClick={() => navigate('/plans')}>
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Buyer Pro Plan</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Orders</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/payment-methods')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Payment Methods</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/payment-history')}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Billing History</span>
                </DropdownMenuItem>
              </>
            )}

            {isSeller && (
              <>
                <DropdownMenuItem onClick={() => user?.id && navigate(`/home/sellers/${user.id}`)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Seller Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/seller/tokens')}>
                  <Coins className="mr-2 h-4 w-4" />
                  <span>Buy Tokens</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/seller/wallet')}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>Token Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/seller/services')}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Manage Services</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/seller/payment-methods')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Seller Payment Methods</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem onClick={() => navigate('/account-settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <MessageDrawer open={messagesOpen} onOpenChange={setMessagesOpen} />
      <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
