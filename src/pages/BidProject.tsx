import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardLayout } from '../components/DashboardLayout';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../lib/auth.tsx';
import { useProjectDetail, getBidTokensRequiredForBudget } from '../hooks/useProjects';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Clock,
  Coins,
  DollarSign,
  MessageSquare,
  Sparkles,
  Target,
  ShieldCheck
} from 'lucide-react';

interface ExistingBid {
  id: string;
  bid_amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function BidProject() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const supabaseClient = supabase as any;

  const locationState = (location.state as { from?: string } | null) ?? null;
  const sellerReturnPath = locationState?.from;

  const [bidAmount, setBidAmount] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [bidTokens, setBidTokens] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [tokensRequired, setTokensRequired] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingBid, setExistingBid] = useState<ExistingBid | null>(null);

  const { project, loading: projectLoading, error: projectError } = useProjectDetail(projectId);

  const isSeller = user?.role === 'provider';

  const formattedDeadline = useMemo(() => {
    if (!project?.deadline) return null;
    return new Date(project.deadline).toLocaleDateString();
  }, [project?.deadline]);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchTokens() {
      try {
        setLoadingTokens(true);
        const { data, error } = await supabaseClient
          .from('users')
          .select('bid_tokens')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        const tokenData = data as { bid_tokens?: number } | null;
        if (tokenData && typeof tokenData.bid_tokens === 'number') {
          setBidTokens(tokenData.bid_tokens);
        } else {
          setBidTokens(0);
        }
      } catch (err) {
        console.error('Error fetching bid tokens:', err);
        toast.error('Unable to fetch your bidding tokens. Please try again later.');
        setBidTokens(0);
      } finally {
        setLoadingTokens(false);
      }
    }

    async function fetchExistingBid() {
      if (!projectId) return;
      const { data, error } = await supabaseClient
        .from('bids')
        .select('id, bid_amount, status, created_at')
        .eq('project_id', projectId)
        .eq('seller_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const existingData = data as ExistingBid;
        setExistingBid(existingData);
        setBidAmount(String(existingData.bid_amount));
      }
    }

    fetchTokens();
    fetchExistingBid();
  }, [projectId, user?.id]);

  useEffect(() => {
    if (!project) {
      setTokensRequired(null);
      return;
    }

    const loadTokensRequired = async () => {
      try {
        const budgetRaw = (project as any).budget ?? 0;
        const budget = typeof budgetRaw === 'number' ? budgetRaw : Number(budgetRaw) || 0;
        const required = await getBidTokensRequiredForBudget(budget);
        setTokensRequired(required);
      } catch (err) {
        console.error('Error fetching bid tokens required:', err);
        setTokensRequired(1);
      }
    };

    loadTokensRequired();
  }, [project]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('You need to be logged in to place a bid.');
      navigate('/login');
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!authLoading && user && !isSeller) {
      toast.error('Only sellers can place bids on projects.');
      navigate(-1);
    }
  }, [authLoading, isSeller, navigate, user]);

  const canBid = useMemo(() => {
    if (bidTokens === null) return false;
    if (tokensRequired === null) {
      return bidTokens > 0;
    }
    if (tokensRequired <= 0) {
      return true;
    }
    return bidTokens >= tokensRequired;
  }, [bidTokens, tokensRequired]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !user?.id) {
      toast.error('Project information missing.');
      return;
    }

    if (tokensRequired === null || tokensRequired < 0) {
      toast.error('Unable to determine tokens required to place a bid. Please try again later.');
      return;
    }

    if (!canBid) {
      if (tokensRequired > 0) {
        toast.error(`You need at least ${tokensRequired} tokens to place a bid. Please purchase tokens.`);
      } else {
        toast.error('You need tokens to place a bid. Please purchase tokens.');
      }
      navigate('/seller/tokens');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount.');
      return;
    }

    if (!deliveryDays.trim()) {
      toast.error('Please provide an estimated delivery timeline.');
      return;
    }

    if (!coverLetter.trim() || coverLetter.trim().length < 150) {
      toast.error('Please enter a message of at least 150 characters.');
      return;
    }

    setSubmitting(true);

    try {
      // Guard against duplicate bids by checking latest state from DB
      const { data: existing, error: existingError } = await supabaseClient
        .from('bids')
        .select('id')
        .eq('project_id', projectId)
        .eq('seller_id', user.id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing && !existingBid) {
        setExistingBid(existing as ExistingBid);
        toast.error('You have already placed a bid on this project.');
        setSubmitting(false);
        return;
      }

      const bidMessage = `${coverLetter.trim()}
\n\nProposed delivery: ${deliveryDays.trim()} day(s)`;

      const { data: bidRow, error: bidError } = await supabaseClient
        .from('bids')
        .insert({
          project_id: projectId,
          seller_id: user.id,
          bid_amount: amount,
          message: bidMessage,
          tokens_spent: tokensRequired
        })
        .select('id, bid_amount, status, created_at')
        .single();

      if (bidError) throw bidError;

      const { data: updatedUser, error: tokenError } = await supabaseClient
        .from('users')
        .update({ bid_tokens: Math.max(0, (bidTokens ?? tokensRequired) - tokensRequired) })
        .eq('id', user.id)
        .select('bid_tokens')
        .single();

      if (tokenError) {
        throw tokenError;
      }

      const updated = updatedUser as { bid_tokens?: number } | null;
      if (updated && typeof updated.bid_tokens === 'number') {
        setBidTokens(updated.bid_tokens);
      } else {
        setBidTokens(Math.max(0, (bidTokens ?? tokensRequired) - tokensRequired));
      }
      setExistingBid((bidRow as ExistingBid) ?? null);

      toast.success('Bid submitted successfully!');
      const fallbackProjectPath = projectId ? `/project/${projectId}` : '/searchresults';
      const redirectAfterBid = sellerReturnPath || (isSeller ? '/searchresults' : fallbackProjectPath);
      setTimeout(() => navigate(redirectAfterBid, { replace: true }), 1200);
    } catch (err) {
      console.error('Error submitting bid:', err);
      toast.error('Failed to submit bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToProject = () => {
    if (sellerReturnPath) {
      navigate(sellerReturnPath, { replace: true });
      return;
    }

    if (isSeller) {
      navigate('/searchresults', { replace: true });
      return;
    }

    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate(-1);
    }
  };

  const renderBidStatus = () => {
    if (!existingBid) return null;

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2 text-base">
            <BadgeCheck className="h-4 w-4" />
            Bid Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>You placed a bid of <strong>£{existingBid.bid_amount.toFixed(2)}</strong>.</p>
          <p>Status: <Badge variant="outline" className="border-blue-300 text-blue-700">{existingBid.status}</Badge></p>
          <div className="flex gap-2 pt-3">
            <Button size="sm" variant="outline" onClick={handleBackToProject}>
              View Project Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (projectLoading || authLoading || loadingTokens) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="h-10 w-10 rounded-full border-b-2 border-primary animate-spin mb-4" />
            Loading bidding workspace...
          </div>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  if (projectError || !project) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Project Unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <p>{projectError || 'We could not find the project you are trying to bid on.'}</p>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToProject} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>

          <Badge variant="outline" className="text-xs">
            {tokensRequired !== null ? (
              <>
                Each bid costs <strong className="ml-1">{tokensRequired} token{tokensRequired === 1 ? '' : 's'}</strong>
              </>
            ) : (
              'Calculating tokens required...'
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Overview */}
          <div className="space-y-4 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{project.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
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

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs uppercase text-gray-500">Budget</p>
                      <p className="text-sm font-semibold">£{project.budget} ({project.budget_type})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs uppercase text-gray-500">Deadline</p>
                      <p className="text-sm font-semibold">{formattedDeadline || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs uppercase text-gray-500">Posted</p>
                      <p className="text-sm font-semibold">{new Date(project.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs uppercase text-gray-500 mb-2">Project Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                {project.skills && project.skills.length > 0 && (
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Bidding Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-gray-600">
                <p className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                  Craft a personalized proposal that showcases your relevant experience.
                </p>
                <p className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                  Explain your approach, highlight past successes, and set clear expectations.
                </p>
                <p className="flex items-start gap-2">
                  <Coins className="h-4 w-4 text-emerald-500 mt-0.5" />
                  Each bid costs <strong className="text-gray-900">{tokensRequired !== null ? `${tokensRequired} token${tokensRequired === 1 ? '' : 's'}` : 'tokens'}</strong>. Manage your tokens wisely.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bid Workspace */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-primary/40">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  Bidding Tokens
                </CardTitle>
                <Badge variant={canBid ? 'default' : 'destructive'} className="text-sm">
                  {bidTokens ?? 0} tokens available
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-3">
                <p>
                  Every seller starts with <strong>100 tokens</strong>. Placing a bid deducts tokens based on the project budget. Tokens help prevent spam and maintain project quality.
                </p>
                {!canBid && (
                  <div className="p-3 border border-dashed border-red-300 rounded-lg bg-red-50 text-red-700 text-xs">
                    You have run out of tokens. Please contact support to top up your tokens and continue bidding.
                  </div>
                )}
              </CardContent>
            </Card>

            {renderBidStatus()}

            {!existingBid && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Submit Your Bid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleSubmitBid}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="bidAmount" className="text-sm font-medium text-gray-700">
                          Your Bid Amount (£)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="bidAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter your bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="pl-10"
                            disabled={submitting || !canBid}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Bid thoughtfully—clients value fair pricing and strong proposals.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="deliveryDays" className="text-sm font-medium text-gray-700">
                          Estimated Delivery (days)
                        </label>
                        <Input
                          id="deliveryDays"
                          type="number"
                          min="1"
                          placeholder="e.g. 7"
                          value={deliveryDays}
                          onChange={(e) => setDeliveryDays(e.target.value)}
                          disabled={submitting || !canBid}
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Let the client know how quickly you can deliver results.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="coverLetter" className="text-sm font-medium text-gray-700">
                        Proposal / Cover Letter
                      </label>
                      <Textarea
                        id="coverLetter"
                        rows={6}
                        placeholder="Introduce yourself, explain your approach, and highlight relevant experience..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        disabled={submitting || !canBid}
                      />
                      <p className="text-xs text-gray-500">
                        A compelling story can set you apart. Share relevant achievements and how you plan to tackle this project.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>
                          This bid will cost <strong>{tokensRequired !== null ? `${tokensRequired} token${tokensRequired === 1 ? '' : 's'}` : 'tokens'}</strong>. Tokens are only deducted when your bid is submitted successfully.
                        </span>
                      </div>
                      <Button type="submit" disabled={submitting || !canBid}>
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
