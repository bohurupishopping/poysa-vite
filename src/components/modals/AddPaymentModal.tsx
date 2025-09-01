import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddPaymentModalProps {
  invoiceId: string;
  invoiceType: 'sales' | 'purchase';
  outstandingAmount: number;
  onPaymentAdded?: () => void;
  trigger?: React.ReactNode;
}

interface PaymentData {
  amount: string;
  payment_date: string;
  method: string;
  reference_number: string;
  notes: string;
}

export function AddPaymentModal({ 
  invoiceId, 
  invoiceType, 
  outstandingAmount, 
  onPaymentAdded, 
  trigger 
}: AddPaymentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PaymentData>({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentAmount = parseFloat(formData.amount);
      
      if (paymentAmount <= 0 || paymentAmount > outstandingAmount) {
        throw new Error('Invalid payment amount');
      }

      const tableName = invoiceType === 'sales' ? 'invoice_payments' : 'bill_payments';
      const foreignKey = invoiceType === 'sales' ? 'invoice_id' : 'bill_id';

      // Insert payment record  
      let paymentError;
      
      if (invoiceType === 'sales') {
        const { error } = await supabase
          .from('invoice_payments')
          .insert({
            invoice_id: invoiceId,
            amount: paymentAmount,
            payment_date: formData.payment_date,
            method: formData.method as 'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'other',
            reference_number: formData.reference_number || null,
            notes: formData.notes || null,
          });
        paymentError = error;
      } else {
        const { error } = await supabase
          .from('bill_payments')
          .insert({
            bill_id: invoiceId,
            amount: paymentAmount,
            payment_date: formData.payment_date,
            method: formData.method as 'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'other',
            reference_number: formData.reference_number || null,
            notes: formData.notes || null,
          });
        paymentError = error;
      }

      if (paymentError) throw paymentError;

      // Update the invoice/bill amount_paid
      const invoiceTable = invoiceType === 'sales' ? 'sales_invoices' : 'purchase_bills';
      
      // First get current amount_paid
      const { data: currentData } = await supabase
        .from(invoiceTable)
        .select('amount_paid, total_amount')
        .eq('id', invoiceId)
        .single();

      if (currentData) {
        const newAmountPaid = Number(currentData.amount_paid) + paymentAmount;
        const newStatus = newAmountPaid >= Number(currentData.total_amount) ? 'paid' : 
                         invoiceType === 'sales' ? 'sent' : 'submitted';

        const { error: updateError } = await supabase
          .from(invoiceTable)
          .update({ 
            amount_paid: newAmountPaid,
            status: newStatus
          })
          .eq('id', invoiceId);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Payment added successfully.",
      });

      setOpen(false);
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
      onPaymentAdded?.();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to add payment. Please try again.",
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
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for this {invoiceType === 'sales' ? 'invoice' : 'bill'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              max={outstandingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <p className="text-xs text-neutral-500">
              Outstanding: ₹{outstandingAmount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="Transaction ID, Cheque number, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}