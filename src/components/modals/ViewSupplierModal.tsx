import { useState, useEffect } from "react";
import { Eye, Truck, Mail, Phone, MapPin, CreditCard } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

interface ViewSupplierModalProps {
  supplierId: string;
  trigger?: React.ReactNode;
}

interface SupplierDetail {
  id: string;
  name: string;
  details: any;
}

interface SupplierStats {
  total_bills: number;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
}

export function ViewSupplierModal({ supplierId, trigger }: ViewSupplierModalProps) {
  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSupplierDetail = async () => {
    if (!supplierId) return;
    
    setLoading(true);
    try {
      // Fetch supplier details
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();
      
      // Fetch supplier stats
      const { data: billStats } = await supabase
        .from('purchase_bills')
        .select('total_amount, amount_paid')
        .eq('supplier_id', supplierId);
      
      if (supplierData) setSupplier(supplierData);
      
      if (billStats) {
        const totalAmount = billStats.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
        const amountPaid = billStats.reduce((sum, bill) => sum + Number(bill.amount_paid), 0);
        
        setStats({
          total_bills: billStats.length,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          outstanding_amount: totalAmount - amountPaid,
        });
      }
    } catch (error) {
      console.error('Error fetching supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSupplierDetail();
    }
  }, [open, supplierId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Supplier Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this supplier
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : supplier ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Supplier Name</label>
                    <p className="text-sm font-semibold">{supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Company Name</label>
                    <p className="text-sm">{supplier.details?.company_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </label>
                    <p className="text-sm">{supplier.details?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </label>
                    <p className="text-sm">{supplier.details?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Contact Person</label>
                    <p className="text-sm">{supplier.details?.contact_person || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">GST Number</label>
                    <p className="text-sm font-mono">{supplier.details?.gst_number || 'Not provided'}</p>
                  </div>
                </div>
                {supplier.details?.address && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Address
                    </label>
                    <p className="text-sm">{supplier.details.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supplier Statistics */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Transaction Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Total Bills</label>
                      <p className="text-2xl font-bold">{stats.total_bills}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Total Amount</label>
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{stats.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Amount Paid</label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{stats.amount_paid.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Outstanding</label>
                      <p className="text-2xl font-bold text-orange-600">
                        ₹{stats.outstanding_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Supplier not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}