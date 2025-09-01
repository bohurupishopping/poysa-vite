import { useEffect, useState } from "react";
import { Plus, Search, Eye, Edit, Trash2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { BillStatus } from "@/integrations/supabase/manager-types";
import { useNavigate } from "react-router-dom";
import { purchaseBillService, PurchaseBill } from "@/services/purchaseBillService";

export default function ManagerPurchaseBills() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [bills, setBills] = useState<PurchaseBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        const fetchBills = async () => {
            if (!profile?.company_id) return;

            try {
                const billsData = await purchaseBillService.getBillsPaginated(profile.company_id);
                setBills(billsData);
            } catch (error) {
                console.error('Error fetching bills:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, [profile?.company_id]);

    const filteredBills = bills.filter(bill => {
        const matchesSearch =
            (bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            bill.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || bill.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: BillStatus) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'submitted':
                return 'bg-blue-100 text-blue-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'partially_paid':
                return 'bg-yellow-100 text-yellow-800';
            case 'void':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusCounts = () => {
        return {
            all: bills.length,
            draft: bills.filter(b => b.status === 'draft').length,
            submitted: bills.filter(b => b.status === 'submitted').length,
            paid: bills.filter(b => b.status === 'paid').length,
            partially_paid: bills.filter(b => b.status === 'partially_paid').length,
            void: 0, // 'void' status is not in the PurchaseBill interface
        };
    };

    const statusCounts = getStatusCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading bills...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Purchase Bills</h1>
                        <p className="text-gray-600">Manage supplier bills and payments</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search and Filter in same row as buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search bills..."
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
                                    <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                                    <SelectItem value="draft">Draft ({statusCounts.draft})</SelectItem>
                                    <SelectItem value="submitted">Submitted ({statusCounts.submitted})</SelectItem>
                                    <SelectItem value="partially_paid">Partially Paid ({statusCounts.partially_paid})</SelectItem>
                                    <SelectItem value="paid">Paid ({statusCounts.paid})</SelectItem>
                                    <SelectItem value="void">Void ({statusCounts.void})</SelectItem>
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
                                onClick={() => navigate('/manager/purchases/bills/new')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">New Bill</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Bills</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{statusCounts.all}</div>
                        <p className="text-xs text-blue-600/70">All time</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700">Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">
                            {statusCounts.submitted + statusCounts.partially_paid}
                        </div>
                        <p className="text-xs text-orange-600/70">Awaiting payment</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{statusCounts.paid}</div>
                        <p className="text-xs text-green-600/70">Fully paid</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl lg:text-2xl font-bold text-purple-900 mb-1">
                            {formatCurrency(bills.reduce((sum, bill) => sum + bill.totalAmount, 0))}
                        </div>
                        <p className="text-xs text-purple-600/70">All bills</p>
                    </CardContent>
                </Card>
            </div>



            {/* Bills Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Bill #</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Supplier</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Due Date</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Amount</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Paid</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBills.map((bill, index) => (
                                    <TableRow key={bill.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="font-medium text-blue-600">
                                                {bill.billNumber || 'Draft'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-medium text-gray-900">
                                                {bill.supplierName || 'Unknown Supplier'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-gray-600">
                                            {new Date(bill.billDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-gray-600">
                                            {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(bill.totalAmount)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(bill.amountPaid)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getStatusColor(bill.status)}`}>
                                                {bill.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 text-xs"
                                                    onClick={() => navigate(`/manager/purchases/bills/${bill.id}`)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                {bill.status === 'draft' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                )}
                                                {bill.status === 'submitted' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                                                    >
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 text-xs"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredBills.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || statusFilter !== "all"
                                    ? 'Try adjusting your search criteria or clear filters to see all bills'
                                    : 'Create your first bill to get started with managing your purchases'
                                }
                            </p>
                            {(!searchTerm && statusFilter === "all") && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
                                    onClick={() => navigate('/manager/purchases/bills/new')}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Bill
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
