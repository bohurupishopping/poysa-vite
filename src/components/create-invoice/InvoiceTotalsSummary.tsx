import { Card, CardContent } from "@/components/ui/card";
import { InvoiceData } from "./types";

interface InvoiceTotalsSummaryProps {
    invoice: InvoiceData;
}

export function InvoiceTotalsSummary({ invoice }: InvoiceTotalsSummaryProps) {
    if (invoice.lines.length === 0) {
        return null;
    }

    return (
        <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-3">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium text-sm">Subtotal:</span>
                            <span className="font-semibold text-gray-900">₹{invoice.subtotal.toFixed(2)}</span>
                        </div>

                        {/* Tax Breakdown - Compact and Smart */}
                        <div className="space-y-2">
                            {invoice.total_igst > 0 && (
                                <div className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg border border-blue-100/50">
                                    <span className="text-blue-700 font-medium text-sm">IGST:</span>
                                    <span className="font-semibold text-blue-900">₹{invoice.total_igst.toFixed(2)}</span>
                                </div>
                            )}

                            {invoice.total_cgst > 0 && (
                                <div className="flex justify-between items-center py-2 px-4 bg-purple-50 rounded-lg border border-purple-100/50">
                                    <span className="text-purple-700 font-medium text-sm">CGST:</span>
                                    <span className="font-semibold text-purple-900">₹{invoice.total_cgst.toFixed(2)}</span>
                                </div>
                            )}

                            {invoice.total_sgst > 0 && (
                                <div className="flex justify-between items-center py-2 px-4 bg-pink-50 rounded-lg border border-pink-100/50">
                                    <span className="text-pink-700 font-medium text-sm">SGST:</span>
                                    <span className="font-semibold text-pink-900">₹{invoice.total_sgst.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {/* Total Tax */}
                        <div className="flex justify-between items-center py-3 px-4 border-t border-gray-200 bg-gray-50 rounded-lg">
                            <span className="font-semibold text-gray-900">Total Tax:</span>
                            <span className="font-semibold text-gray-900">₹{invoice.total_tax.toFixed(2)}</span>
                        </div>

                        {/* Grand Total - Prominent and Clean */}
                        <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200 shadow-sm">
                            <span className="text-base font-bold text-green-900">Total Amount:</span>
                            <span className="text-xl font-bold text-green-700">₹{invoice.total_amount.toFixed(2)}</span>
                        </div>

                        {/* Tax Type Indicator - Compact and Informative */}
                        <div className="text-xs text-center py-2 px-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            {invoice.company_state && invoice.place_of_supply ? (
                                invoice.company_state === invoice.place_of_supply ?
                                    <span className="font-medium text-yellow-800">Intra-state <span className="text-purple-700">(CGST + SGST)</span></span> :
                                    <span className="font-medium text-yellow-800">Inter-state <span className="text-blue-700">(IGST)</span></span>
                            ) : (
                                <span className="font-medium text-yellow-800">Set place of supply</span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
