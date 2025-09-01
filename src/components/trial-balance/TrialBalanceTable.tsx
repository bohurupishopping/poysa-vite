import { FC } from 'react';
import { TrialBalanceRow } from '@/services/accountingService';
import { Loader2, FileText, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TrialBalanceTableProps {
    data: TrialBalanceRow[];
    isLoading: boolean;
    selectedAccountId: string | null;
    onRowClick: (accountId: string, accountName: string) => void;
}

export const TrialBalanceTable: FC<TrialBalanceTableProps> = ({
    data,
    isLoading,
    selectedAccountId,
    onRowClick
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-blue-50">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Loading Trial Balance</h3>
                        <p className="text-gray-600 text-sm">Calculating account balances...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-gray-50">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">No Data Available</h3>
                        <p className="text-gray-600 text-sm">No accounts found for the selected date</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left py-4 px-8 font-semibold text-gray-700 text-sm bg-gray-50/50 w-[140px]">
                                Account Code
                            </th>
                            <th className="text-left py-4 px-8 font-semibold text-gray-700 text-sm bg-gray-50/50 min-w-[350px]">
                                Account Name
                            </th>
                            <th className="text-right py-4 px-8 font-semibold text-gray-700 text-sm bg-gray-50/50 w-[180px]">
                                Debit Balance
                            </th>
                            <th className="text-right py-4 px-8 font-semibold text-gray-700 text-sm bg-gray-50/50 w-[180px]">
                                Credit Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr
                                key={row.account_id}
                                onClick={() => onRowClick(row.account_id, row.account_name)}
                                className={cn(
                                    "cursor-pointer transition-all duration-200 border-b border-gray-50 hover:bg-blue-50/50 hover:shadow-sm group",
                                    selectedAccountId === row.account_id && "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm"
                                )}
                            >
                                <td className="py-5 px-8">
                                    <span className="font-mono text-sm text-gray-600 group-hover:text-blue-700 transition-colors">
                                        {row.account_code || '—'}
                                    </span>
                                </td>
                                <td className="py-5 px-8">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full transition-colors",
                                            selectedAccountId === row.account_id ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-400"
                                        )} />
                                        <span className="font-medium text-gray-900 group-hover:text-blue-900 transition-colors text-sm">
                                            {row.account_name}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-5 px-8 text-right">
                                    {row.closing_debit > 0 ? (
                                        <span className="font-semibold text-gray-900 font-mono text-sm">
                                            {formatCurrency(row.closing_debit)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 font-mono">—</span>
                                    )}
                                </td>
                                <td className="py-5 px-8 text-right">
                                    {row.closing_credit > 0 ? (
                                        <span className="font-semibold text-gray-900 font-mono text-sm">
                                            {formatCurrency(row.closing_credit)}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 font-mono">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};