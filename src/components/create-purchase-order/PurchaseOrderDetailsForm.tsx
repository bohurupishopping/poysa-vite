import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { PurchaseOrderData } from "./types";

interface Supplier {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    gst_number?: string;
    details?: any;
}

interface PurchaseOrderDetailsFormProps {
    purchaseOrder: PurchaseOrderData;
    suppliers: Supplier[];
    selectedSupplier: Supplier | null;
    handleSupplierChange: (supplierId: string) => void;
    handleOrderDateChange: (date: string) => void;
    setPurchaseOrder: React.Dispatch<React.SetStateAction<PurchaseOrderData>>;
    calculateTax: (lineTotal: number, companyState: string, supplierState: string) => {
        igst_rate: number;
        igst_amount: number;
        cgst_rate: number;
        cgst_amount: number;
        sgst_rate: number;
        sgst_amount: number;
        total_tax_amount: number;
    };
    calculateTotals: () => void;
    onOpenCreateSupplier?: () => void;
    onOpenSearchSupplier?: () => void;
}

export function PurchaseOrderDetailsForm({
    purchaseOrder,
    suppliers,
    selectedSupplier,
    handleSupplierChange,
    handleOrderDateChange,
    setPurchaseOrder,
    calculateTax,
    calculateTotals,
    onOpenCreateSupplier,
    onOpenSearchSupplier,
}: PurchaseOrderDetailsFormProps) {
    return (
        <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">Supplier *</Label>
                        <div className="flex gap-2">
                            <Select value={purchaseOrder.supplier_id} onValueChange={handleSupplierChange}>
                                <SelectTrigger className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors flex-1">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(supplier => (
                                        <SelectItem key={supplier.id} value={supplier.id} className="rounded-lg hover:bg-gray-50">
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenSearchSupplier}
                                    className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50 p-0"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenCreateSupplier}
                                    className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50 p-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {selectedSupplier && (
                            <div className="text-xs text-gray-600 mt-2 p-3 bg-gray-50 rounded-xl">
                                <p className="font-medium">{selectedSupplier.name}</p>
                                <div className="mt-1 space-y-1">
                                    {selectedSupplier.email && (
                                        <p className="text-xs">📧 {selectedSupplier.email}</p>
                                    )}
                                    {selectedSupplier.phone && (
                                        <p className="text-xs">📞 {selectedSupplier.phone}</p>
                                    )}
                                    {selectedSupplier.gst_number && (
                                        <p className="text-xs">🏢 GST: {selectedSupplier.gst_number}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="po_number" className="text-sm font-medium text-gray-700">PO Number</Label>
                        <Input
                            value="Auto-generated"
                            disabled
                            className="rounded-xl h-11 bg-gray-50 border-gray-200 text-gray-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order_date" className="text-sm font-medium text-gray-700">Order Date *</Label>
                        <Input
                            type="date"
                            value={purchaseOrder.order_date}
                            onChange={(e) => handleOrderDateChange(e.target.value)}
                            className="rounded-xl h-11 border-gray-20 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expected_delivery_date" className="text-sm font-medium text-gray-700">Expected Delivery</Label>
                        <Input
                            type="date"
                            value={purchaseOrder.expected_delivery_date || ''}
                            onChange={(e) => setPurchaseOrder(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company_state" className="text-sm font-medium text-gray-700">Company State *</Label>
                        <Input
                            value={purchaseOrder.company_state || ''}
                            onChange={(e) => {
                                const newCompanyState = e.target.value;
                                setPurchaseOrder(prev => {
                                    const updatedPurchaseOrder = { ...prev, company_state: newCompanyState };

                                    // Recalculate taxes for all lines when company state changes
                                    if (newCompanyState && selectedSupplier) {
                                        const supplierState = (selectedSupplier.details as any)?.state || newCompanyState;
                                        updatedPurchaseOrder.lines = prev.lines.map(line => {
                                            if (line.line_total > 0) {
                                                const taxCalc = calculateTax(line.line_total, newCompanyState, supplierState);
                                                return {
                                                    ...line,
                                                    igst_rate: taxCalc.igst_rate,
                                                    igst_amount: taxCalc.igst_amount,
                                                    cgst_rate: taxCalc.cgst_rate,
                                                    cgst_amount: taxCalc.cgst_amount,
                                                    sgst_rate: taxCalc.sgst_rate,
                                                    sgst_amount: taxCalc.sgst_amount,
                                                    total_tax_amount: taxCalc.total_tax_amount
                                                };
                                            }
                                            return line;
                                        });
                                    }

                                    return updatedPurchaseOrder;
                                });
                                setTimeout(calculateTotals, 0);
                            }}
                            placeholder="Enter company state"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="delivery_address" className="text-sm font-medium text-gray-700">Delivery Address *</Label>
                        <Textarea
                            value={purchaseOrder.delivery_address || ''}
                            onChange={(e) => setPurchaseOrder(prev => ({ ...prev, delivery_address: e.target.value }))}
                            placeholder="Enter delivery address"
                            className="rounded-xl min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                            rows={3}
                        />
                        <p className="text-xs text-gray-500">
                            Address where the goods should be delivered
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                        <Input
                            value={purchaseOrder.notes || ''}
                            onChange={(e) => setPurchaseOrder(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes for this purchase order"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="terms_and_conditions" className="text-sm font-medium text-gray-700">Terms and Conditions (Optional)</Label>
                    <Textarea
                        value={purchaseOrder.terms_and_conditions || ''}
                        onChange={(e) => setPurchaseOrder(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                        placeholder="Enter terms and conditions for this purchase order"
                        className="rounded-xl min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        rows={3}
                    />
                    <p className="text-xs text-gray-500">
                        Specify payment terms, delivery conditions, quality requirements, etc.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
