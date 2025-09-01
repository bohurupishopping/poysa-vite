import { useState, useEffect } from "react";
import { Eye, Users, Mail, Phone, MapPin, CreditCard } from "lucide-react";
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

interface ViewCustomerModalProps {
  customerId: string;
  trigger?: React.ReactNode;
}

interface CustomerDetail {
  id: string;
  name: string;
  details: any;
}

interface CustomerStats {
  total_invoices: number;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
}

export function ViewCustomerModal({ customerId, trigger }: ViewCustomerModalProps) {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCustomerDetail = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      // Fetch customer details
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      // Fetch customer stats
      const { data: invoiceStats } = await supabase
        .from('sales_invoices')
        .select('total_amount, amount_paid')
        .eq('customer_id', customerId);
      
      if (customerData) setCustomer(customerData);
      
      if (invoiceStats) {
        const totalAmount = invoiceStats.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        const amountPaid = invoiceStats.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
        
        setStats({
          total_invoices: invoiceStats.length,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          outstanding_amount: totalAmount - amountPaid,
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomerDetail();
    }
  }, [open, customerId]);

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
            <Users className="h-5 w-5" />
            Customer Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this customer
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Customer Name</label>
                    <p className="text-sm font-semibold">{customer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Company Name</label>
                    <p className="text-sm">{customer.details?.company_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </label>
                    <p className="text-sm">{customer.details?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </label>
                    <p className="text-sm">{customer.details?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Contact Person</label>
                    <p className="text-sm">{customer.details?.contact_person || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">GST Number</label>
                    <p className="text-sm font-mono">{customer.details?.gst_number || 'Not provided'}</p>
                  </div>
                </div>
                {customer.details?.address && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Address
                    </label>
                    <p className="text-sm">{customer.details.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Statistics */}
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
                      <label className="text-sm font-medium text-neutral-600">Total Invoices</label>
                      <p className="text-2xl font-bold">{stats.total_invoices}</p>
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
            <div className="text-neutral-500">Customer not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}