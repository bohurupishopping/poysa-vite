import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product } from "@/integrations/supabase/manager-types";
import { InvoiceData, InvoiceLine } from "./types";

interface InvoiceLineItemsTableProps {
    invoice: InvoiceData;
    products: Product[];
    addLine: () => void;
    removeLine: (lineId: string) => void;
    updateLine: (lineId: string, field: keyof InvoiceLine, value: any) => void;
}

export function InvoiceLineItemsTable({
    invoice,
    products,
    addLine,
    removeLine,
    updateLine,
}: InvoiceLineItemsTableProps) {
    return (
        <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between bg-gray-50/30">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Line Items</CardTitle>
                <Button 
                    onClick={addLine} 
                    size="sm" 
                    className="h-9 lg:h-10 px-3 lg:px-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                </Button>
            </CardHeader>
            <CardContent className="pb-2">
                {invoice.lines.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="mb-6">
                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                <Plus className="h-8 w-8 text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No line items added yet</h3>
                        <p className="text-gray-600 mb-6">Get started by adding your first invoice line item</p>
                        <Button 
                            onClick={addLine} 
                            variant="outline" 
                            className="rounded-full px-6 h-10 border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Line Item
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4 rounded-tl-xl">Product</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4 text-right">Qty</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4 text-right">Rate</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4">HSN/SAC</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4">Tax</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-3 px-4 text-right rounded-tr-xl">Amount</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.lines.map((line) => (
                                    <TableRow key={line.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-3 px-4">
                                            <Select
                                                value={line.product_id}
                                                onValueChange={(value) => updateLine(line.id, 'product_id', value)}
                                            >
                                                <SelectTrigger className="rounded-lg w-full h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors text-sm">
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(product => (
                                                        <SelectItem key={product.id} value={product.id} className="rounded-md hover:bg-gray-50 text-sm">
                                                            {product.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Input
                                                value={line.description}
                                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                                placeholder="Description"
                                                className="rounded-lg w-full h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors text-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <Input
                                                type="number"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="rounded-lg w-full h-9 text-right border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors text-sm"
                                                min="0"
                                                step="0.01"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <Input
                                                type="number"
                                                value={line.unit_price}
                                                onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                className="rounded-lg w-full h-9 text-right border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors text-sm"
                                                min="0"
                                                step="0.01"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Input
                                                value={line.hsn_sac_code}
                                                onChange={(e) => updateLine(line.id, 'hsn_sac_code', e.target.value)}
                                                placeholder="HSN/SAC"
                                                className="rounded-lg w-full h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors text-sm"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div className="flex items-center gap-1">
                                                {line.igst_rate > 0 ? (
                                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                        IGST {line.igst_rate}%
                                                    </span>
                                                ) : (
                                                    <div className="flex gap-1">
                                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                                            CGST {line.cgst_rate}%
                                                        </span>
                                                        <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                                                            SGST {line.sgst_rate}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="font-semibold text-gray-900 text-sm">
                                                ₹{(line.line_total + line.total_tax_amount).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Tax: ₹{line.total_tax_amount.toFixed(2)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLine(line.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 p-0 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
