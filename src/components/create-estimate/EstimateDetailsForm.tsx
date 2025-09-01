import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Customer } from "@/integrations/supabase/manager-types";
import { EstimateData } from "./types";

interface EstimateDetailsFormProps {
    estimate: EstimateData;
    customers: Customer[];
    selectedCustomer: Customer | null;
    handleCustomerChange: (customerId: string) => void;
    handleEstimateDateChange: (date: string) => void;
    setEstimate: React.Dispatch<React.SetStateAction<EstimateData>>;
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
    onOpenCreateCustomer?: () => void;
    onOpenSearchCustomer?: () => void;
}

export function EstimateDetailsForm({
    estimate,
    customers,
    selectedCustomer,
    handleCustomerChange,
    handleEstimateDateChange,
    setEstimate,
    calculateTax,
    calculateTotals,
    onOpenCreateCustomer,
    onOpenSearchCustomer,
}: EstimateDetailsFormProps) {
    return (
        <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Estimate Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="space-y-2">
                        <Label htmlFor="customer" className="text-sm font-medium text-gray-700">Customer *</Label>
                        <div className="flex gap-2">
                            <Select value={estimate.customer_id} onValueChange={handleCustomerChange}>
                                <SelectTrigger className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors flex-1">
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id} className="rounded-lg hover:bg-gray-50">
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenSearchCustomer}
                                    className="h-11 w-11 rounded-xl border-gray-200 hover:bg-gray-50 p-0"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={onOpenCreateCustomer}
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
                            value={estimate.place_of_supply}
                            onChange={(e) => {
                                const newPlaceOfSupply = e.target.value;
                                setEstimate(prev => {
                                    const updatedEstimate = { ...prev, place_of_supply: newPlaceOfSupply };

                                    // Recalculate taxes for all lines when place of supply changes
                                    if (prev.company_state && newPlaceOfSupply) {
                                        updatedEstimate.lines = prev.lines.map(line => {
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

                                    return updatedEstimate;
                                });
                                setTimeout(calculateTotals, 0);
                            }}
                            placeholder="Enter place of supply (state)"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimate_number" className="text-sm font-medium text-gray-700">Estimate Number</Label>
                        <Input
                            value="Auto-generated"
                            disabled
                            className="rounded-xl h-11 bg-gray-50 border-gray-200 text-gray-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimate_date" className="text-sm font-medium text-gray-700">Estimate Date *</Label>
                        <Input
                            type="date"
                            value={estimate.estimate_date}
                            onChange={(e) => handleEstimateDateChange(e.target.value)}
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiry_date" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                        <Input
                            type="date"
                            value={estimate.expiry_date || ''}
                            onChange={(e) => setEstimate(prev => ({ ...prev, expiry_date: e.target.value }))}
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
                        <Input
                            value={estimate.notes || ''}
                            onChange={(e) => setEstimate(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes for this estimate"
                            className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="terms_and_conditions" className="text-sm font-medium text-gray-700">Terms and Conditions (Optional)</Label>
                        <Textarea
                            value={estimate.terms_and_conditions || ''}
                            onChange={(e) => setEstimate(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                            placeholder="Enter terms and conditions for this estimate"
                            className="rounded-xl min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                            rows={3}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
