import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Target, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth.tsx';
import { toast } from 'sonner';

interface CreateMilestonesDialogProps {
  milestoneOrderId: string;
  trigger: React.ReactNode;
  onMilestonesCreated?: () => void;
}

interface Milestone {
  id?: string; // Optional ID for existing milestones
  title: string;
  description: string;
  amount: string;
  due_date: string;
}

export function CreateMilestonesDialog({ milestoneOrderId, trigger, onMilestonesCreated }: CreateMilestonesDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', amount: '', due_date: '' }
  ]);
  const [error, setError] = useState('');

  // Load existing milestones when dialog opens
  const loadExistingMilestones = async () => {
    if (!milestoneOrderId || !open) return;

    setLoadingExisting(true);
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('milestone_order_id', milestoneOrderId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert existing milestones to the format expected by the form
        const existingMilestones = data.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          amount: m.amount.toString(),
          due_date: m.due_date ? new Date(m.due_date).toISOString().split('T')[0] : ''
        }));
        setMilestones(existingMilestones);
      } else {
        // No existing milestones, start with one empty form
        setMilestones([{ title: '', description: '', amount: '', due_date: '' }]);
      }
    } catch (err) {
      console.error('Failed to load existing milestones', err);
      setMilestones([{ title: '', description: '', amount: '', due_date: '' }]);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Load milestones when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingMilestones();
    }
  }, [open, milestoneOrderId]);

  const addMilestone = () => {
    setMilestones(prev => [...prev, { title: '', description: '', amount: '', due_date: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    setMilestones(prev => prev.map((milestone, i) =>
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate milestones
      for (const milestone of milestones) {
        if (!milestone.title || !milestone.description || !milestone.amount || !milestone.due_date) {
          throw new Error('Please fill in all milestone fields');
        }

        const amount = parseFloat(milestone.amount);
        if (isNaN(amount) || amount <= 0) {
          throw new Error('Please enter valid amounts for all milestones');
        }

        const dueDate = new Date(milestone.due_date);
        if (dueDate <= new Date()) {
          throw new Error('Due dates must be in the future');
        }
      }

      // Get milestone order details to verify ownership and get buyer info
      const { data: milestoneOrder, error: orderError } = await supabase
        .from('milestone_orders')
        .select('provider_id, buyer_id')
        .eq('id', milestoneOrderId)
        .single();

      if (orderError) throw orderError;

      if (milestoneOrder.provider_id !== user?.id) {
        throw new Error('You can only create milestones for your own milestone orders');
      }

      // Separate new and existing milestones
      const newMilestones = milestones.filter(m => !m.id);
      const existingMilestones = milestones.filter(m => m.id);

      // Create new milestones
      let newMilestonesData = [];
      if (newMilestones.length > 0) {
        newMilestonesData = newMilestones.map(milestone => ({
          milestone_order_id: milestoneOrderId,
          seller_id: user?.id,
          buyer_id: milestoneOrder.buyer_id,
          title: milestone.title,
          description: milestone.description,
          amount: parseFloat(milestone.amount),
          currency: 'GBP',
          due_date: new Date(milestone.due_date).toISOString(),
          status: 'pending'
        }));

        const { error: insertError } = await supabase
          .from('milestones')
          .insert(newMilestonesData);

        if (insertError) throw insertError;
      }

      // Update existing milestones
      for (const milestone of existingMilestones) {
        const { error: updateError } = await supabase
          .from('milestones')
          .update({
            title: milestone.title,
            description: milestone.description,
            amount: parseFloat(milestone.amount),
            due_date: new Date(milestone.due_date).toISOString(),
          })
          .eq('id', milestone.id)
          .eq('seller_id', user?.id); // Ensure only seller can update

        if (updateError) throw updateError;
      }

      const totalNewMilestones = newMilestones.length;
      const totalUpdatedMilestones = existingMilestones.length;

      // Send milestone created/updated message
      if (totalNewMilestones > 0 || totalUpdatedMilestones > 0) {
        const messageContent = totalNewMilestones > 0 && totalUpdatedMilestones > 0
          ? `Milestones updated: ${totalNewMilestones} added, ${totalUpdatedMilestones} updated`
          : totalNewMilestones > 0
          ? `New milestones added: ${totalNewMilestones} milestone(s) totaling £${newMilestonesData.reduce((sum: number, m: any) => sum + m.amount, 0).toFixed(2)}`
          : `Milestones updated: ${totalUpdatedMilestones} milestone(s) modified`;

        const messageData = {
          sender_id: user.id,
          receiver_id: milestoneOrder.buyer_id,
          content: messageContent,
          message_type: 'milestone_created',
          milestone_order_id: milestoneOrderId,
          metadata: {
            new_milestone_count: totalNewMilestones,
            updated_milestone_count: totalUpdatedMilestones,
            total_amount: newMilestonesData.reduce((sum: number, m: any) => sum + m.amount, 0)
          }
        };

        await supabase.from('messages').insert(messageData);
      }

      const actionMessage = totalNewMilestones > 0 && totalUpdatedMilestones > 0
        ? `${totalNewMilestones} milestone(s) added and ${totalUpdatedMilestones} updated successfully!`
        : totalNewMilestones > 0
        ? `${totalNewMilestones} milestone(s) added successfully!`
        : `${totalUpdatedMilestones} milestone(s) updated successfully!`;

      toast.success(actionMessage);
      setOpen(false);
      onMilestonesCreated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create milestones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {loadingExisting ? 'Loading Milestones...' : 'Manage Milestones'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Milestone {index + 1}</h3>
                  {milestones.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`title-${index}`}>Title</Label>
                    <Input
                      id={`title-${index}`}
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="e.g., Initial Assessment"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`amount-${index}`}>Amount (£)</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    placeholder="Describe what will be delivered in this milestone..."
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`due_date-${index}`}>Due Date</Label>
                  <Input
                    id={`due_date-${index}`}
                    type="date"
                    value={milestone.due_date}
                    onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addMilestone} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Milestone
          </Button>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingExisting} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
