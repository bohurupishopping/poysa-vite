import { FC } from 'react';
import { X, Loader2, FileText, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAccountLedger } from '@/hooks/useAccountLedger';
import { DateRange } from '@/services/accountingService';
import { cn } from '@/lib/utils';

interface AccountLedgerPanelProps {
    accountId: string | null;
    accountName: string;
    dateRange: DateRange;
    onClose: () => void;
}

export const AccountLedgerPanel: FC<AccountLedgerPanelProps> = ({
    accountId,
    accountName,
    dateRange,
    onClose
}) => {
    const { data, isLoading, error } = useAccountLedger(accountId, dateRange);

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!accountId) {
        return (
            <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white h-fit">
                <CardContent className="p-12 text-center">
                    <div className="space-y-4">
                        <div className="p-4 rounded-full bg-blue-50 mx-auto w-fit">
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Ledger</h3>
                            <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                                Select an account from the trial balance to view its detailed transaction history
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
                            <span>Click any account</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>View transactions</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl border border-gray-200 shadow-sm bg-white h-fit">
            <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                            {accountName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                                {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="max-h-[700px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="flex flex-col items-center space-y-3">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <p className="text-gray-600 text-sm">Loading account transactions...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center">
                            <div className="p-3 rounded-full bg-red-50 mx-auto w-fit mb-3">
                                <FileText className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="text-red-600 mb-2 text-sm font-medium">Error loading ledger</div>
                            <p className="text-xs text-gray-500">{error}</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="p-3 rounded-full bg-gray-50 mx-auto w-fit mb-3">
                                <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-sm">No transactions found for this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-gray-100">
                                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-sm w-[100px]">
                                            Date
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-sm min-w-[280px]">
                                            Description
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right text-sm w-[130px]">
                                            Debit
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right text-sm w-[130px]">
                                            Credit
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right text-sm w-[140px]">
                                            Balance
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, index) => {
                                        const isOpeningBalance = row.narration === 'Opening Balance';
                                        return (
                                            <TableRow
                                                key={index}
                                                className={cn(
                                                    "border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                                                    isOpeningBalance && "bg-blue-50/30 border-blue-100"
                                                )}
                                            >
                                                <TableCell className="font-mono text-sm py-4 px-6 text-gray-600">
                                                    {formatDate(row.entry_date)}
                                                </TableCell>
                                                <TableCell className="text-sm py-4 px-6 text-gray-900">
                                                    <div className="max-w-none">
                                                        <span className={cn(
                                                            "block line-clamp-2 leading-relaxed",
                                                            isOpeningBalance && "font-medium text-blue-900"
                                                        )} title={row.narration}>
                                                            {row.narration}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm py-4 px-6">
                                                    {row.debit !== null ? (
                                                        <span className="text-gray-900 font-semibold">
                                                            {formatCurrency(row.debit)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm py-4 px-6">
                                                    {row.credit !== null ? (
                                                        <span className="text-gray-900 font-semibold">
                                                            {formatCurrency(row.credit)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm py-4 px-6">
                                                    <span className={cn(
                                                        "font-bold px-2 py-1 rounded-md",
                                                        row.running_balance >= 0
                                                            ? "text-gray-900 bg-gray-50"
                                                            : "text-red-700 bg-red-50"
                                                    )}>
                                                        {formatCurrency(Math.abs(row.running_balance))}
                                                        {row.running_balance < 0 && ' Cr'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};