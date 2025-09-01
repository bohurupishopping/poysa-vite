import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Customer, Product } from "@/integrations/supabase/manager-types";
import { useToast } from "@/hooks/use-toast";
import { InvoiceData, InvoiceLine } from "@/components/create-invoice/types";
import { CreateInvoiceHeader } from "@/components/create-invoice/CreateInvoiceHeader";
import { InvoiceDetailsForm } from "@/components/create-invoice/InvoiceDetailsForm";
import { InvoiceLineItemsTable } from "@/components/create-invoice/InvoiceLineItemsTable";
import { InvoiceTotalsSummary } from "@/components/create-invoice/InvoiceTotalsSummary";
import { SalesInvoiceService } from "@/services/salesInvoiceService";
import { CreateCustomerForm } from "@/components/forms/CreateCustomerForm";
import { SearchCustomerModal } from "@/components/modals/SearchCustomerModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateInvoice() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [showSearchCustomer, setShowSearchCustomer] = useState(false);
    const [taxRates, setTaxRates] = useState<{
        igst_18: string | null;
        cgst_9: string | null;
        sgst_9: string | null;
    }>({
        igst_18: null,
        cgst_9: null,
        sgst_9: null
    });

    // Calculate initial due date (20 days from today, matching Flutter app)
    const getInitialDueDate = () => {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 20);
        return dueDate.toISOString().split('T')[0];
    };

    const [invoice, setInvoice] = useState<InvoiceData>({
        customer_id: "",
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: getInitialDueDate(),
        place_of_supply: "",
        company_state: "", // Will be fetched from company details
        notes: "",
        gstr1_invoice_type: "REGULAR", // Default to REGULAR as per Flutter model
        lines: [],
        subtotal: 0,
        total_igst: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_tax: 0,
        total_amount: 0
    });

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Function to get or create standard tax rates
    const getOrCreateTaxRates = async (companyId: string) => {
        try {
            // First, try to get existing tax rates
            const { data: existingRates, error: fetchError } = await supabase
                .from('tax_rates')
                .select('id, name, rate')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .in('name', ['IGST', 'CGST', 'SGST']);

            if (fetchError) throw fetchError;

            const rates = {
                igst_18: null as string | null,
                cgst_9: null as string | null,
                sgst_9: null as string | null
            };

            // Check existing rates
            existingRates?.forEach(rate => {
                if (rate.name === 'IGST' && rate.rate === 18) {
                    rates.igst_18 = rate.id;
                } else if (rate.name === 'CGST' && rate.rate === 9) {
                    rates.cgst_9 = rate.id;
                } else if (rate.name === 'SGST' && rate.rate === 9) {
                    rates.sgst_9 = rate.id;
                }
            });

            // Create missing tax rates
            const ratesToCreate = [];
            if (!rates.igst_18) {
                ratesToCreate.push({ company_id: companyId, name: 'IGST', rate: 18 });
            }
            if (!rates.cgst_9) {
                ratesToCreate.push({ company_id: companyId, name: 'CGST', rate: 9 });
            }
            if (!rates.sgst_9) {
                ratesToCreate.push({ company_id: companyId, name: 'SGST', rate: 9 });
            }

            if (ratesToCreate.length > 0) {
                const { data: newRates, error: createError } = await supabase
                    .from('tax_rates')
                    .insert(ratesToCreate)
                    .select('id, name, rate');

                if (createError) throw createError;

                // Map the new rates
                newRates?.forEach(rate => {
                    if (rate.name === 'IGST' && rate.rate === 18) {
                        rates.igst_18 = rate.id;
                    } else if (rate.name === 'CGST' && rate.rate === 9) {
                        rates.cgst_9 = rate.id;
                    } else if (rate.name === 'SGST' && rate.rate === 9) {
                        rates.sgst_9 = rate.id;
                    }
                });
            }

            return rates;
        } catch (error) {
            console.error('Error getting/creating tax rates:', error);
            return {
                igst_18: null,
                cgst_9: null,
                sgst_9: null
            };
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.company_id) return;

            try {
                const [customersRes, productsRes, companyRes, taxRatesData] = await Promise.all([
                    supabase
                        .from('customers')
                        .select('*')
                        .eq('company_id', profile.company_id)
                        .is('deleted_at', null),
                    supabase
                        .from('products')
                        .select('*')
                        .eq('company_id', profile.company_id)
                        .eq('is_active', true)
                        .is('deleted_at', null),
                    supabase
                        .from('companies')
                        .select('state')
                        .eq('id', profile.company_id)
                        .single(),
                    getOrCreateTaxRates(profile.company_id)
                ]);

                if (customersRes.error) throw customersRes.error;
                if (productsRes.error) throw productsRes.error;
                if (companyRes.error) throw companyRes.error;

                setCustomers(customersRes.data || []);
                setProducts(productsRes.data || []);
                setTaxRates(taxRatesData);

                // Set company state for tax calculations
                setInvoice(prev => ({
                    ...prev,
                    company_state: companyRes.data?.state || ""
                }));
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load form data",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.company_id, toast]);

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setSelectedCustomer(customer || null);

        // Auto-fill place of supply from customer details (matching Flutter logic)
        if (customer?.details && typeof customer.details === 'object') {
            const details = customer.details as any;
            // Try multiple possible state field names to match Flutter app
            const state = details.state || details.billing_state || details.customerDetails?.state || "";
            setInvoice(prev => ({
                ...prev,
                customer_id: customerId,
                place_of_supply: state
            }));
        } else {
            setInvoice(prev => ({
                ...prev,
                customer_id: customerId
            }));
        }
    };

    const handleInvoiceDateChange = (date: string) => {
        setInvoice(prev => {
            // Auto-set due date to 20 days from invoice date (matching Flutter app)
            let dueDate = prev.due_date;
            if (!dueDate && date) {
                const invoiceDate = new Date(date);
                const dueDateObj = new Date(invoiceDate);
                dueDateObj.setDate(dueDateObj.getDate() + 20);
                dueDate = dueDateObj.toISOString().split('T')[0];
            }

            return {
                ...prev,
                invoice_date: date,
                due_date: dueDate
            };
        });
    };

    // Function to calculate GST based on place of supply
    const calculateTax = (lineTotal: number, companyState: string, placeOfSupply: string) => {
        // Default GST rate - you might want to make this configurable per product
        const gstRate = 18; // 18% GST

        // Inter-state transaction (IGST applies)
        if (companyState !== placeOfSupply) {
            return {
                igst_rate: gstRate,
                igst_amount: (lineTotal * gstRate) / 100,
                cgst_rate: 0,
                cgst_amount: 0,
                sgst_rate: 0,
                sgst_amount: 0,
                total_tax_amount: (lineTotal * gstRate) / 100
            };
        } else {
            // Intra-state transaction (CGST + SGST applies)
            const halfRate = gstRate / 2;
            const halfAmount = (lineTotal * halfRate) / 100;
            return {
                igst_rate: 0,
                igst_amount: 0,
                cgst_rate: halfRate,
                cgst_amount: halfAmount,
                sgst_rate: halfRate,
                sgst_amount: halfAmount,
                total_tax_amount: halfAmount * 2
            };
        }
    };

    const addLine = () => {
        const newLine: InvoiceLine = {
            id: `temp-${Date.now()}`,
            product_id: "",
            description: "",
            quantity: 1,
            unit_price: 0,
            hsn_sac_code: "",
            line_total: 0,
            igst_rate: 0,
            igst_amount: 0,
            cgst_rate: 0,
            cgst_amount: 0,
            sgst_rate: 0,
            sgst_amount: 0,
            total_tax_amount: 0
        };

        setInvoice(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    };

    const removeLine = (lineId: string) => {
        setInvoice(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== lineId)
        }));
        calculateTotals();
    };

    const updateLine = (lineId: string, field: keyof InvoiceLine, value: any) => {
        setInvoice(prev => ({
            ...prev,
            lines: prev.lines.map(line => {
                if (line.id === lineId) {
                    const updatedLine = { ...line, [field]: value };

                    // Auto-populate product details
                    if (field === 'product_id' && value) {
                        const product = products.find(p => p.id === value);
                        if (product) {
                            updatedLine.description = product.description || product.name;
                            updatedLine.unit_price = product.sale_price || 0;
                            updatedLine.hsn_sac_code = (product as any).hsn_sac_code || ''; // Auto-populate HSN/SAC code
                        }
                    }

                    // Calculate line total
                    updatedLine.line_total = updatedLine.quantity * updatedLine.unit_price;

                    // Calculate tax automatically based on place of supply
                    if (updatedLine.line_total > 0 && prev.company_state && prev.place_of_supply) {
                        const taxCalc = calculateTax(updatedLine.line_total, prev.company_state, prev.place_of_supply);
                        updatedLine.igst_rate = taxCalc.igst_rate;
                        updatedLine.igst_amount = taxCalc.igst_amount;
                        updatedLine.cgst_rate = taxCalc.cgst_rate;
                        updatedLine.cgst_amount = taxCalc.cgst_amount;
                        updatedLine.sgst_rate = taxCalc.sgst_rate;
                        updatedLine.sgst_amount = taxCalc.sgst_amount;
                        updatedLine.total_tax_amount = taxCalc.total_tax_amount;
                    }

                    return updatedLine;
                }
                return line;
            })
        }));

        // Recalculate totals after a short delay to ensure state is updated
        setTimeout(calculateTotals, 0);
    };

    const calculateTotals = () => {
        setInvoice(prev => {
            const subtotal = prev.lines.reduce((sum, line) => sum + line.line_total, 0);
            const total_igst = prev.lines.reduce((sum, line) => sum + line.igst_amount, 0);
            const total_cgst = prev.lines.reduce((sum, line) => sum + line.cgst_amount, 0);
            const total_sgst = prev.lines.reduce((sum, line) => sum + line.sgst_amount, 0);
            const total_tax = total_igst + total_cgst + total_sgst;
            const total_amount = subtotal + total_tax;

            return {
                ...prev,
                subtotal,
                total_igst,
                total_cgst,
                total_sgst,
                total_tax,
                total_amount
            };
        });
    };

    const generateInvoiceNumber = async () => {
        if (!profile?.company_id) {
            // Fallback if no company_id
            return `INV-${Date.now()}`;
        }

        try {
            // Use the database function to generate proper invoice number
            const { data, error } = await supabase
                .rpc('generate_next_document_number', {
                    p_company_id: profile.company_id,
                    p_document_type: 'SALES_INVOICE',
                    p_date: new Date().toISOString().split('T')[0]
                });

            if (error) {
                console.error('Error generating invoice number:', error);
                // Fallback to timestamp format
                return `INV-${Date.now()}`;
            }

            return data;
        } catch (error) {
            console.error('Error calling generate_next_document_number:', error);
            // Fallback to timestamp format
            return `INV-${Date.now()}`;
        }
    };

    const handleCreateCustomerSuccess = async () => {
        setShowCreateCustomer(false);
        // Refresh customers list
        if (profile?.company_id) {
            try {
                const { data: customersRes, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .is('deleted_at', null);
                
                if (!error) {
                    setCustomers(customersRes || []);
                }
            } catch (error) {
                console.error('Error refreshing customers:', error);
            }
        }
    };

    const saveInvoice = async (status: 'draft' | 'sent') => {
        if (!profile?.company_id) return;

        if (!invoice.customer_id) {
            toast({
                title: "Error",
                description: "Please select a customer",
                variant: "destructive"
            });
            return;
        }

        if (invoice.lines.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one line item",
                variant: "destructive"
            });
            return;
        }

        // Validate line items
        for (const line of invoice.lines) {
            if (!line.description.trim()) {
                toast({
                    title: "Error",
                    description: "All line items must have a description",
                    variant: "destructive"
                });
                return;
            }
            if (line.quantity <= 0) {
                toast({
                    title: "Error",
                    description: "All line items must have a positive quantity",
                    variant: "destructive"
                });
                return;
            }
            if (line.unit_price < 0) {
                toast({
                    title: "Error",
                    description: "Unit price cannot be negative",
                    variant: "destructive"
                });
                return;
            }
        }

        setSaving(true);

        try {
            const invoiceNumber = await generateInvoiceNumber();

            // Prepare lines data with tax details for the RPC function
            const linesData = invoice.lines.map(line => {
                const lineTaxes = [];

                // Add IGST tax if inter-state
                if (line.igst_amount > 0 && taxRates.igst_18) {
                    lineTaxes.push({
                        tax_rate_id: taxRates.igst_18,
                        tax_amount: line.igst_amount
                    });
                }

                // Add CGST tax if intra-state
                if (line.cgst_amount > 0 && taxRates.cgst_9) {
                    lineTaxes.push({
                        tax_rate_id: taxRates.cgst_9,
                        tax_amount: line.cgst_amount
                    });
                }

                // Add SGST tax if intra-state
                if (line.sgst_amount > 0 && taxRates.sgst_9) {
                    lineTaxes.push({
                        tax_rate_id: taxRates.sgst_9,
                        tax_amount: line.sgst_amount
                    });
                }

                return {
                    product_id: line.product_id || null,
                    description: line.description,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    line_total: line.line_total,
                    hsn_sac_code: line.hsn_sac_code || null,
                    line_taxes: lineTaxes
                };
            });

            // Use the SalesInvoiceService to submit the invoice via RPC with fallback
            const invoiceService = SalesInvoiceService.getInstance();
            const invoiceId = await invoiceService.submitInvoice(
                profile.company_id,
                invoice.customer_id,
                invoiceNumber,
                invoice.invoice_date,
                linesData,
                undefined, // existingInvoiceId (for new invoices)
                invoice.due_date,
                invoice.place_of_supply,
                status
            );

            toast({
                title: "Success",
                description: `Invoice ${status === 'draft' ? 'saved as draft' : 'created and sent'} successfully`,
            });

            navigate('/manager/sales/invoices');
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast({
                title: "Error",
                description: "Failed to save invoice. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading invoice data...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <CreateInvoiceHeader
                onSaveDraft={() => saveInvoice('draft')}
                onSaveAndSend={() => saveInvoice('sent')}
                saving={saving}
            />

            <div className="grid gap-6 md:gap-8">
                <InvoiceDetailsForm
                    invoice={invoice}
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    handleCustomerChange={handleCustomerChange}
                    handleInvoiceDateChange={handleInvoiceDateChange}
                    setInvoice={setInvoice}
                    calculateTax={calculateTax}
                    calculateTotals={calculateTotals}
                    onOpenCreateCustomer={() => setShowCreateCustomer(true)}
                    onOpenSearchCustomer={() => setShowSearchCustomer(true)}
                />

                <InvoiceLineItemsTable
                    invoice={invoice}
                    products={products}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                />

                <InvoiceTotalsSummary invoice={invoice} />
            </div>

            <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Customer</DialogTitle>
                    </DialogHeader>
                    <CreateCustomerForm
                        onSuccess={handleCreateCustomerSuccess}
                        onCancel={() => setShowCreateCustomer(false)}
                    />
                </DialogContent>
            </Dialog>

            <SearchCustomerModal
                open={showSearchCustomer}
                onOpenChange={setShowSearchCustomer}
                onSelectCustomer={(customer) => {
                    handleCustomerChange(customer.id);
                    setShowSearchCustomer(false);
                }}
            />
        </div>
    );
}
