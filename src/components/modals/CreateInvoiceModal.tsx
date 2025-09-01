import { useState, useEffect } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateInvoiceModalProps {
  companyId: string;
  onInvoiceCreated?: () => void;
  trigger?: React.ReactNode;
}

interface Customer {
  id: string;
  name: string;
}

export function CreateInvoiceModal({ companyId, onInvoiceCreated, trigger }: CreateInvoiceModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    invoice_number: "",
    customer_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!open) return;

      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');
      
      if (data) setCustomers(data);
    };

    fetchCustomers();
  }, [open, companyId]);

  useEffect(() => {
    if (open) {
      // Generate invoice number
      const generateInvoiceNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `INV-${year}${month}-${random}`;
      };

      setFormData(prev => ({
        ...prev,
        invoice_number: generateInvoiceNumber()
      }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.invoice_number.trim()) return;

    setLoading(true);
    try {
      const invoiceData = {
        company_id: companyId,
        customer_id: formData.customer_id,
        invoice_number: formData.invoice_number.trim(),
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        subtotal: 0,
        total_tax: 0,
        total_amount: 0,
        amount_paid: 0,
        status: 'draft' as const
      };

      const { data, error } = await supabase
        .from('sales_invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      setFormData({
        invoice_number: "",
        customer_id: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: "",
      });
      setOpen(false);
      onInvoiceCreated?.();

      // Navigate to invoice detail page
      window.location.href = `/admin/sales/invoices/${data.id}`;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="brand">
            <Receipt className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create a new sales invoice for a customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice_number" className="text-right">Invoice # *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                className="col-span-3"
                placeholder="Invoice number"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice_date" className="text-right">Invoice Date *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due_date" className="text-right">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.customer_id || !formData.invoice_number.trim()}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}