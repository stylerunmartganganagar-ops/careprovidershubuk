import { DashboardHeader } from '../components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead } = useNotifications();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="order">Orders ({notifications.filter(n => n.type === 'order').length})</TabsTrigger>
                <TabsTrigger value="message">Messages ({notifications.filter(n => n.type === 'message').length})</TabsTrigger>
                <TabsTrigger value="system">System ({notifications.filter(n => n.type === 'system').length})</TabsTrigger>
                <TabsTrigger value="review">Reviews ({notifications.filter(n => n.type === 'review').length})</TabsTrigger>
              </TabsList>

              {['all','order','message','system','review'].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="space-y-2">
                    {notifications
                      .filter(n => tab==='all' ? true : n.type === tab)
                      .map(n => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            n.unread ? 'hover:bg-blue-50 bg-blue-50/50 border-blue-200' : 'hover:bg-accent'
                          }`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{n.title}</p>
                            <span className="text-xs text-muted-foreground">{n.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{n.description}</p>
                          {n.unread ? <Badge className="mt-2 bg-blue-600 text-white">New</Badge> : null}
                        </div>
                      ))}
                    {notifications.filter(n => tab==='all' ? true : n.type === tab).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No {tab === 'all' ? '' : tab} notifications</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
