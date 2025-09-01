import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Supplier, Product } from "@/integrations/supabase/manager-types";
import { useToast } from "@/hooks/use-toast";
import { BillData, BillLine } from "@/components/create-bill/types";
import { CreateBillHeader } from "@/components/create-bill/CreateBillHeader";
import { BillDetailsForm } from "@/components/create-bill/BillDetailsForm";
import { BillLineItemsTable } from "@/components/create-bill/BillLineItemsTable";
import { BillTotalsSummary } from "@/components/create-bill/BillTotalsSummary";
import { CreateSupplierForm } from "@/components/forms/CreateSupplierForm";
import { SearchSupplierModal } from "@/components/modals/SearchSupplierModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CreateBill() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCreateSupplier, setShowCreateSupplier] = useState(false);
    const [showSearchSupplier, setShowSearchSupplier] = useState(false);
    const [taxRates, setTaxRates] = useState<{
        igst_18: string | null;
        cgst_9: string | null;
        sgst_9: string | null;
    }>({
        igst_18: null,
        cgst_9: null,
        sgst_9: null
    });

    // Calculate initial due date (20 days from today, mirroring invoice)
    const getInitialDueDate = () => {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 20);
        return dueDate.toISOString().split('T')[0];
    };

    const [bill, setBill] = useState<BillData>({
        supplier_id: "",
        bill_number: "", // Manual input
        bill_date: new Date().toISOString().split('T')[0],
        due_date: getInitialDueDate(),
        place_of_supply: "",
        company_state: "", // Will be fetched from company details
        notes: "",
        lines: [],
        subtotal: 0,
        total_igst: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_tax: 0,
        total_amount: 0,
        status: 'draft'
    });

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Function to get or create standard tax rates (reused from CreateInvoice)
    const getOrCreateTaxRates = async (companyId: string) => {
        try {
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

            existingRates?.forEach(rate => {
                if (rate.name === 'IGST' && rate.rate === 18) {
                    rates.igst_18 = rate.id;
                } else if (rate.name === 'CGST' && rate.rate === 9) {
                    rates.cgst_9 = rate.id;
                } else if (rate.name === 'SGST' && rate.rate === 9) {
                    rates.sgst_9 = rate.id;
                }
            });

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
                const [suppliersRes, productsRes, companyRes, taxRatesData] = await Promise.all([
                    supabase
                        .from('suppliers')
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

                if (suppliersRes.error) throw suppliersRes.error;
                if (productsRes.error) throw productsRes.error;
                if (companyRes.error) throw companyRes.error;

                setSuppliers(suppliersRes.data || []);
                setProducts(productsRes.data || []);
                setTaxRates(taxRatesData);

                setBill(prev => ({
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

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        setSelectedSupplier(supplier || null);

        if (supplier?.details && typeof supplier.details === 'object') {
            const details = supplier.details as any;
            const state = details.state || details.billing_state || details.supplierDetails?.state || "";
            setBill(prev => ({
                ...prev,
                supplier_id: supplierId,
                place_of_supply: state
            }));
        } else {
            setBill(prev => ({
                ...prev,
                supplier_id: supplierId
            }));
        }
    };

    const handleBillDateChange = (date: string) => {
        setBill(prev => {
            let dueDate = prev.due_date;
            if (!dueDate && date) {
                const billDate = new Date(date);
                const dueDateObj = new Date(billDate);
                dueDateObj.setDate(dueDateObj.getDate() + 20);
                dueDate = dueDateObj.toISOString().split('T')[0];
            }

            return {
                ...prev,
                bill_date: date,
                due_date: dueDate
            };
        });
    };

    // Function to calculate GST based on place of supply (reused from CreateInvoice)
    const calculateTax = (lineTotal: number, companyState: string, placeOfSupply: string) => {
        const gstRate = 18; // 18% GST

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
        const newLine: BillLine = {
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

        setBill(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    };

    const removeLine = (lineId: string) => {
        setBill(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== lineId)
        }));
        calculateTotals();
    };

    const updateLine = (lineId: string, field: keyof BillLine, value: any) => {
        setBill(prev => ({
            ...prev,
            lines: prev.lines.map(line => {
                if (line.id === lineId) {
                    const updatedLine = { ...line, [field]: value };

                    if (field === 'product_id' && value) {
                        const product = products.find(p => p.id === value);
                        if (product) {
                            updatedLine.description = product.description || product.name;
                            updatedLine.hsn_sac_code = (product as any).hsn_sac_code || '';
                        }
                    }

                    updatedLine.line_total = updatedLine.quantity * updatedLine.unit_price;

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

        setTimeout(calculateTotals, 0);
    };

    const calculateTotals = () => {
        setBill(prev => {
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

    const handleCreateSupplierSuccess = async () => {
        setShowCreateSupplier(false);
        // Refresh suppliers list
        if (profile?.company_id) {
            try {
                const { data: suppliersRes, error } = await supabase
                    .from('suppliers')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .is('deleted_at', null);
                
                if (!error) {
                    setSuppliers(suppliersRes || []);
                }
            } catch (error) {
                console.error('Error refreshing suppliers:', error);
            }
        }
    };

    const saveBill = async (status: 'draft' | 'submitted') => {
        if (!profile?.company_id) return;

        if (!bill.supplier_id) {
            toast({
                title: "Error",
                description: "Please select a supplier",
                variant: "destructive"
            });
            return;
        }

        if (!bill.bill_number.trim()) {
            toast({
                title: "Error",
                description: "Please enter a bill number",
                variant: "destructive"
            });
            return;
        }

        if (bill.lines.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one line item",
                variant: "destructive"
            });
            return;
        }

        for (const line of bill.lines) {
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
            const linesData = bill.lines.map(line => {
                const lineTaxes = [];

                if (line.igst_amount > 0 && taxRates.igst_18) {
                    lineTaxes.push({
                        tax_rate_id: taxRates.igst_18,
                        tax_amount: line.igst_amount
                    });
                }

                if (line.cgst_amount > 0 && taxRates.cgst_9) {
                    lineTaxes.push({
                        tax_rate_id: taxRates.cgst_9,
                        tax_amount: line.cgst_amount
                    });
                }

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

            const subtotal = linesData.reduce((sum, line) => sum + line.line_total, 0);
            const totalTax = linesData.reduce((sum, line) => {
                return sum + (line.line_taxes?.reduce((taxSum, tax) => taxSum + tax.tax_amount, 0) || 0);
            }, 0);
            const totalAmount = subtotal + totalTax;

            // Call the submit_purchase_bill database function with correct signature
            const { data, error } = await supabase.rpc('submit_purchase_bill', {
                p_company_id: profile.company_id,
                p_supplier_id: bill.supplier_id,
                p_bill_date: bill.bill_date,
                p_lines: linesData,
                p_bill_number: bill.bill_number,
                p_due_date: bill.due_date,
                p_place_of_supply: bill.place_of_supply
            });

            if (error) throw error;

            // Handle the JSON response to extract bill_id
            const result = data as { bill_id: string };
            
            toast({
                title: "Success",
                description: `Bill ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully`,
            });

            navigate('/manager/purchases/bills'); // Redirect to bills page
        } catch (error) {
            console.error('Error saving bill:', error);
            toast({
                title: "Error",
                description: "Failed to save bill. Please try again.",
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
                <span className="ml-3 text-gray-600">Loading bill data...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <CreateBillHeader
                onSaveDraft={() => saveBill('draft')}
                onSaveAndSubmit={() => saveBill('submitted')}
                saving={saving}
            />

            <div className="grid gap-6 md:gap-8">
                <BillDetailsForm
                    bill={bill}
                    suppliers={suppliers}
                    selectedSupplier={selectedSupplier}
                    handleSupplierChange={handleSupplierChange}
                    handleBillDateChange={handleBillDateChange}
                    setBill={setBill}
                    calculateTax={calculateTax}
                    calculateTotals={calculateTotals}
                    onOpenCreateSupplier={() => setShowCreateSupplier(true)}
                    onOpenSearchSupplier={() => setShowSearchSupplier(true)}
                />

                <BillLineItemsTable
                    bill={bill}
                    products={products}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                />

                <BillTotalsSummary bill={bill} />
            </div>

            <Dialog open={showCreateSupplier} onOpenChange={setShowCreateSupplier}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Supplier</DialogTitle>
                    </DialogHeader>
                    <CreateSupplierForm
                        onSuccess={handleCreateSupplierSuccess}
                        onCancel={() => setShowCreateSupplier(false)}
                    />
                </DialogContent>
            </Dialog>

            <SearchSupplierModal
                open={showSearchSupplier}
                onOpenChange={setShowSearchSupplier}
                onSelectSupplier={(supplier) => {
                    handleSupplierChange(supplier.id);
                    setShowSearchSupplier(false);
                }}
            />
        </div>
    );
}
