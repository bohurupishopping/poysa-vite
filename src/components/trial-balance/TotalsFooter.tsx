import { FC } from 'react';
import { CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TotalsFooterProps {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    difference: number;
}

export const TotalsFooter: FC<TotalsFooterProps> = ({
    totalDebits,
    totalCredits,
    isBalanced,
    difference
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Card className={cn(
            "rounded-2xl border-2 shadow-sm transition-all",
            isBalanced 
                ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50" 
                : "border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
        )}>
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Totals Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white shadow-sm">
                                <Calculator className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Total Debits</p>
                                <p className="text-lg font-bold text-gray-900 font-mono">
                                    {formatCurrency(totalDebits)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white shadow-sm">
                                <Calculator className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Total Credits</p>
                                <p className="text-lg font-bold text-gray-900 font-mono">
                                    {formatCurrency(totalCredits)}
                                </p>
                            </div>
                        </div>

                        {!isBalanced && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white shadow-sm">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Difference</p>
                                    <p className="text-lg font-bold text-red-700 font-mono">
                                        {formatCurrency(Math.abs(difference))} {difference > 0 ? 'Dr' : 'Cr'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Section */}
                    <div className="flex items-center gap-3">
                        {isBalanced ? (
                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Trial Balance</p>
                                    <p className="text-lg font-bold text-green-700">Balanced ✓</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Trial Balance</p>
                                    <p className="text-lg font-bold text-red-700">Out of Balance</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};