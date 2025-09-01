import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/integrations/supabase/manager-types";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrderData, PurchaseOrderLine, PurchaseOrderStatus } from "@/components/create-purchase-order/types";
import { CreatePurchaseOrderHeader } from "@/components/create-purchase-order/CreatePurchaseOrderHeader";
import { PurchaseOrderDetailsForm } from "@/components/create-purchase-order/PurchaseOrderDetailsForm";
import { PurchaseOrderLineItemsTable } from "@/components/create-purchase-order/PurchaseOrderLineItemsTable";
import { PurchaseOrderTotalsSummary } from "@/components/create-purchase-order/PurchaseOrderTotalsSummary";
import { PurchaseOrderService } from "@/services/purchaseOrderService";
import { CreateSupplierForm } from "@/components/forms/CreateSupplierForm";
import { SearchSupplierModal } from "@/components/modals/SearchSupplierModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Supplier {
 id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  details?: any;
}

export default function CreatePurchaseOrder() {
    const { id } = useParams();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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

    // Calculate initial expected delivery date (7 days from today)
    const getInitialDeliveryDate = () => {
        const today = new Date();
        const deliveryDate = new Date(today);
        deliveryDate.setDate(deliveryDate.getDate() + 7);
        return deliveryDate.toISOString().split('T')[0];
    };

    const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderData>({
        supplier_id: "",
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: getInitialDeliveryDate(),
        delivery_address: "",
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

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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
                        .select('state, address_line_1, address_line_2')
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

                // Set company state and default delivery address
                const companyAddress = [companyRes.data?.address_line_1, companyRes.data?.address_line_2]
                    .filter(Boolean)
                    .join(', ');
                setPurchaseOrder(prev => ({
                    ...prev,
                    company_state: companyRes.data?.state || "",
                    delivery_address: companyAddress
                }));

                // If editing, load the purchase order data
                if (id) {
                    setIsEditing(true);
                    const purchaseOrderService = PurchaseOrderService.getInstance();
                    const poData = await purchaseOrderService.getPurchaseOrderById(id);
                    
                    if (poData) {
                        // Convert purchase order data to form format
                        setPurchaseOrder({
                            supplier_id: poData.supplier_id,
                            order_date: poData.order_date,
                            expected_delivery_date: poData.expected_delivery_date || '',
                            delivery_address: poData.delivery_address || companyAddress,
                            company_state: companyRes.data?.state || "",
                            notes: poData.notes || '',
                            terms_and_conditions: poData.terms_and_conditions || '',
                            lines: poData.lines.map(line => ({
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
                            subtotal: poData.subtotal,
                            total_igst: poData.total_igst,
                            total_cgst: poData.total_cgst,
                            total_sgst: poData.total_sgst,
                            total_tax: poData.total_tax,
                            total_amount: poData.total_amount
                        });

                        // Set selected supplier
                        const supplier = suppliersRes.data?.find(s => s.id === poData.supplier_id);
                        setSelectedSupplier(supplier || null);
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

    const handleSupplierChange = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        setSelectedSupplier(supplier || null);

        setPurchaseOrder(prev => ({
            ...prev,
            supplier_id: supplierId
        }));
    };

    const handleOrderDateChange = (date: string) => {
        setPurchaseOrder(prev => {
            // Auto-set expected delivery date to 7 days from order date
            let expectedDeliveryDate = prev.expected_delivery_date;
            if (!expectedDeliveryDate && date) {
                const orderDate = new Date(date);
                const deliveryDateObj = new Date(orderDate);
                deliveryDateObj.setDate(deliveryDateObj.getDate() + 7);
                expectedDeliveryDate = deliveryDateObj.toISOString().split('T')[0];
            }

            return {
                ...prev,
                order_date: date,
                expected_delivery_date: expectedDeliveryDate
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

    // Function to calculate GST based on supplier location
    const calculateTax = (lineTotal: number, companyState: string, supplierState: string) => {
        // Default GST rate - you might want to make this configurable per product
        const gstRate = 18; // 18% GST

        // Inter-state transaction (IGST applies)
        if (companyState !== supplierState) {
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
        const newLine: PurchaseOrderLine = {
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

        setPurchaseOrder(prev => ({
            ...prev,
            lines: [...prev.lines, newLine]
        }));
    };

    const removeLine = (lineId: string) => {
        setPurchaseOrder(prev => ({
            ...prev,
            lines: prev.lines.filter(line => line.id !== lineId)
        }));
        calculateTotals();
    };

    const updateLine = (lineId: string, field: keyof PurchaseOrderLine, value: any) => {
        setPurchaseOrder(prev => ({
            ...prev,
            lines: prev.lines.map(line => {
                if (line.id === lineId) {
                    const updatedLine = { ...line, [field]: value };

                    // Auto-populate product details
                    if (field === 'product_id' && value) {
                        const product = products.find(p => p.id === value);
                        if (product) {
                            updatedLine.description = product.description || product.name;
                            updatedLine.unit_price = product.average_cost || product.sale_price || 0;
                            updatedLine.hsn_sac_code = (product as any).hsn_sac_code || '';
                        }
                    }

                    // Calculate line total
                    updatedLine.line_total = updatedLine.quantity * updatedLine.unit_price;

                    // Calculate tax automatically based on supplier location
                    if (updatedLine.line_total > 0 && prev.company_state && selectedSupplier) {
                        const supplierState = (selectedSupplier.details as any)?.state || prev.company_state;
                        const taxCalc = calculateTax(updatedLine.line_total, prev.company_state, supplierState);
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
        setPurchaseOrder(prev => {
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

    const savePurchaseOrder = async (status: 'draft' | 'sent') => {
        if (!profile?.company_id) return;

        if (!purchaseOrder.supplier_id) {
            toast({
                title: "Error",
                description: "Please select a supplier",
                variant: "destructive"
            });
            return;
        }

        if (purchaseOrder.lines.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one line item",
                variant: "destructive"
            });
            return;
        }

        // Validate line items
        for (const line of purchaseOrder.lines) {
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
            const purchaseOrderService = PurchaseOrderService.getInstance();

            // Prepare lines data with tax details
            const linesData = purchaseOrder.lines.map(line => {
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

            const poData = {
                company_id: profile?.company_id || '',
                supplier_id: purchaseOrder.supplier_id,
                po_number: await purchaseOrderService.generatePurchaseOrderNumber(profile?.company_id || ''),
                order_date: purchaseOrder.order_date,
                expected_delivery_date: purchaseOrder.expected_delivery_date || null,
                delivery_address: purchaseOrder.delivery_address || null,
                status: (status === 'draft' ? 'draft' : 'sent') as PurchaseOrderStatus,
                subtotal: purchaseOrder.subtotal,
                total_tax: purchaseOrder.total_tax,
                total_amount: purchaseOrder.total_amount,
                notes: purchaseOrder.notes || null,
                terms_and_conditions: purchaseOrder.terms_and_conditions || null,
                lines: linesData
            };

            let poId;
            if (isEditing && id) {
                await purchaseOrderService.updatePurchaseOrder(id, poData);
                poId = id;
            } else {
                poId = await purchaseOrderService.createPurchaseOrder(poData);
            }

            toast({
                title: "Success",
                description: `Purchase order ${isEditing ? 'updated' : (status === 'draft' ? 'saved as draft' : 'created and sent')} successfully`,
            });

            navigate('/manager/purchases/purchase-orders');
        } catch (error) {
            console.error('Error saving purchase order:', error);
            toast({
                title: "Error",
                description: "Failed to save purchase order. Please try again.",
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
            <CreatePurchaseOrderHeader
                onSaveDraft={() => savePurchaseOrder('draft')}
                onSaveAndSend={() => savePurchaseOrder('sent')}
                saving={saving}
                isEditing={isEditing}
            />

            <div className="grid gap-6 md:gap-8">
                <PurchaseOrderDetailsForm
                    purchaseOrder={purchaseOrder}
                    suppliers={suppliers}
                    selectedSupplier={selectedSupplier}
                    handleSupplierChange={handleSupplierChange}
                    handleOrderDateChange={handleOrderDateChange}
                    setPurchaseOrder={setPurchaseOrder}
                    calculateTax={calculateTax}
                    calculateTotals={calculateTotals}
                    onOpenCreateSupplier={() => setShowCreateSupplier(true)}
                    onOpenSearchSupplier={() => setShowSearchSupplier(true)}
                />

                <PurchaseOrderLineItemsTable
                    purchaseOrder={purchaseOrder}
                    products={products}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                />

                <PurchaseOrderTotalsSummary purchaseOrder={purchaseOrder} />
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
