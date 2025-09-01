import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share, Printer, Plus, Receipt, ShoppingBag, Calculator, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import PaymentRecordModal from "@/components/PaymentRecordModal";
import { SalesInvoiceService } from "@/services/salesInvoiceService";
import { PdfGeneratorService, InvoicePrintData } from "@/services/pdfGeneratorService";
import { useToast } from "@/hooks/use-toast";

// Use the InvoicePrintData type from pdfGeneratorService which matches the RPC response
type InvoiceDetailData = InvoicePrintData;

export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { toast } = useToast();
    const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);


    useEffect(() => {
        const fetchInvoice = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                // Fetch invoice data using the new RPC function
                const salesInvoiceService = SalesInvoiceService.getInstance();
                const invoiceData = await salesInvoiceService.getInvoicePrintDetails(id);

                if (invoiceData) {
                    setInvoice(invoiceData);
                } else {
                    setError('Invoice not found or no data available.');
                }
            } catch (error) {
                console.error('Error fetching invoice:', error);
                setError('Failed to load invoice details');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [id, toast]);

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'sent':
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft':
                return '✏️';
            case 'sent':
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
        if (!invoice?.lines) return {};

        const taxBreakdown: Record<string, number> = {};

        invoice.lines.forEach(line => {
            if (Array.isArray(line.taxes)) {
                line.taxes.forEach(tax => {
                    const taxName = tax.tax_rate?.name || 'Unknown Tax';
                    taxBreakdown[taxName] = (taxBreakdown[taxName] || 0) + tax.tax_amount;
                });
            }
        });

        return taxBreakdown;
    };

    const amountDue = invoice ? invoice.total_amount - invoice.amount_paid : 0;

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        
        try {
            setPdfLoading(true);
            const pdfService = PdfGeneratorService.getInstance();
            const pdf = pdfService.generateInvoicePdf(invoice);
            
            // Download the PDF
            pdf.save(`${invoice.invoice_number}.pdf`);
            
            toast({
                title: "PDF Downloaded",
                description: "Invoice PDF has been downloaded successfully",
            });
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast({
                title: "Download Failed",
                description: "Failed to download invoice PDF",
                variant: "destructive",
            });
        } finally {
            setPdfLoading(false);
        }
    };

    const handlePrintPdf = async () => {
        if (!invoice) return;
        
        try {
            setPdfLoading(true);
            const pdfService = PdfGeneratorService.getInstance();
            const pdf = pdfService.generateInvoicePdf(invoice);
            
            // Print the PDF
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl, '_blank');
            
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.print();
                };
            }
            
            toast({
                title: "Printing Started",
                description: "Invoice is being prepared for printing",
            });
        } catch (error) {
            console.error('Error printing PDF:', error);
            toast({
                title: "Print Failed",
                description: "Failed to print invoice",
                variant: "destructive",
            });
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading invoice...</span>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <div className="text-gray-500">
                        <p className="text-lg font-medium mb-2">Invoice not found</p>
                        <p className="text-sm mb-4">{error || 'The requested invoice could not be found.'}</p>
                        <Button onClick={() => navigate('/manager/sales/invoices')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Invoices
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
                            onClick={() => navigate('/manager/sales/invoices')}
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
                            <p className="text-gray-600">{invoice.invoice_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full"
                            onClick={handleDownloadPdf}
                            disabled={pdfLoading}
                        >
                            <Share className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Download PDF</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-full"
                            onClick={handlePrintPdf}
                            disabled={pdfLoading}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Header Section */}
                    <Card className="card-modern">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Receipt className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
                                    </div>
                                </div>
                                <Badge className={`px-3 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                                    <span className="mr-1">{getStatusIcon(invoice.status)}</span>
                                    <span className="hidden sm:inline">{invoice.status.replace('_', ' ').toUpperCase()}</span>
                                    <span className="sm:hidden">{invoice.status.charAt(0).toUpperCase()}</span>
                                </Badge>
                            </div>

                            <div className="text-2xl font-bold text-gray-900 mb-4">
                                {invoice.invoice_number}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">👤</span>
                                        <span className="text-sm text-gray-600">Customer:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {invoice.customer?.name || 'Unknown Customer'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">📅</span>
                                        <span className="text-sm text-gray-600">Invoice Date:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {formatDate(invoice.invoice_date)}
                                        </span>
                                    </div>
                                    {invoice.due_date && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">⏰</span>
                                            <span className="text-sm text-gray-600">Due Date:</span>
                                            <span className={`text-sm font-semibold ${new Date(invoice.due_date) < new Date() && amountDue > 0
                                                ? 'text-red-600'
                                                : 'text-gray-900'
                                                }`}>
                                                {formatDate(invoice.due_date)}
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
                                    Line Items ({invoice.lines?.length || 0})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {invoice.lines?.map((line, index) => (
                                    <div key={line.id} className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-blue-600">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    {line.product?.name && line.product.name !== line.description && (
                                                        <div className="font-semibold text-gray-900 mb-1">
                                                            {line.product.name}
                                                        </div>
                                                    )}
                                                    <div className={`${line.product?.name && line.product.name !== line.description
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
                                    Payment History ({invoice.payments?.length || 0})
                                </h3>
                            </div>

                            {!invoice.payments || invoice.payments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">💳</div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">No payments recorded yet</p>
                                    <p className="text-xs text-gray-500">Payments will appear here once recorded</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invoice.payments.map((payment, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4">
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
                                                {formatCurrency(invoice.subtotal)}
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
                                    <div className="mt-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Subtotal:</span>
                                        <span className="text-base font-semibold text-gray-900">
                                            {formatCurrency(invoice.subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Total Tax:</span>
                                        <span className="text-base font-semibold text-blue-600">
                                            {formatCurrency(invoice.total_tax)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatCurrency(invoice.total_amount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-medium text-gray-900">Amount Paid:</span>
                                        <span className="text-base font-semibold text-green-600">
                                            {formatCurrency(invoice.amount_paid)}
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
                invoice && (
                    <PaymentRecordModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        amountDue={amountDue}
                        onPaymentRecorded={() => {
                            setShowPaymentModal(false);
                            // Refresh invoice data
                            window.location.reload();
                        }}
                    />
                )
            }
        </div >
    );
}
