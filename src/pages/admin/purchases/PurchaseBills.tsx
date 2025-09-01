import { useEffect, useState } from "react";
import { CreditCard, Edit, Trash2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { CreateBillModal } from "@/components/modals/CreateBillModal";
import { ViewBillModal } from "@/components/modals/ViewBillModal";
import { supabase } from "@/integrations/supabase/client";

interface Bill {
  id: string;
  bill_number: string | null;
  bill_date: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  suppliers: { name: string } | null;
}

export default function PurchaseBills() {
  const { selectedCompany } = useCompanyContext();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('purchase_bills')
        .select(`
          *,
          suppliers (name)
        `)
        .eq('company_id', selectedCompany)
        .order('bill_date', { ascending: false });

      if (data) {
        setBills(data);
        setFilteredBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [selectedCompany]);

  // Filter bills based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBills(bills);
    } else {
      const filtered = bills.filter(bill =>
        bill.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBills(filtered);
    }
  }, [searchTerm, bills]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'draft': return 'secondary';
      case 'approved': return 'outline';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-neutral-500">Please select a company to manage purchase bills.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading purchase bills...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Bills</h1>
          <p className="text-gray-600">Manage all supplier bills and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-64 rounded-full border-0 focus-visible:ring-1"
            />
          </div>
          <CreateBillModal
            companyId={selectedCompany}
            onBillCreated={fetchBills}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading bills...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No bills found matching your search.' : 'No purchase bills found. Create your first bill to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredBills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-neutral-500" />
                      {bill.bill_number || 'No Number'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {bill.suppliers?.name || 'Unknown Supplier'}
                  </TableCell>
                  <TableCell>
                    {new Date(bill.bill_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ₹{Number(bill.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    ₹{Number(bill.amount_paid).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(bill.status)}
                      className="rounded-full"
                    >
                      {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ViewBillModal billId={bill.id} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
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
    </div>
  );
}