import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
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

interface CreateBillModalProps {
  companyId: string;
  onBillCreated?: () => void;
  trigger?: React.ReactNode;
}

interface Supplier {
  id: string;
  name: string;
}

export function CreateBillModal({ companyId, onBillCreated, trigger }: CreateBillModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    bill_number: "",
    supplier_id: "",
    bill_date: new Date().toISOString().split('T')[0],
    due_date: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!open) return;

      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');
      
      if (data) setSuppliers(data);
    };

    fetchSuppliers();
  }, [open, companyId]);

  useEffect(() => {
    if (open) {
      // Generate bill number
      const generateBillNumber = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `BILL-${year}${month}-${random}`;
      };

      setFormData(prev => ({
        ...prev,
        bill_number: generateBillNumber()
      }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || !formData.bill_number.trim()) return;

    setLoading(true);
    try {
      const billData = {
        company_id: companyId,
        supplier_id: formData.supplier_id,
        bill_number: formData.bill_number.trim(),
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        subtotal: 0,
        total_tax: 0,
        total_amount: 0,
        amount_paid: 0,
        status: 'draft' as const
      };

      const { data, error } = await supabase
        .from('purchase_bills')
        .insert([billData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase bill created successfully",
      });
      
      setFormData({
        bill_number: "",
        supplier_id: "",
        bill_date: new Date().toISOString().split('T')[0],
        due_date: "",
      });
      setOpen(false);
      onBillCreated?.();

      // Navigate to bill detail page
      window.location.href = `/admin/purchases/bills/${data.id}`;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bill",
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
            <FileText className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
            <DialogDescription>
              Create a new purchase bill from a supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill_number" className="text-right">Bill # *</Label>
              <Input
                id="bill_number"
                value={formData.bill_number}
                onChange={(e) => setFormData({...formData, bill_number: e.target.value})}
                className="col-span-3"
                placeholder="Bill number"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bill_date" className="text-right">Bill Date *</Label>
              <Input
                id="bill_date"
                type="date"
                value={formData.bill_date}
                onChange={(e) => setFormData({...formData, bill_date: e.target.value})}
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
            <Button type="submit" disabled={loading || !formData.supplier_id || !formData.bill_number.trim()}>
              {loading ? "Creating..." : "Create Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}