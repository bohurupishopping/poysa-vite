import { BalanceSheetData } from '@/integrations/supabase/manager-types';
import { AssetSide } from './AssetSide';
import { LiabilityEquitySide } from './LiabilityEquitySide';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BalanceSheetStatementProps {
    data: BalanceSheetData | null;
    isLoading: boolean;
    asOfDate: string;
}

export function BalanceSheetStatement({ data, isLoading, asOfDate }: BalanceSheetStatementProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="text-center py-4">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-32 mt-2 mx-auto" />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader className="border-b border-border/50">
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Balance Verification Skeleton */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/50">
                        <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="text-center space-y-2">
                                    <Skeleton className="h-4 w-24 mx-auto" />
                                    <Skeleton className="h-6 w-32 mx-auto" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return (
            <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                    <div className="mx-auto max-w-md">
                        <div className="text-muted-foreground mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
                        <p className="text-muted-foreground">No balance sheet data found for the selected date.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Calculate totals
    const totalAssets = Object.values(data.assets || {}).reduce((sum, node) => sum + (node?.total || 0), 0);
    const totalLiabilities = Object.values(data.liabilities || {}).reduce((sum, node) => sum + (node?.total || 0), 0);
    const totalEquity = (data.equity?.share_capital?.total || 0) + 
                       (data.equity?.reserves_and_surplus?.total || 0) + 
                       (data.equity?.current_period_profit?.total || 0);
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;
    const difference = Math.abs(totalAssets - totalLiabilitiesAndEquity);

    return (
        <div className="space-y-6">
            {/* Balance Sheet Header */}
            <div className="text-center py-4">
                <h2 className="text-3xl font-bold text-foreground">Balance Sheet</h2>
                <p className="text-muted-foreground mt-2">As of {formatDate(data.asOfDate || asOfDate)}</p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets Side */}
                <AssetSide
                    assets={data.assets || {}}
                    totalAssets={totalAssets}
                />

                {/* Liabilities & Equity Side */}
                <LiabilityEquitySide
                    liabilities={data.liabilities || {}}
                    equity={data.equity || {
                        share_capital: { accountId: '', accountCode: '', accountName: '', total: 0, accounts: [] },
                        reserves_and_surplus: { accountId: '', accountCode: '', accountName: '', total: 0, accounts: [] },
                        current_period_profit: { accountId: '', accountCode: '', accountName: '', total: 0, accounts: [] }
                    }}
                    totalLiabilities={totalLiabilities}
                    totalEquity={totalEquity}
                    totalLiabilitiesAndEquity={totalLiabilitiesAndEquity}
                />
            </div>

            {/* Balance Verification */}
            <Card className={`shadow-sm border-2 ${isBalanced ? 'border-green-500/20 bg-green-50/30' : 'border-red-500/20 bg-red-50/30'}`}>
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <span className={isBalanced ? 'text-green-900' : 'text-red-900'}>Balance Verification</span>
                        <Badge variant={isBalanced ? "default" : "destructive"} className={isBalanced ? "bg-green-500" : ""}>
                            {isBalanced ? 'Balanced' : 'Unbalanced'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Assets</p>
                            <p className="text-2xl font-bold text-foreground">
                                ₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Liabilities & Equity</p>
                            <p className="text-2xl font-bold text-foreground">
                                ₹{totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                            <p className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
                            </p>
                            {!isBalanced && (
                                <p className="text-sm text-red-600 mt-2">
                                    Difference: ₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}