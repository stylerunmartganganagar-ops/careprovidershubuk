import { useState } from 'react';
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
  offerId: string;
  trigger: React.ReactNode;
  onMilestonesCreated?: () => void;
}

interface Milestone {
  title: string;
  description: string;
  amount: string;
  due_date: string;
}

export function CreateMilestonesDialog({ offerId, trigger, onMilestonesCreated }: CreateMilestonesDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', amount: '', due_date: '' }
  ]);
  const [error, setError] = useState('');

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

      // Get offer details to verify ownership and get buyer info
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('seller_id, buyer_id')
        .eq('id', offerId)
        .single();

      if (offerError) throw offerError;

      if (offer.seller_id !== user?.id) {
        throw new Error('You can only create milestones for your own offers');
      }

      // Create milestones
      const milestonesData = milestones.map(milestone => ({
        offer_id: offerId,
        seller_id: user?.id,
        buyer_id: offer.buyer_id,
        title: milestone.title,
        description: milestone.description,
        amount: parseFloat(milestone.amount),
        currency: 'GBP',
        due_date: new Date(milestone.due_date).toISOString(),
        status: 'pending'
      }));

      const { error: insertError } = await supabase
        .from('milestones')
        .insert(milestonesData);

      if (insertError) throw insertError;

      toast.success(`${milestones.length} milestone(s) created successfully!`);
      setOpen(false);
      setMilestones([{ title: '', description: '', amount: '', due_date: '' }]);
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
            Create Milestones
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
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Milestones'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
