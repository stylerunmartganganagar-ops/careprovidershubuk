import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth.tsx';
import { supabase } from '../lib/supabase';
import { DashboardHeader } from '../components/DashboardHeader';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Camera,
  Clock
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type KycDocument = Database['public']['Tables']['kyc_documents']['Row'] & {
  user?: {
    name: string;
    email: string;
  };
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function AdminKYC() {
  const { user } = useAuth();
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadKYCDocuments();
    }
  }, [user]);

  const loadKYCDocuments = async () => {
    try {
      const { data, error } = await (supabase
        .from('kyc_documents')
        .select(`
          *,
          user:users!kyc_documents_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      setKycDocuments(data || []);
    } catch (error) {
      console.error('Error loading KYC documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedDocument) return;

    setProcessing(true);
    try {
      const updateData = {
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        ...(action === 'reject' && { rejection_reason: rejectionReason }),
      };

      const { error } = await (supabase
        .from('kyc_documents')
        .update(updateData)
        .eq('id', selectedDocument.id) as any);

      if (error) throw error;

      // Update local state
      setKycDocuments(prev =>
        prev.map(doc =>
          doc.id === selectedDocument.id
            ? { ...doc, ...updateData }
            : doc
        )
      );

      setReviewDialog(false);
      setSelectedDocument(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating KYC status:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredDocuments = kycDocuments.filter(doc => {
    const matchesSearch = !searchTerm ||
      doc.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStats = () => {
    const stats = { pending: 0, approved: 0, rejected: 0, total: kycDocuments.length };
    kycDocuments.forEach(doc => {
      stats[doc.status]++;
    });
    return stats;
  };

  const stats = getStatusStats();

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">KYC Verification</h1>
              <p className="text-gray-600">
                Review and approve user identity verification submissions.
              </p>
            </div>
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-filter">Filter by status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Documents List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading KYC documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No KYC submissions found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No KYC verification requests have been submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((doc) => {
              const StatusIcon = statusIcons[doc.status];
              return (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`h-5 w-5 ${
                            doc.status === 'pending' ? 'text-yellow-500' :
                            doc.status === 'approved' ? 'text-green-500' : 'text-red-500'
                          }`} />
                          <div>
                            <h3 className="font-medium">{doc.user?.name || 'Unknown User'}</h3>
                            <p className="text-sm text-gray-600">{doc.user?.email}</p>
                          </div>
                        </div>

                        <div className="hidden md:block">
                          <Badge className={statusColors[doc.status]}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="hidden lg:block text-sm text-gray-600">
                          {doc.document_type.replace('_', ' ').toUpperCase()}
                        </div>

                        <div className="hidden xl:block text-sm text-gray-600">
                          {new Date(doc.submitted_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setReviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Document Review</DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {/* User Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{selectedDocument.user?.name}</p>
                      <p className="text-sm text-gray-600">{selectedDocument.user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Document Type</Label>
                      <p className="font-medium">
                        {selectedDocument.document_type.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Submitted</Label>
                      <p className="font-medium">
                        {new Date(selectedDocument.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Front of Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={selectedDocument.front_document_url}
                      alt="Front of document"
                      className="w-full rounded-lg border"
                    />
                  </CardContent>
                </Card>

                {selectedDocument.back_document_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Back of Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={selectedDocument.back_document_url}
                        alt="Back of document"
                        className="w-full rounded-lg border"
                      />
                    </CardContent>
                  </Card>
                )}

                {selectedDocument.selfie_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Selfie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={selectedDocument.selfie_url}
                        alt="Selfie"
                        className="w-full max-w-xs mx-auto rounded-lg border"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Review Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setAction('approve')}
                        variant={action === 'approve' ? 'default' : 'outline'}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setAction('reject')}
                        variant={action === 'reject' ? 'destructive' : 'outline'}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>

                    {action === 'reject' && (
                      <div>
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Please provide a reason for rejection..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleReview}
                      disabled={processing || (action === 'reject' && !rejectionReason.trim())}
                      className="w-full"
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
