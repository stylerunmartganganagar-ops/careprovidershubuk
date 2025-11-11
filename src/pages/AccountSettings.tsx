import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  ArrowLeft,
  Shield,
  Bell,
  Eye,
  Lock,
  Mail,
  Smartphone,
  Globe,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setSubscriptionLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('buyer_subscriptions')
          .select(`
            id,
            status,
            created_at,
            plans (
              name,
              price,
              interval
            )
          `)
          .eq('buyer_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error fetching subscription:', error);
        } else {
          setSubscription(data);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  const [notifications, setNotifications] = useState({
    email: {
      orderUpdates: true,
      messages: true,
      marketing: false,
      security: true
    },
    push: {
      orderUpdates: true,
      messages: true,
      reminders: false
    }
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    dataSharing: false
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  const handleSaveNotifications = () => {
    // Save notification settings
    console.log('Saving notification settings:', notifications);
  };

  const handleSavePrivacy = () => {
    // Save privacy settings
    console.log('Saving privacy settings:', privacy);
  };

  const handleChangePassword = () => {
    // Change password logic
    console.log('Changing password');
  };

  const handleToggleTwoFactor = () => {
    // Toggle 2FA
    setSecurity({...security, twoFactorEnabled: !security.twoFactorEnabled});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences, privacy settings, and security options.
            </p>
          </div>
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="order-updates">Order Updates</Label>
                      <p className="text-sm text-gray-600">Get notified about order status changes</p>
                    </div>
                    <Switch
                      id="order-updates"
                      checked={notifications.email.orderUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email: {...notifications.email, orderUpdates: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="messages">Messages</Label>
                      <p className="text-sm text-gray-600">Receive notifications for new messages</p>
                    </div>
                    <Switch
                      id="messages"
                      checked={notifications.email.messages}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email: {...notifications.email, messages: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing">Marketing</Label>
                      <p className="text-sm text-gray-600">Receive promotional emails and updates</p>
                    </div>
                    <Switch
                      id="marketing"
                      checked={notifications.email.marketing}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email: {...notifications.email, marketing: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="security">Security Alerts</Label>
                      <p className="text-sm text-gray-600">Important security notifications</p>
                    </div>
                    <Switch
                      id="security"
                      checked={notifications.email.security}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          email: {...notifications.email, security: checked}
                        })
                      }
                    />
                  </div>

                  <Button onClick={handleSaveNotifications} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="h-5 w-5 mr-2" />
                    Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-order-updates">Order Updates</Label>
                      <p className="text-sm text-gray-600">Push notifications for order changes</p>
                    </div>
                    <Switch
                      id="push-order-updates"
                      checked={notifications.push.orderUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push: {...notifications.push, orderUpdates: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-messages">Messages</Label>
                      <p className="text-sm text-gray-600">Push notifications for new messages</p>
                    </div>
                    <Switch
                      id="push-messages"
                      checked={notifications.push.messages}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push: {...notifications.push, messages: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-reminders">Reminders</Label>
                      <p className="text-sm text-gray-600">Deadline and task reminders</p>
                    </div>
                    <Switch
                      id="push-reminders"
                      checked={notifications.push.reminders}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          push: {...notifications.push, reminders: checked}
                        })
                      }
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Push notifications require browser permission. Make sure to allow notifications when prompted.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleSaveNotifications} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Push Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Profile Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="public"
                        name="profile-visibility"
                        value="public"
                        checked={privacy.profileVisibility === 'public'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                      />
                      <Label htmlFor="public">Public</Label>
                      <span className="text-sm text-gray-600">Anyone can see your profile</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="private"
                        name="profile-visibility"
                        value="private"
                        checked={privacy.profileVisibility === 'private'}
                        onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                      />
                      <Label htmlFor="private">Private</Label>
                      <span className="text-sm text-gray-600">Only verified providers can see your profile</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <Label htmlFor="show-email">Show Email</Label>
                      <p className="text-sm text-gray-600">Display your email on your profile</p>
                    </div>
                    <Switch
                      id="show-email"
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy({...privacy, showEmail: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">Show Phone</Label>
                      <p className="text-sm text-gray-600">Display your phone number on your profile</p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacy.showPhone}
                      onCheckedChange={(checked) => setPrivacy({...privacy, showPhone: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">Allow Messages</Label>
                      <p className="text-sm text-gray-600">Let providers contact you directly</p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={privacy.allowMessages}
                      onCheckedChange={(checked) => setPrivacy({...privacy, allowMessages: checked})}
                    />
                  </div>

                  <Button onClick={handleSavePrivacy} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Data & Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-sharing">Data Sharing</Label>
                      <p className="text-sm text-gray-600">Share anonymized data to improve our services</p>
                    </div>
                    <Switch
                      id="data-sharing"
                      checked={privacy.dataSharing}
                      onCheckedChange={(checked) => setPrivacy({...privacy, dataSharing: checked})}
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Data Export</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a copy of all your data from our platform.
                    </p>
                    <Button variant="outline" className="w-full">
                      Request Data Export
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <Button variant="destructive" className="w-full">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                    />
                  </div>

                  <Button onClick={handleChangePassword} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Two-Factor Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={handleToggleTwoFactor}
                    />
                  </div>

                  {!security.twoFactorEnabled ? (
                    <div>
                      <Button className="w-full" onClick={handleToggleTwoFactor}>
                        Enable 2FA
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        We'll guide you through setting up 2FA with your authenticator app.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">2FA is enabled</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Your account is protected with two-factor authentication.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Active Sessions</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">Current Session</p>
                          <p className="text-xs text-gray-600">Web Browser • {new Date().toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      View All Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Account Type</Label>
                    <p className="text-sm text-gray-600 mt-1 capitalize">{user?.role || 'User'}</p>
                  </div>

                  <div>
                    <Label>Username</Label>
                    <p className="text-sm text-gray-600 mt-1">@{user?.username}</p>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                  </div>

                  <div>
                    <Label>Account Status</Label>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>

                  {user?.phone && (
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm text-gray-600 mt-1">{user.phone}</p>
                    </div>
                  )}

                  {user?.location && (
                    <div>
                      <Label>Location</Label>
                      <p className="text-sm text-gray-600 mt-1">{user.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriptionLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading subscription...</p>
                    </div>
                  ) : subscription ? (
                    <>
                      <div>
                        <Label>Current Plan</Label>
                        <p className="text-sm text-gray-600 mt-1">{subscription.plans?.name || 'Pro Plan'}</p>
                      </div>

                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center mt-1">
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>

                      <div>
                        <Label>Member Since</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(subscription.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          })}
                        </p>
                      </div>

                      {subscription.plans?.price && (
                        <div>
                          <Label>Monthly Cost</Label>
                          <p className="text-sm text-gray-600 mt-1">£{subscription.plans.price}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">
                          Manage Subscription
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Current Plan</Label>
                        <p className="text-sm text-gray-600 mt-1">Free Plan</p>
                      </div>

                      <div>
                        <Label>Status</Label>
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary">Free</Badge>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1" onClick={() => navigate('/plans')}>
                          Upgrade to Pro
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
