import { useMemo, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardLayout } from '../components/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Plus, Target } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { CreateOfferDialog } from '../components/CreateOfferDialog';
import { CreateMilestonesDialog } from '../components/CreateMilestonesDialog';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  role: 'buyer' | 'seller';
}

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

const chats: ChatItem[] = [];
// Database queries will populate this array; currently empty

const conversation: Record<string, Message[]> = {};
// Database queries will populate this object; currently empty

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState<string>('c2');
  const [input, setInput] = useState('');
  const { user } = useAuth();

  const activeMsgs = useMemo(() => conversation[activeChat] ?? [], [activeChat]);

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="seller" className="w-full">
              <TabsList>
                <TabsTrigger value="seller">Seller</TabsTrigger>
                <TabsTrigger value="buyer">Buyer</TabsTrigger>
              </TabsList>

              <TabsContent value="seller">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden">
                    <div className="p-3 border-b font-medium">Chats</div>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {chats.filter(c => c.role === 'seller').map(c => (
                        <div key={c.id} onClick={() => setActiveChat(c.id)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent ${activeChat===c.id?'bg-accent/60':''}`}>
                          <Avatar className="h-9 w-9"><img src={c.avatar} alt={c.name} /></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <span className="text-xs text-muted-foreground">{c.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 border rounded-lg flex flex-col h-[70vh]">
                    <div className="p-3 border-b font-medium">Conversation</div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-background">
                      {activeMsgs.map(m => (
                        <div key={m.id} className={`flex ${m.sender==='me' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender==='me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p>{m.text}</p>
                            <span className="block text-[10px] opacity-70 mt-1">{m.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t">
                      {/* Action buttons for sellers */}
                      {user?.role === 'provider' && (
                        <div className="flex gap-2 mb-3">
                          <CreateOfferDialog
                            projectId={activeChat} // Using activeChat as project ID for now
                            buyerId="buyer-id" // This should be dynamically determined
                            trigger={
                              <Button variant="outline" size="sm" className="flex-1">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Offer
                              </Button>
                            }
                          />
                          <CreateMilestonesDialog
                            offerId="offer-id" // This should be dynamically determined
                            trigger={
                              <Button variant="outline" size="sm" className="flex-1">
                                <Target className="h-4 w-4 mr-2" />
                                Create Milestones
                              </Button>
                            }
                          />
                        </div>
                      )}
                      {/* Message input */}
                      <div className="flex gap-2">
                        <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..." />
                        <Button onClick={()=>setInput('')}><Send className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="buyer">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden">
                    <div className="p-3 border-b font-medium">Chats</div>
                    <div className="max-h=[60vh] overflow-y-auto">
                      {chats.filter(c => c.role === 'buyer').map(c => (
                        <div key={c.id} onClick={() => setActiveChat(c.id)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent ${activeChat===c.id?'bg-accent/60':''}`}>
                          <Avatar className="h-9 w-9"><img src={c.avatar} alt={c.name} /></Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <span className="text-xs text-muted-foreground">{c.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 border rounded-lg flex flex-col h-[70vh]">
                    <div className="p-3 border-b font-medium">Conversation</div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-background">
                      {activeMsgs.map(m => (
                        <div key={m.id} className={`flex ${m.sender==='me' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender==='me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p>{m.text}</p>
                            <span className="block text-[10px] opacity-70 mt-1">{m.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t flex gap-2">
                      <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type a message..." />
                      <Button onClick={()=>setInput('')}><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  );
}
