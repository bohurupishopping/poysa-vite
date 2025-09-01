import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Customer, Product } from "@/integrations/supabase/manager-types";
import { useToast } from "@/hooks/use-toast";
import { EstimateData, EstimateLine, EstimateStatus } from "@/components/create-estimate/types";
import { CreateEstimateHeader } from "@/components/create-estimate/CreateEstimateHeader";
import { EstimateDetailsForm } from "@/components/create-estimate/EstimateDetailsForm";
import { EstimateLineItemsTable } from "@/components/create-estimate/EstimateLineItemsTable";
import { EstimateTotalsSummary } from "@/components/create-estimate/EstimateTotalsSummary";
import { EstimateService } from "@/services/estimateService";
import { CreateCustomerForm } from "@/components/forms/CreateCustomerForm";
import { SearchCustomerModal } from "@/components/modals/SearchCustomerModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateEstimate() {
    const { id } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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

    // Calculate initial expiry date (30 days from today)
    const getInitialExpiryDate = () => {
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(expiryDate.getDate() + 30);
        return expiryDate.toISOString().split('T')[0];
    };

    const [estimate, setEstimate] = useState<EstimateData>({
        customer_id: "",
        estimate_date: new Date().toISOString().split('T')[0],
        expiry_date: getInitialExpiryDate(),
        place_of_supply: "",
        company_state: "", // Will be fetched from company details
        notes: "",
        terms_and_conditions: "",
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
                setEstimate(prev => ({
                    ...prev,
                    company_state: companyRes.data?.state || ""
                }));

                // If editing, load the estimate data
                if (id) {
                    setIsEditing(true);
                    const estimateService = EstimateService.getInstance();
                    const estimateData = await estimateService.getEstimateById(id);
                    
                    if (estimateData) {
                        // Convert estimate data to form format
                        setEstimate({
                            customer_id: estimateData.customer_id,
                            estimate_date: estimateData.estimate_date,
                            expiry_date: estimateData.expiry_date || '',
                            place_of_supply: estimateData.place_of_supply,
                            company_state: companyRes.data?.state || "",
                            notes: estimateData.notes || '',
                            terms_and_conditions: estimateData.terms_and_conditions || '',
                            lines: estimateData.lines.map(line => ({
                                id: line.id,
                                product_id: line.product_id || '',
                                description: line.description,
                                quantity: line.quantity,
                                unit_price: line.unit_price,
                                hsn_sac_code: line.hsn_sac_code || '',
                                line_total: line.line_total,
                                igst_rate: line.igst_rate,
                                igst_amount: line.igst_amount,
                                cgst_rate: line.cgst_rate,
                                cgst_amount: line.cgst_amount,
                                sgst_rate: line.sgst_rate,
                                sgst_amount: line.sgst_amount,
                                total_tax_amount: line.total_tax_amount
                            })),
                            subtotal: estimateData.subtotal,
                            total_igst: estimateData.total_igst,
                            total_cgst: estimateData.total_cgst,
                            total_sgst: estimateData.total_sgst,
                            total_tax: estimateData.total_tax,
                            total_amount: estimateData.total_amount
                        });

                        // Set selected customer
                        const customer = customersRes.data?.find(c => c.id === estimateData.customer_id);
                        setSelectedCustomer(customer || null);
                    }
                }
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
    }, [profile?.company_id, id, toast]);

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setSelectedCustomer(customer || null);

        // Auto-fill place of supply from customer details
        if (customer?.details && typeof customer.details === 'object') {
            const details = customer.details as any;
            const state = details.state || details.billing_state || details.customerDetails?.state || "";
            setEstimate(prev => ({
                ...prev,
                customer_id: customerId,
                place_of_supply: state
            }));
        } else {
            setEstimate(prev => ({
                ...prev,
                customer_id: customerId
            }));
        }
    };

    const handleEstimateDateChange = (date: string) => {
        setEstimate(prev => {
            // Auto-set expiry date to 30 days from estimate date
            let expiryDate = prev.expiry_date;
            if (!expiryDate && date) {
                const estimateDate = new Date(date);
                const expiryDateObj = new Date(estimateDate);
                expiryDateObj.setDate(expiryDateObj.getDate() + 30);
                expiryDate = expiryDateObj.toISOString().split('T')[0];
            }

            return {
                ...prev,
                estimate_date: date,
                expiry_date: expiryDate
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
        const newLine: EstimateLine = {
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

        setEstimate(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    };

    const removeLine = (lineId: string) => {
        setEstimate(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== lineId)
        }));
        calculateTotals();
    };

    const updateLine = (lineId: string, field: keyof EstimateLine, value: any) => {
        setEstimate(prev => ({
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
                            updatedLine.hsn_sac_code = (product as any).hsn_sac_code || '';
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
        setEstimate(prev => {
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

    const saveEstimate = async (status: 'draft' | 'sent') => {
        if (!profile?.company_id) return;

        if (!estimate.customer_id) {
            toast({
                title: "Error",
                description: "Please select a customer",
                variant: "destructive"
            });
            return;
        }

        if (estimate.lines.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one line item",
                variant: "destructive"
            });
            return;
        }

        // Validate line items
        for (const line of estimate.lines) {
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
            const estimateService = EstimateService.getInstance();

            // Prepare lines data with tax details
            const linesData = estimate.lines.map(line => {
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

            const estimateData = {
                company_id: profile?.company_id || '',
                customer_id: estimate.customer_id,
                estimate_number: await estimateService.generateEstimateNumber(profile?.company_id || ''),
                estimate_date: estimate.estimate_date,
                expiry_date: estimate.expiry_date || null,
                status: (status === 'draft' ? 'draft' : 'sent') as EstimateStatus,
                subtotal: estimate.subtotal,
                total_tax: estimate.total_tax,
                total_amount: estimate.total_amount,
                notes: estimate.notes || null,
                terms_and_conditions: estimate.terms_and_conditions || null,
                lines: linesData
            };

            let estimateId;
            if (isEditing && id) {
                await estimateService.updateEstimate(id, estimateData);
                estimateId = id;
            } else {
                estimateId = await estimateService.createEstimate(estimateData);
            }

            toast({
                title: "Success",
                description: `Estimate ${isEditing ? 'updated' : (status === 'draft' ? 'saved as draft' : 'created and sent')} successfully`,
            });

            navigate('/manager/sales/estimates');
        } catch (error) {
            console.error('Error saving estimate:', error);
            toast({
                title: "Error",
                description: "Failed to save estimate. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <CreateEstimateHeader
                onSaveDraft={() => saveEstimate('draft')}
                onSaveAndSend={() => saveEstimate('sent')}
                saving={saving}
                isEditing={isEditing}
            />

            <div className="grid gap-6 md:gap-8">
                <EstimateDetailsForm
                    estimate={estimate}
                    customers={customers}
                    selectedCustomer={selectedCustomer}
                    handleCustomerChange={handleCustomerChange}
                    handleEstimateDateChange={handleEstimateDateChange}
                    setEstimate={setEstimate}
                    calculateTax={calculateTax}
                    calculateTotals={calculateTotals}
                    onOpenCreateCustomer={() => setShowCreateCustomer(true)}
                    onOpenSearchCustomer={() => setShowSearchCustomer(true)}
                />

                <EstimateLineItemsTable
                    estimate={estimate}
                    products={products}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                />

                <EstimateTotalsSummary estimate={estimate} />
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
