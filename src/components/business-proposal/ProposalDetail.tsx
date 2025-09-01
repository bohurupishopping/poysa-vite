import React, { useState } from 'react';
import { BusinessProposal } from '@/types/business-proposal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { downloadBusinessProposalDocument } from '@/utils/businessProposalUtils';
import { DocumentViewer } from './DocumentViewer';
import { toast } from 'sonner';

interface ProposalDetailProps {
  proposal: BusinessProposal;
  onBack: () => void;
  onUpdateStatus: (proposalId: string, status: 'approved' | 'rejected', adminNotes?: string) => void;
  onDelete: (proposalId: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="w-4 h-4 mr-2" />
          Pending Review
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-4 h-4 mr-2" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="w-4 h-4 mr-2" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

export const ProposalDetail: React.FC<ProposalDetailProps> = ({
  proposal,
  onBack,
  onUpdateStatus,
  onDelete
}) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusUpdate = () => {
    onUpdateStatus(proposal.id, selectedStatus, adminNotes);
    setShowStatusDialog(false);
    setAdminNotes('');
  };

  const handleDelete = () => {
    onDelete(proposal.id);
    setShowDeleteDialog(false);
  };

  const openStatusDialog = (status: 'approved' | 'rejected') => {
    setSelectedStatus(status);
    setShowStatusDialog(true);
  };

  const downloadDocument = async (url: string, filename: string) => {
    try {
      await downloadBusinessProposalDocument(url, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Proposals
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building className="h-8 w-8 text-blue-600" />
                {proposal.company_name}
              </h1>
              <p className="text-gray-600 mt-1">Business Proposal Review</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(proposal.status)}
            {proposal.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => openStatusDialog('approved')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => openStatusDialog('rejected')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {proposal.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                {proposal.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {proposal.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                {getStatusBadge(proposal.status)}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Submitted: {format(new Date(proposal.created_at), 'MMM dd, yyyy')}
              </p>
              {proposal.updated_at !== proposal.created_at && (
                <p className="text-sm text-gray-600">
                  Updated: {format(new Date(proposal.updated_at), 'MMM dd, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Contact Person</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{proposal.full_name}</p>
                <p className="text-sm text-gray-600">{proposal.email}</p>
                <p className="text-sm text-gray-600">{proposal.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">
                  {proposal.document_urls?.length || 0} files uploaded
                </span>
              </div>
              {proposal.document_urls && proposal.document_urls.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {proposal.document_urls.map((_, index) => (
                    <div key={index} className="w-2 h-2 bg-blue-500 rounded-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Company Name</Label>
                <p className="text-sm font-medium">{proposal.company_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">GST Status</Label>
                <p className="text-sm">
                  {proposal.is_gst_registered ? (
                    <span className="text-green-600 font-medium">
                      Registered ({proposal.gstin})
                    </span>
                  ) : (
                    <span className="text-gray-600">Not Registered</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Business Address</Label>
              <div className="text-sm text-gray-600 mt-1 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p>{proposal.address_line_1}</p>
                  {proposal.address_line_2 && <p>{proposal.address_line_2}</p>}
                  <p>{proposal.city}, {proposal.state_province} {proposal.postal_code}</p>
                  <p>{proposal.country}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
              <p className="text-sm font-medium">{proposal.full_name}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${proposal.email}`} className="text-blue-600 hover:underline">
                    {proposal.email}
                  </a>
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Phone</Label>
                <p className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${proposal.phone}`} className="text-blue-600 hover:underline">
                    {proposal.phone}
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="lg:col-span-2 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              {proposal.document_urls && proposal.document_urls.length > 0
                ? `${proposal.document_urls.length} document(s) uploaded`
                : 'No documents uploaded'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proposal.document_urls && proposal.document_urls.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposal.document_urls.map((url, index) => {
                  const filename = url.split('/').pop() || `Document ${index + 1}`;
                  return (
                    <div key={index} className="space-y-2">
                      <DocumentViewer
                        url={url}
                        title={`Document ${index + 1}`}
                        filename={filename}
                      />
                      <div className="text-center">
                        <p className="text-xs text-gray-600 truncate" title={filename}>
                          {filename}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No documents uploaded</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Notes */}
        {proposal.admin_notes && (
          <Card className="lg:col-span-2 rounded-lg border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <FileText className="h-4 w-4" />
                Admin Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 text-sm">{proposal.admin_notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card className="lg:col-span-2 rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </CardTitle>
            <CardDescription>
              Proposal submission and update history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-blue-600 rounded-full mt-1"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Proposal Submitted</p>
                    <span className="text-xs text-gray-500">
                      {format(new Date(proposal.created_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(proposal.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>

              {proposal.updated_at !== proposal.created_at && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Last Updated</p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(proposal.updated_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(proposal.updated_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {proposal.status === 'approved' && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">Proposal Approved</p>
                    <p className="text-xs text-gray-500 mt-1">Ready for company assignment</p>
                  </div>
                </div>
              )}

              {proposal.status === 'rejected' && (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-red-600 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">Proposal Rejected</p>
                    <p className="text-xs text-gray-500 mt-1">Requires revision or resubmission</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStatus === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {selectedStatus === 'approved' ? 'Approve' : 'Reject'} Proposal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedStatus === 'approved' ? 'approve' : 'reject'} the business proposal from <strong>{proposal.company_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes" className="text-sm font-medium">
                Admin Notes {selectedStatus === 'rejected' ? '(Required)' : '(Optional)'}
              </Label>
              <Textarea
                id="admin-notes"
                placeholder={selectedStatus === 'approved'
                  ? "Add any notes or next steps for this approval..."
                  : "Please provide detailed feedback for the rejection..."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              className={selectedStatus === 'approved'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {selectedStatus === 'approved' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Proposal
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Proposal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Delete Proposal
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the business proposal from <strong>{proposal.company_name}</strong>? This action cannot be undone and all associated data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <XCircle className="w-4 h-4 mr-2" />
              Delete Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};