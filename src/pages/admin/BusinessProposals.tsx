import { useState } from 'react';
import { useAdminProposals } from '@/hooks/useAdminProposals';
import { ProposalTable } from '@/components/business-proposal/ProposalTable';
import { ProposalDetail } from '@/components/business-proposal/ProposalDetail';
import { BusinessProposal } from '@/types/business-proposal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Building2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

const BusinessProposals: React.FC = () => {
  const {
    proposals,
    loading,
    fetchProposals,
    updateProposalStatus,
    deleteProposal,
    getProposalById,
    getProposalStats
  } = useAdminProposals();

  const [selectedProposal, setSelectedProposal] = useState<BusinessProposal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailLoading, setDetailLoading] = useState(false);

  const stats = getProposalStats();

  // Filter proposals based on search term and status
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch =
      proposal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = async (proposalId: string) => {
    setDetailLoading(true);
    try {
      const proposal = await getProposalById(proposalId);
      if (proposal) {
        setSelectedProposal(proposal);
      }
    } catch (error) {
      toast.error('Failed to load proposal details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (proposalId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    const success = await updateProposalStatus(proposalId, status, adminNotes);
    if (success && selectedProposal && selectedProposal.id === proposalId) {
      // Update the selected proposal if it's currently being viewed
      setSelectedProposal({
        ...selectedProposal,
        status,
        admin_notes: adminNotes || selectedProposal.admin_notes
      });
    }
  };

  const handleDelete = async (proposalId: string) => {
    const success = await deleteProposal(proposalId);
    if (success && selectedProposal && selectedProposal.id === proposalId) {
      // Go back to list view if the deleted proposal was being viewed
      setSelectedProposal(null);
    }
  };

  const handleRefresh = () => {
    fetchProposals();
    toast.success('Proposals refreshed');
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading proposal details...</span>
      </div>
    );
  }

  if (selectedProposal) {
    return (
      <ProposalDetail
        proposal={selectedProposal}
        onBack={() => setSelectedProposal(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Business Proposals
            </h1>
            <p className="text-gray-600">Review and manage business proposals from users seeking to join the platform</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search and Filter in same row as buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by company, contact, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({stats.total})</SelectItem>
                  <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
                  <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
                  <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                variant="outline"
                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-0 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-0 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.total}</div>
            <p className="text-xs text-blue-600/70">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{stats.pending}</div>
            <p className="text-xs text-orange-600/70">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.approved}</div>
            <p className="text-xs text-green-600/70">Successfully onboarded</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-red-700">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-red-900 mb-1">{stats.rejected}</div>
            <p className="text-xs text-red-600/70">Declined proposals</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading proposals...</span>
        </div>
      ) : (
        <>
          {/* Business Proposals Table */}
          <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardContent className="p-0">
              <ProposalTable
                proposals={filteredProposals}
                onViewDetails={handleViewDetails}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDelete}
                loading={loading}
              />
            </CardContent>
          </Card>

          {filteredProposals.length === 0 && (
            <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
              <CardContent className="text-center py-16 px-8">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-20 flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? 'Try adjusting your search criteria or clear filters to see all proposals'
                      : 'No business proposals have been submitted yet'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BusinessProposals;
