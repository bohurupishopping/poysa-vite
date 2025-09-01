import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Supplier } from "@/integrations/supabase/manager-types";
import { BillData } from "./types";

interface BillDetailsFormProps {
    bill: BillData;
    suppliers: Supplier[];
    selectedSupplier: Supplier | null;
    handleSupplierChange: (supplierId: string) => void;
    handleBillDateChange: (date: string) => void;
    setBill: React.Dispatch<React.SetStateAction<BillData>>;
    calculateTax: (lineTotal: number, companyState: string, placeOfSupply: string) => {
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

export function BillDetailsForm({
    bill,
    suppliers,
    selectedSupplier,
    handleSupplierChange,
    handleBillDateChange,
    setBill,
    calculateTax,
    calculateTotals,
    onOpenCreateSupplier,
    onOpenSearchSupplier,
}: BillDetailsFormProps) {
    return (
        <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">Supplier *</Label>
                        <div className="flex gap-2">
                            <Select value={bill.supplier_id} onValueChange={handleSupplierChange}>
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="place_of_supply" className="text-sm font-medium text-gray-700">Place of Supply *</Label>
                        <Input
                            value={bill.place_of_supply}
                            onChange={(e) => {
                                const newPlaceOfSupply = e.target.value;
                                setBill(prev => {
                                    const updatedBill = { ...prev, place_of_supply: newPlaceOfSupply };

                                    if (prev.company_state && newPlaceOfSupply) {
                                        updatedBill.lines = prev.lines.map(line => {
                                            if (line.line_total > 0) {
                                                const taxCalc = calculateTax(line.line_total, prev.company_state, newPlaceOfSupply);
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

                                    return updatedBill;
                                });
                                setTimeout(calculateTotals, 0);
                            }}
                            placeholder="Enter place of supply (state)"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bill_number" className="text-sm font-medium text-gray-700">Bill Number *</Label>
                        <Input
                            value={bill.bill_number}
                            onChange={(e) => setBill(prev => ({ ...prev, bill_number: e.target.value }))}
                            placeholder="Enter bill number from supplier"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bill_date" className="text-sm font-medium text-gray-700">Bill Date *</Label>
                        <Input
                            type="date"
                            value={bill.bill_date}
                            onChange={(e) => handleBillDateChange(e.target.value)}
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date" className="text-sm font-medium text-gray-700">Due Date</Label>
                        <Input
                            type="date"
                            value={bill.due_date}
                            onChange={(e) => setBill(prev => ({ ...prev, due_date: e.target.value }))}
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                        <Input
                            value={bill.notes || ''}
                            onChange={(e) => setBill(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes for this bill"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
