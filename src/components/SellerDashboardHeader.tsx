import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { useSearch } from '../contexts/SearchContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
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
  Menu,
  Search,
  MapPin,
  Plus,
  TrendingUp,
  Star
} from 'lucide-react';

import { MessageDrawer } from './MessageDrawer';
import { NotificationDrawer } from './NotificationDrawer';
import { HelpDrawer } from './HelpDrawer';
import { HeaderLogo } from './HeaderLogo';
import { HeaderSearchBar } from './HeaderSearchBar';
import { HeaderActionButtons } from './HeaderActionButtons';
import { HeaderUserMenu } from './HeaderUserMenu';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';

export function SellerDashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    searchQuery,
    setSearchQuery,
    location,
    setLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    performSearch
  } = useSearch();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const { unreadCount: unreadNotificationsCount, refetch: refetchNotifications } = useNotifications();

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

  useEffect(() => {
    fetchUnreadMessages();
  }, [fetchUnreadMessages]);

  useEffect(() => {
    if (!messagesOpen) {
      fetchUnreadMessages();
    }
  }, [messagesOpen, fetchUnreadMessages]);

  useEffect(() => {
    if (!notificationsOpen) {
      refetchNotifications();
    }
  }, [notificationsOpen, refetchNotifications]);

  const isSeller = user?.role === 'provider';
  const isBuyer = user?.role === 'client';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          {/* Main Header - Hidden on mobile */}
          <div className="hidden md:flex h-16 items-center justify-between">
            {/* Left - Logo */}
            <HeaderLogo />

            {/* Center - Search */}
            <HeaderSearchBar />

            {/* Right - User Menu */}
            <HeaderUserMenu />
          </div>

          {/* Mobile Header - Simple version */}
          <div className="md:hidden h-16 flex items-center justify-between">
            <div className="flex items-center flex-1">
              <HeaderLogo />
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessagesCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 items-center justify-center text-[10px] bg-red-500 text-white">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/create-service')}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <img src={user?.avatar} alt={user?.name} />
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {isSeller ? 'Seller' : 'Buyer'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Premium Member
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/user-profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {isBuyer && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/payment-history')}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Payment History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/saved-services')}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Saved Services
                      </DropdownMenuItem>
                    </>
                  )}
                  {isSeller && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/seller/manage-orders')}>
                        <Package className="mr-2 h-4 w-4" />
                        Orders Received
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/seller/earnings')}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Earnings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/seller/payment-methods')}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payment Methods
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/favorites')}>
                        <Heart className="mr-2 h-4 w-4" />
                        Saved Projects
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/payment-methods')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Methods
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <MessageDrawer open={messagesOpen} onOpenChange={setMessagesOpen} />
      <NotificationDrawer open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
