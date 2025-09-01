import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CreditCard, Send, Ban, Plus, ArrowLeft, User, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface BillDetail {
    id: string;
    bill_number: string | null;
    bill_date: string;
    due_date: string | null;
    total_amount: number;
    amount_paid: number;
    status: string;
    suppliers: { name: string; details: any } | null;
    purchase_bill_lines: Array<{
        id: string;
        description: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        products: { name: string } | null;
    }>;
}

interface Payment {
    id: string;
    payment_date: string;
    amount: number;
    method: string;
    reference_number: string | null;
    notes: string | null;
}

export default function BillDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bill, setBill] = useState<BillDetail | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBillDetail = async () => {
            if (!id) return;

            try {
                const { data: billData } = await supabase
                    .from('purchase_bills')
                    .select(`
            *,
            suppliers (name, details),
            purchase_bill_lines (
              id,
              description,
              quantity,
              unit_price,
              line_total,
              products (name)
            )
          `)
                    .eq('id', id)
                    .single();

                const { data: paymentsData } = await supabase
                    .from('bill_payments')
                    .select('*')
                    .eq('bill_id', id)
                    .order('payment_date', { ascending: false });

                if (billData) setBill(billData);
                if (paymentsData) setPayments(paymentsData);
            } catch (error) {
                console.error('Error fetching bill detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBillDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading bill details...</span>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill not found</h3>
                    <p className="text-gray-500">The bill you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const remainingAmount = Number(bill.total_amount) - Number(bill.amount_paid);

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin/purchases/bills')}
                        className="h-10 px-4 rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Bills
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill {bill.bill_number || 'No Number'}</h1>
                        <p className="text-gray-600">View and manage bill details</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-10 px-4 rounded-full"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Mark as Approved
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 px-4 rounded-full text-red-600 hover:text-red-700"
                    >
                        <Ban className="mr-2 h-4 w-4" />
                        Mark as Void
                    </Button>
                </div>
            </div>

            {/* Bill Header */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Supplier Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                                <p className="text-sm text-gray-500">Supplier Name</p>
                                <p className="font-medium text-gray-900">{bill.suppliers?.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Bill Date</p>
                                <p className="font-medium text-gray-900">{new Date(bill.bill_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                                <p className="text-sm text-gray-500">Due Date</p>
                                <p className="font-medium text-gray-900">{bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'Not set'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            Payment Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Amount</span>
                            <span className="font-semibold text-gray-900">₹{Number(bill.total_amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Amount Paid</span>
                            <span className="font-semibold text-green-600">₹{Number(bill.amount_paid).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-sm text-gray-500">Remaining</span>
                            <span className="font-semibold text-orange-600">₹{remainingAmount.toLocaleString()}</span>
                        </div>
                        <div className="pt-2">
                            <Badge
                                variant={bill.status === 'paid' ? 'default' : 'secondary'}
                                className="rounded-full"
                            >
                                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bill Lines */}
            <div className="bg-white rounded-lg border shadow-sm mb-8">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Bill Items</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed breakdown of bill items</p>
                </div>
                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-center">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bill.purchase_bill_lines.map((line) => (
                                <TableRow key={line.id}>
                                    <TableCell className="font-medium">{line.description}</TableCell>
                                    <TableCell>{line.products?.name || '-'}</TableCell>
                                    <TableCell className="text-center">{Number(line.quantity)}</TableCell>
                                    <TableCell className="text-right">₹{Number(line.unit_price).toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-semibold">₹{Number(line.line_total).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Payments Section */}
            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                        <p className="text-sm text-gray-600 mt-1">Track all payments made for this bill</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payment
                    </Button>
                </div>
                <div className="p-0">
                    {payments.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right font-semibold">₹{Number(payment.amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-full">
                                                {payment.method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{payment.reference_number || '-'}</TableCell>
                                        <TableCell>{payment.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No payments recorded</p>
                            <p className="text-sm text-gray-400 mt-1">Payments will appear here once recorded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}