import React from 'react';
import { BusinessProposal } from '@/types/business-proposal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProposalTableProps {
  proposals: BusinessProposal[];
  onViewDetails: (proposalId: string) => void;
  onUpdateStatus: (proposalId: string, status: 'approved' | 'rejected') => void;
  onDelete: (proposalId: string) => void;
  loading?: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="w-3 h-3 mr-1" />
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

export const ProposalTable: React.FC<ProposalTableProps> = ({
  proposals,
  onViewDetails,
  onUpdateStatus,
  onDelete,
  loading = false
}) => {
  return (
    <Table>
      {loading ? (
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading business proposals...</span>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      ) : proposals.length === 0 ? (
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
              No business proposals found.
            </TableCell>
          </TableRow>
        </TableBody>
      ) : (
        <>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{proposal.company_name}</div>
                    <div className="text-sm text-gray-500">
                      {proposal.is_gst_registered ? `GST: ${proposal.gstin}` : 'No GST Registration'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{proposal.full_name}</div>
                    <div className="text-sm text-gray-500">Contact Person</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{proposal.email}</p>
                    <p className="text-xs text-gray-500">{proposal.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{proposal.city}, {proposal.state_province}</div>
                    <div className="text-gray-500">{proposal.country}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {proposal.document_urls && proposal.document_urls.length > 0 && (
                      <>
                        {proposal.document_urls.map((_, index) => (
                          <div key={index} className="w-2 h-2 bg-blue-500 rounded-full" title={`Document ${index + 1}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">
                          {proposal.document_urls.length}
                        </span>
                      </>
                    )}
                    {(!proposal.document_urls || proposal.document_urls.length === 0) && (
                      <span className="text-xs text-gray-400">No documents</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(proposal.status)}
                    {proposal.status === 'pending' && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{format(new Date(proposal.created_at), 'MMM dd, yyyy')}</p>
                    {proposal.updated_at !== proposal.created_at && (
                      <p className="text-xs text-gray-500">
                        Updated: {format(new Date(proposal.updated_at), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(proposal.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>

                    {proposal.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(proposal.id, 'approved')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </>
      )}
    </Table>
  );
};