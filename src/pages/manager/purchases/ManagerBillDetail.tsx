import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share, Printer, Plus, Receipt, ShoppingBag, Calculator, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BillStatus } from "@/integrations/supabase/manager-types";
import BillPaymentRecordModal from "@/components/BillPaymentRecordModal";
import { purchaseBillService } from "@/services/purchaseBillService";

// Local type to handle the actual data structure from the query
type BillDetailData = {
    id: string;
    company_id: string;
    supplier_id: string;
    bill_number: string;
    bill_date: string;
    due_date?: string;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    amount_paid: number;
    status: BillStatus;
    place_of_supply?: string;
    supplier_name?: string;
    lines?: Array<{
        id: string;
        bill_id: string;
        product_id?: string;
        description: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        hsn_sac_code?: string;
        product_name?: string;
        taxes?: Array<{
            id: string;
            bill_line_id: string;
            tax_rate_id: string;
            tax_amount: number;
            tax_name?: string;
            tax_rate?: number;
        }>;
    }>;
    payments?: Array<{
        id: string;
        bill_id: string;
        amount: number;
        payment_date: string;
        method: 'cash' | 'bank_transfer' | 'cheque' | 'other';
        reference_number?: string;
        notes?: string;
        created_at: string;
    }>;
};

export default function ManagerBillDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [bill, setBill] = useState<BillDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const transformBillData = (data: any[]): BillDetailData | null => {
        if (!data || data.length === 0) return null;

        const firstRecord = data[0];

        const bill: BillDetailData = {
            id: firstRecord.bill_id,
            company_id: firstRecord.company_id,
            supplier_id: firstRecord.supplier_id,
            bill_number: firstRecord.bill_number,
            bill_date: firstRecord.bill_date,
            due_date: firstRecord.due_date,
            subtotal: firstRecord.subtotal,
            total_tax: firstRecord.total_tax,
            total_amount: firstRecord.total_amount,
            amount_paid: firstRecord.amount_paid,
            status: firstRecord.status as BillStatus,
            supplier_name: firstRecord.supplier_name,
            place_of_supply: firstRecord.place_of_supply,
            lines: [],
            payments: []
        };

        const lineMap = new Map<string, BillDetailData['lines'][0]>();
        const paymentMap = new Map<string, BillDetailData['payments'][0]>();

        data.forEach(record => {
            // Process lines
            if (record.line_id && !lineMap.has(record.line_id)) {
                lineMap.set(record.line_id, {
                    id: record.line_id,
                    bill_id: record.bill_id,
                    product_id: record.product_id,
                    description: record.description,
                    quantity: record.quantity,
                    unit_price: record.unit_price,
                    line_total: record.line_total,
                    hsn_sac_code: record.hsn_sac_code,
                    product_name: record.product_name,
                    taxes: []
                });
            }

            // Add taxes to lines
            if (record.line_id && record.tax_id) {
                const currentLine = lineMap.get(record.line_id);
                if (currentLine && !currentLine.taxes?.some(t => t.id === record.tax_id)) {
                    currentLine.taxes?.push({
                        id: record.tax_id,
                        bill_line_id: record.line_id,
                        tax_rate_id: record.tax_rate_id,
                        tax_amount: record.tax_amount,
                        tax_name: record.tax_name,
                        tax_rate: record.tax_rate
                    });
                }
            }

            // Process payments
            if (record.payment_id && !paymentMap.has(record.payment_id)) {
                paymentMap.set(record.payment_id, {
                    id: record.payment_id,
                    bill_id: record.bill_id,
                    amount: record.payment_amount,
                    payment_date: record.payment_date,
                    method: record.payment_method as any,
                    reference_number: record.reference_number,
                    notes: record.payment_notes,
                    created_at: record.payment_date // Use payment date as created_at
                });
            }
        });

        bill.lines = Array.from(lineMap.values());
        bill.payments = Array.from(paymentMap.values());

        return bill;
    };

    useEffect(() => {
        const fetchBill = async () => {
            if (!id || !profile?.company_id) return;

            try {
                setLoading(true);
                setError(null);

                const rpcData = await purchaseBillService.getPurchaseBillWithDetails(id);

                if (rpcData && rpcData.length > 0) {
                    const transformed = transformBillData(rpcData);
                    setBill(transformed);
                } else {
                    setError('Bill not found or no data available.');
                }
            } catch (error) {
                console.error('Error fetching bill:', error);
                setError('Failed to load bill details');
            } finally {
                setLoading(false);
            }
        };

        fetchBill();
    }, [id, profile?.company_id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: BillStatus) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'submitted':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partially_paid':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'void':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: BillStatus) => {
        switch (status) {
            case 'draft':
                return '✏️';
            case 'submitted':
                return '📤';
            case 'paid':
                return '✅';
            case 'partially_paid':
                return '⏳';
            case 'void':
                return '❌';
            default:
                return '📄';
        }
    };

    const calculateTaxBreakdown = () => {
        if (!bill?.lines) return {};

        const taxBreakdown: Record<string, number> = {};

        bill.lines.forEach(line => {
            if (Array.isArray(line.taxes)) {
                line.taxes.forEach(tax => {
                    const taxName = tax.tax_name || 'Unknown Tax';
                    taxBreakdown[taxName] = (taxBreakdown[taxName] || 0) + tax.tax_amount;
                });
            }
        });

        return taxBreakdown;
    };

    const amountDue = bill ? bill.total_amount - bill.amount_paid : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading bill...</span>
            </div>
        );
    }

    if (error || !bill) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <div className="text-gray-500">
                        <p className="text-lg font-medium mb-2">Bill not found</p>
                        <p className="text-sm mb-4">{error || 'The requested bill could not be found.'}</p>
                        <Button onClick={() => navigate('/manager/purchases/bills')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Bills
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const taxBreakdown = calculateTaxBreakdown();

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/manager/purchases/bills')}
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Bill Details</h1>
                            <p className="text-gray-600">{bill.bill_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-full">
                            <Share className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full">
                            <Printer className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Bill Header Section */}
                    <Card className="card-modern">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Receipt className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Bill Details</h3>
                                    </div>
                                </div>
                                <Badge className={`px-3 py-1 rounded-full ${getStatusColor(bill.status)}`}>
                                    <span className="mr-1">{getStatusIcon(bill.status)}</span>
                                    <span className="hidden sm:inline">{bill.status.replace('_', ' ').toUpperCase()}</span>
                                    <span className="sm:hidden">{bill.status.charAt(0).toUpperCase()}</span>
                                </Badge>
                            </div>

                            <div className="text-2xl font-bold text-gray-900 mb-4">
                                {bill.bill_number}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">🏭</span>
                                        <span className="text-sm text-gray-600">Supplier:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {bill.supplier_name || 'Unknown Supplier'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">📅</span>
                                        <span className="text-sm text-gray-600">Bill Date:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatDate(bill.bill_date)}
                                        </span>
                                    </div>
                                    {bill.due_date && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">⏰</span>
                                            <span className="text-sm text-gray-600">Due Date:</span>
                                            <span className={`text-sm font-semibold ${new Date(bill.due_date) < new Date() && amountDue > 0
                                                ? 'text-red-600'
                                                : 'text-gray-900'
                                                }`}>
                                                {formatDate(bill.due_date)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items Section */}
                    <Card className="card-modern">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Line Items ({bill.lines?.length || 0})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {bill.lines?.map((line, index) => (
                                    <div key={line.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-blue-600">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    {line.product_name && line.product_name !== line.description && (
                                                        <div className="font-semibold text-gray-900 mb-1">
                                                            {line.product_name}
                                                        </div>
                                                    )}
                                                    <div className={`${line.product_name && line.product_name !== line.description
                                                        ? 'text-sm text-gray-600'
                                                        : 'font-semibold text-gray-900'
                                                        }`}>
                                                        {line.description}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <span>📦</span>
                                                            <span>
                                                                {line.quantity} × {formatCurrency(line.unit_price)}
                                                            </span>
                                                        </div>
                                                        {Array.isArray(line.taxes) && line.taxes.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span>🧮</span>
                                                                <span>
                                                                    Tax: {formatCurrency(
                                                                        line.taxes.reduce((sum, tax) => sum + tax.tax_amount, 0)
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right sm:text-left">
                                                <div className="text-lg font-bold text-green-600">
                                                    {formatCurrency(line.line_total)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History Section */}
                    <Card className="card-modern">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <CreditCard className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Payment History ({bill.payments?.length || 0})
                                </h3>
                            </div>

                            {!bill.payments || bill.payments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">💳</div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">No payments recorded yet</p>
                                    <p className="text-xs text-gray-500">Payments will appear here once recorded</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bill.payments.map((payment) => (
                                        <div key={payment.id} className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <CreditCard className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {formatDate(payment.payment_date)}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            {payment.method.replace('_', ' ')}
                                                            {payment.reference_number && (
                                                                <span className="ml-2">• Ref: {payment.reference_number}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Tax Breakdown Section */}
                    {Object.keys(taxBreakdown).length > 0 && (
                        <Card className="card-modern">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Calculator className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Tax Breakdown</h3>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-900">Subtotal:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(bill.subtotal)}
                                            </span>
                                        </div>
                                        <Separator />
                                        {Object.entries(taxBreakdown).map(([taxName, amount]) => (
                                            <div key={taxName} className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">{taxName}:</span>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {formatCurrency(amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Summary Section */}
                    <Card className="card-modern">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Wallet className="h-5 w-5 text-green-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Subtotal:</span>
                                        <span className="text-base font-semibold text-gray-900">
                                            {formatCurrency(bill.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Total Tax:</span>
                                        <span className="text-base font-semibold text-blue-600">
                                            {formatCurrency(bill.total_tax)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatCurrency(bill.total_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Amount Paid:</span>
                                        <span className="text-base font-semibold text-green-600">
                                            {formatCurrency(bill.amount_paid)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className={`rounded-lg p-3 ${amountDue > 0
                                        ? 'bg-yellow-50 border border-yellow-200'
                                        : 'bg-green-50 border border-green-200'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span>{amountDue > 0 ? '⏳' : '✅'}</span>
                                                <span className="text-lg font-bold text-gray-900">Amount Due:</span>
                                            </div>
                                            <span className={`text-xl font-bold ${amountDue > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {formatCurrency(amountDue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Floating Action Button for Recording Payment */}
            {
                amountDue > 0 && (
                    <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8">
                        <Button
                            size="lg"
                            className="rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => setShowPaymentModal(true)}
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            <span className="hidden sm:inline">Record Payment</span>
                            <span className="sm:hidden">Pay</span>
                        </Button>
                    </div>
                )
            }

            {/* Payment Record Modal */}
            {
                bill && (
                    <BillPaymentRecordModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        billId={bill.id}
                        billNumber={bill.bill_number}
                        amountDue={amountDue}
                        onPaymentRecorded={() => {
                            setShowPaymentModal(false);
                            // Refresh bill data
                            window.location.reload();
                        }}
                    />
                )
            }
        </div>
    );
}
