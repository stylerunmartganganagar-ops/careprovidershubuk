import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </SheetTitle>
        </SheetHeader>
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We'll notify you of important updates!</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      n.unread ? 'hover:bg-blue-50 bg-blue-50/50' : 'hover:bg-accent'
                    }`}
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.description}</p>
                    {n.unread && <Badge className="mt-2 bg-blue-600 text-white">New</Badge>}
                  </div>
                ))}
              </div>
              {notifications.some(n => n.unread) && (
                <div className="p-3 border-t mt-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
            </>
          )}
          <div className="p-3 border-t mt-2">
            <Link to="/notifications" onClick={() => onOpenChange(false)}>
              <Button className="w-full">View all notifications</Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
