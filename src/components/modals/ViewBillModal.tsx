import { useState, useEffect } from "react";
import { Eye, CreditCard, Truck, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface ViewBillModalProps {
  billId: string;
  trigger?: React.ReactNode;
}

interface BillDetail {
  id: string;
  bill_number: string | null;
  bill_date: string;
  due_date: string | null;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  suppliers: { name: string } | null;
  purchase_bill_lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    products: { name: string } | null;
  }>;
}

export function ViewBillModal({ billId, trigger }: ViewBillModalProps) {
  const [open, setOpen] = useState(false);
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBillDetail = async () => {
    if (!billId) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('purchase_bills')
        .select(`
          *,
          suppliers (name),
          purchase_bill_lines (
            id,
            description,
            quantity,
            unit_price,
            line_total,
            products (name)
          )
        `)
        .eq('id', billId)
        .single();
      
      if (data) setBill(data);
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBillDetail();
    }
  }, [open, billId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'draft': return 'secondary';
      case 'approved': return 'outline';
      case 'void': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Bill Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this purchase bill
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : bill ? (
          <div className="space-y-6">
            {/* Bill Header */}
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bill Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Bill Number</label>
                    <p className="text-lg font-bold">{bill.bill_number || 'No Number'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Bill Date
                      </label>
                      <p className="text-sm">{new Date(bill.bill_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due Date
                      </label>
                      <p className="text-sm">{bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'Not set'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Status</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(bill.status)}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Supplier Name</label>
                    <p className="text-lg font-semibold">{bill.suppliers?.name || 'Unknown Supplier'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bill Items */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.purchase_bill_lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.description}</TableCell>
                        <TableCell>{line.products?.name || '-'}</TableCell>
                        <TableCell className="text-right">{Number(line.quantity)}</TableCell>
                        <TableCell className="text-right">₹{Number(line.unit_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">₹{Number(line.line_total).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal:</span>
                    <span className="font-medium">₹{Number(bill.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Tax:</span>
                    <span className="font-medium">₹{Number(bill.total_tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total Amount:</span>
                    <span>₹{Number(bill.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Amount Paid:</span>
                    <span>₹{Number(bill.amount_paid).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-semibold">
                    <span>Outstanding:</span>
                    <span>₹{(Number(bill.total_amount) - Number(bill.amount_paid)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Bill not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}