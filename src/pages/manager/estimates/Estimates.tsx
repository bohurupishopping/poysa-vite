import { useEffect, useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, Download, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { EstimateService } from "@/services/estimateService";
import { EstimateWithDetails, EstimateStatus } from "@/components/create-estimate/types";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<EstimateStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  invoiced: "bg-purple-100 text-purple-800",
  expired: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  invoiced: "Invoiced",
  expired: "Expired",
};

export default function Estimates() {
  const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const estimateService = EstimateService.getInstance();

  useEffect(() => {
    if (profile?.company_id) {
      fetchEstimates();
    }
  }, [profile?.company_id]);

  const fetchEstimates = async () => {
    if (!profile?.company_id) return;
    
    try {
      setLoading(true);
      const data = await estimateService.getEstimates(profile.company_id);
      setEstimates(data);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch estimates. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEstimate = async (estimateId: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;
    
    try {
      await estimateService.deleteEstimate(estimateId);
      toast({
        title: "Success",
        description: "Estimate deleted successfully"
      });
      fetchEstimates();
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast({
        title: "Error",
        description: "Failed to delete estimate. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConvertToInvoice = async (estimateId: string) => {
    try {
      const invoiceId = await estimateService.convertToInvoice(estimateId);
      toast({
        title: "Success",
        description: "Estimate converted to invoice successfully"
      });
      // Update the estimate status to 'invoiced'
      await estimateService.updateEstimateStatus(estimateId, 'invoiced');
      fetchEstimates();
      // Navigate to the new invoice
      navigate(`/manager/sales/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error converting estimate to invoice:', error);
      toast({
        title: "Error",
        description: "Failed to convert estimate to invoice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (estimateId: string, status: EstimateStatus) => {
    try {
      await estimateService.updateEstimateStatus(estimateId, status);
      toast({
        title: "Success",
        description: "Estimate status updated successfully"
      });
      fetchEstimates();
    } catch (error) {
      console.error('Error updating estimate status:', error);
      toast({
        title: "Error",
        description: "Failed to update estimate status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = 
      estimate.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || estimate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: EstimateStatus) => {
    return (
      <Badge className={`${statusColors[status]} border-0`}>
        {statusLabels[status]}
      </Badge>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Estimates</h1>
            <p className="text-gray-600">Manage your sales estimates and quotations</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search and Filter in same row as buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search estimates..."
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
                className="h-9 lg:h-10 px-3 lg:px-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                onClick={() => navigate('/manager/sales/estimates/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Estimate</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Estimates</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{estimates.length}</div>
            <p className="text-xs text-blue-600/70">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Draft</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              {estimates.filter(e => e.status === 'draft').length}
            </div>
            <p className="text-xs text-gray-600/70">Not sent</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700">Sent</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
              {estimates.filter(e => e.status === 'sent').length}
            </div>
            <p className="text-xs text-orange-600/70">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Accepted</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">
              {estimates.filter(e => e.status === 'accepted').length}
            </div>
            <p className="text-xs text-green-600/70">Ready to invoice</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow className="hover:bg-gray-50/30">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Estimate #</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Expiry Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Total Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading estimates...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredEstimates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No estimates found matching your criteria.' 
                        : 'No estimates found. Create your first estimate to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEstimates.map((estimate) => (
                    <TableRow key={estimate.id} className="hover:bg-gray-50/20 transition-colors">
                      <TableCell className="py-4 px-6 font-medium text-blue-600">
                        {estimate.estimate_number}
                      </TableCell>
                      <TableCell className="py-4 px-6 font-medium text-gray-900">
                        {estimate.customer_name || 'Unknown Customer'}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {formatDate(estimate.estimate_date)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {estimate.expiry_date ? formatDate(estimate.expiry_date) : '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6 font-semibold text-gray-900">
                        {formatCurrency(estimate.total_amount)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={`${statusColors[estimate.status]} border-0 rounded-full px-3 py-1`}>
                          {statusLabels[estimate.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/manager/sales/estimates/${estimate.id}/edit`)}
                            className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {/* Status-based action buttons */}
                          {estimate.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(estimate.id, 'sent')}
                              className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}

                          {estimate.status === 'sent' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(estimate.id, 'accepted')}
                                className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(estimate.id, 'declined')}
                                className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Decline
                              </Button>
                            </>
                          )}

                          {estimate.status === 'accepted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToInvoice(estimate.id)}
                              className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Invoice
                            </Button>
                          )}

                          {/* Mark as expired for sent estimates past expiry date */}
                          {estimate.status === 'sent' && estimate.expiry_date &&
                           new Date() > new Date(estimate.expiry_date) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(estimate.id, 'expired')}
                              className="h-8 px-3 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 text-xs"
                            >
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Expire
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEstimate(estimate.id)}
                            className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredEstimates.length === 0 && !loading && (
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50 mt-6">
          <CardContent className="text-center py-16 px-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No estimates found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? 'Try adjusting your search criteria or clear filters to see all estimates'
                  : 'Create your first estimate to get started with managing your quotations'
                }
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
                  onClick={() => navigate('/manager/sales/estimates/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Estimate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
