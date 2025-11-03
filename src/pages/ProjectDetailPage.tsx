import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Send,
  User
} from 'lucide-react';
import { useProjectDetail, useProjectBids, useProjectMessages, useUpdateBidStatus, useSendMessage } from '../hooks/useProjects';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bids');
  const [messageContent, setMessageContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);

  // Dialog states
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const { project, loading: projectLoading, error: projectError } = useProjectDetail(id);
  const { bids, loading: bidsLoading } = useProjectBids(id);
  const { messages, loading: messagesLoading } = useProjectMessages(id);
  const { updateBidStatus, loading: updateLoading } = useUpdateBidStatus();
  const { sendMessage, loading: sendLoading } = useSendMessage();

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading project...</div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (projectError || !project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-red-600">
            {projectError || 'Project not found'}
          </div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  // Check if user is the project owner
  const isOwner = project.user_id === user?.id;

  const handleAcceptBid = async (bidId: string) => {
    // ... (rest of the handler)
  };

  const handleRejectBid = async (bidId: string) => {
    // ... (rest of the handler)
  };

  const handleMessageBidder = (bidderId: string) => {
    // ... (rest of the handler)
  };

  const handleSendMessage = async () => {
    // ... (rest of the handler)
  };

  const handleBroadcastMessage = async () => {
    // ... (rest of the handler)
  };

  const handleInviteSellers = async () => {
    // ... (rest of the handler)
  };

  const handleExtendDeadline = async () => {
    // ... (rest of the handler)
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* ... (rest of the JSX) */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge
                  variant={project.status === 'open' ? 'default' : 'secondary'}
                >
                  {project.status}
                </Badge>
                <Badge variant="outline">{project.category}</Badge>
                <Badge
                  variant={
                    project.urgency === 'high' ? 'destructive' :
                    project.urgency === 'medium' ? 'default' : 'secondary'
                  }
                >
                  {project.urgency} priority
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Project Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{project.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Budget: £{project.budget} ({project.budget_type})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      Deadline: {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Location: {project.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      Posted: {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {project.skills && project.skills.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.requirements && (
                  <div>
                    <h4 className="font-semibold mb-2">Additional Requirements</h4>
                    <p className="text-gray-700 text-sm">{project.requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bids and Messages Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bids">Bids ({bids.length})</TabsTrigger>
                    <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bids" className="space-y-4">
                    {bidsLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading bids...</div>
                    ) : bids.length > 0 ? (
                      <div className="space-y-4">
                        {bids.map((bid) => (
                          <Card key={bid.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <Avatar className="h-10 w-10">
                                  <img src={bid.seller?.avatar} alt={bid.seller?.name} />
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-semibold">{bid.seller?.name}</h4>
                                    {bid.seller?.is_verified && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{bid.seller?.rating?.toFixed(1) || '0.0'}</span>
                                      <span>({bid.seller?.review_count || 0})</span>
                                    </div>
                                    {bid.seller?.location && (
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{bid.seller?.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="outline" className="text-green-600">
                                      £{bid.bid_amount}
                                    </Badge>
                                    <Badge
                                      variant={
                                        bid.status === 'accepted' ? 'default' :
                                        bid.status === 'rejected' ? 'destructive' : 'secondary'
                                      }
                                    >
                                      {bid.status}
                                    </Badge>
                                  </div>
                                  {bid.message && (
                                    <p className="text-gray-700 text-sm">{bid.message}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(bid.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            {isOwner && bid.status === 'pending' && (
                              <div className="flex space-x-2 mt-4">
                                <Button size="sm" variant="outline" onClick={() => handleAcceptBid(bid.id)}>
                                  Accept Bid
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectBid(bid.id)}>
                                  Reject Bid
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleMessageBidder(bid.seller_id)}>
                                  Message
                                </Button>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No bids received yet
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="messages" className="space-y-4">
                    {messagesLoading ? (
                      <div className="text-center py-8 text-gray-500">Loading messages...</div>
                    ) : messages.length > 0 ? (
                      <>
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    message.sender_id === user?.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                      <img src={message.sender?.avatar} alt={message.sender?.name} />
                                    </Avatar>
                                    <span className="text-xs font-semibold">{message.sender?.name}</span>
                                  </div>
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs opacity-70 mt-1">
                                    {new Date(message.sent_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="flex space-x-2">
                          <Textarea
                            placeholder="Type your message..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No messages yet
                        <div className="flex space-x-2 mt-4 max-w-md mx-auto">
                          <Textarea
                            placeholder="Start the conversation..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Bids</span>
                  <span className="font-semibold">{bids.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages</span>
                  <span className="font-semibold">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days Left</span>
                  <span className="font-semibold">
                    {Math.max(0, Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setBroadcastDialogOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Broadcast Message
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setInviteDialogOpen(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Invite Specific Sellers
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setExtendDialogOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Extend Deadline
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />

      {/* Broadcast Message Dialog */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Broadcast Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your broadcast message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBroadcastMessage}>
                Send Broadcast
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Sellers Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Specific Sellers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Select sellers to invite to this project.</p>
            {/* Placeholder: Add seller selection UI */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteSellers}>
                Send Invites
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExtendDeadline}>
                Extend Deadline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
