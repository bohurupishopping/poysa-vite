import { useState } from 'react';
import { useTrialBalance } from '@/hooks/useTrialBalance';
import { TrialBalanceTable } from '@/components/trial-balance/TrialBalanceTable';
import { TotalsFooter } from '@/components/trial-balance/TotalsFooter';
import { AccountLedgerPanel } from '@/components/trial-balance/AccountLedgerPanel';
import { DateFilter } from '@/components/trial-balance/DateFilter';
import { AlertCircle, RefreshCw, FileText, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TrialBalance() {
    const { data, isLoading, error, date, setDate, totals, refetch } = useTrialBalance();
    const [selectedAccount, setSelectedAccount] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const handleRowClick = (accountId: string, accountName: string) => {
        setSelectedAccount({ id: accountId, name: accountName });
    };

    const handleClosePanel = () => {
        setSelectedAccount(null);
    };

    // Calculate date range for ledger (from start of month to selected date)
    const dateRange = {
        startDate: (() => {
            const selectedDate = new Date(date);
            return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0];
        })(),
        endDate: date
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto pt-16 px-6">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-red-100">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Trial Balance</h3>
                                    <p className="text-red-700 text-sm">{error}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={refetch}
                                        className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Header Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Title and Description */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                <Calculator className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Trial Balance</h1>
                                <p className="text-gray-600 mt-1">
                                    Interactive financial statement with drill-down capability
                                </p>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <DateFilter date={date} onDateChange={setDate} />
                        </div>
                    </div>

                    {/* Balance Status Bar */}
                    {!isLoading && data.length > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Total Debits:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            ₹{totals.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-600">Total Credits:</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            ₹{totals.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {totals.isBalanced ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                                            <TrendingUp className="h-4 w-4 mr-1" />
                                            Balanced
                                        </Badge>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="destructive" className="px-3 py-1">
                                                Out of Balance
                                            </Badge>
                                            <span className="text-sm font-medium text-red-600">
                                                Diff: ₹{Math.abs(totals.difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
                    {/* Trial Balance Table - Equal space */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Account Balances</h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Click any account to view detailed transactions
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white">
                                            {data.length} accounts
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={refetch}
                                            disabled={isLoading}
                                            className="bg-white hover:bg-gray-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <TrialBalanceTable
                                data={data}
                                isLoading={isLoading}
                                selectedAccountId={selectedAccount?.id || null}
                                onRowClick={handleRowClick}
                            />
                        </div>
                    </div>

                    {/* Account Ledger Panel - Equal space */}
                    <div>
                        <div className="sticky top-8">
                            <AccountLedgerPanel
                                accountId={selectedAccount?.id || null}
                                accountName={selectedAccount?.name || ''}
                                dateRange={dateRange}
                                onClose={handleClosePanel}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}