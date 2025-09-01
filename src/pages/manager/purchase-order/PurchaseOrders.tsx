import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Send, FileText, Truck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PurchaseOrderService } from "@/services/purchaseOrderService";
import { PurchaseOrderWithDetails, PurchaseOrderStatus } from "@/components/create-purchase-order/types";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  closed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  closed: "Closed",
  cancelled: "Cancelled",
};

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const purchaseOrderService = PurchaseOrderService.getInstance();

  useEffect(() => {
    if (profile?.company_id) {
      fetchPurchaseOrders();
    }
  }, [profile?.company_id]);

  const fetchPurchaseOrders = async () => {
    if (!profile?.company_id) return;
    
    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrders(profile.company_id);
      setPurchaseOrders(data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchaseOrder = async (poId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    
    try {
      await purchaseOrderService.deletePurchaseOrder(poId);
      toast({
        title: "Success",
        description: "Purchase order deleted successfully"
      });
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConvertToBill = async (poId: string) => {
    try {
      const billId = await purchaseOrderService.convertToBill(poId);
      toast({
        title: "Success",
        description: "Purchase order converted to bill successfully"
      });
      // Update the purchase order status to 'closed'
              await purchaseOrderService.updatePurchaseOrderStatus(poId, 'closed');
      fetchPurchaseOrders();
      // Navigate to the new bill
      navigate(`/manager/purchases/bills/${billId}`);
    } catch (error) {
      console.error('Error converting purchase order to bill:', error);
      toast({
        title: "Error",
        description: "Failed to convert purchase order to bill. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (poId: string, status: PurchaseOrderStatus) => {
    try {
      await purchaseOrderService.updatePurchaseOrderStatus(poId, status);
      toast({
        title: "Success",
        description: "Purchase order status updated successfully"
      });
      fetchPurchaseOrders();
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    
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

  const getStatusBadge = (status: PurchaseOrderStatus) => {
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage your purchase orders and supplier procurement</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search and Filter in same row as buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search purchase orders..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
                onClick={() => navigate('/manager/purchases/purchase-orders/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">New Order</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{purchaseOrders.length}</div>
            <p className="text-xs text-blue-600/70">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Draft</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
              {purchaseOrders.filter(po => po.status === 'draft').length}
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
              {purchaseOrders.filter(po => po.status === 'sent').length}
            </div>
            <p className="text-xs text-orange-600/70">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Approved</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">
              {purchaseOrders.filter(po => po.status === 'approved').length}
            </div>
            <p className="text-xs text-green-600/70">Ready to bill</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/30">
                <TableRow className="hover:bg-gray-50/30">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">PO #</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Supplier</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Order Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Expected Delivery</TableHead>
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
                        <span className="ml-2">Loading purchase orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No purchase orders found matching your criteria.' 
                        : 'No purchase orders found. Create your first purchase order to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-gray-50/20 transition-colors">
                      <TableCell className="py-4 px-6 font-medium text-blue-600">
                        {po.po_number}
                      </TableCell>
                      <TableCell className="py-4 px-6 font-medium text-gray-900">
                        {po.supplier_name || 'Unknown Supplier'}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {formatDate(po.order_date)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-gray-600">
                        {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6 font-semibold text-gray-900">
                        {formatCurrency(po.total_amount)}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={`${statusColors[po.status]} border-0 rounded-full px-3 py-1`}>
                          {statusLabels[po.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/manager/purchases/purchase-orders/${po.id}/edit`)}
                            className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {/* Status-based action buttons */}
                          {po.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(po.id, 'sent')}
                              className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Send
                            </Button>
                          )}

                          {po.status === 'sent' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(po.id, 'approved')}
                                className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(po.id, 'cancelled')}
                                className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs"
                              >
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </Button>
                            </>
                          )}

                          {po.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToBill(po.id)}
                              className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Bill
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePurchaseOrder(po.id)}
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

      {filteredPurchaseOrders.length === 0 && !loading && (
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50 mt-6">
          <CardContent className="text-center py-16 px-8">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== "all"
                  ? 'Try adjusting your search criteria or clear filters to see all purchase orders'
                  : 'Create your first purchase order to get started with managing your procurement'
                }
              </p>
              {(!searchTerm && statusFilter === "all") && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
                  onClick={() => navigate('/manager/purchases/purchase-orders/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
