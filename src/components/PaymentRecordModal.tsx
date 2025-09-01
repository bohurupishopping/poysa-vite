import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string;
    invoiceNumber: string;
    amountDue: number;
    onPaymentRecorded: () => void;
}

export default function PaymentRecordModal({
    isOpen,
    onClose,
    invoiceId,
    invoiceNumber,
    amountDue,
    onPaymentRecorded
}: PaymentRecordModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: amountDue.toString(),
        payment_date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference_number: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid payment amount",
                variant: "destructive"
            });
            return;
        }

        if (parseFloat(formData.amount) > amountDue) {
            toast({
                title: "Amount Too High",
                description: "Payment amount cannot exceed the amount due",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('invoice_payments')
                .insert({
                    invoice_id: invoiceId,
                    amount: parseFloat(formData.amount),
                    payment_date: formData.payment_date,
                    method: formData.method as any,
                    reference_number: formData.reference_number || null,
                    notes: formData.notes || null
                });

            if (error) throw error;

            toast({
                title: "Payment Recorded",
                description: `Payment of ₹${parseFloat(formData.amount).toFixed(2)} has been recorded successfully`
            });

            onPaymentRecorded();
            onClose();

            // Reset form
            setFormData({
                amount: amountDue.toString(),
                payment_date: new Date().toISOString().split('T')[0],
                method: 'bank_transfer',
                reference_number: '',
                notes: ''
            });

        } catch (error) {
            console.error('Error recording payment:', error);
            toast({
                title: "Error",
                description: "Failed to record payment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <p className="text-sm text-gray-600">
                        Invoice: {invoiceNumber} • Amount Due: {formatCurrency(amountDue)}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={amountDue}
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="Enter payment amount"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Payment Date</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            value={formData.payment_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select
                            value={formData.method}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference_number">Reference Number (Optional)</Label>
                        <Input
                            id="reference_number"
                            value={formData.reference_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                            placeholder="Transaction ID, cheque number, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this payment"
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}