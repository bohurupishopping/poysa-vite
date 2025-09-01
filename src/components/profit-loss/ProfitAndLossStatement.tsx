import { ProfitAndLossData } from '@/integrations/supabase/manager-types';
import { DateRange } from '@/services/accountingService';
import { TradingAccountSection } from './TradingAccountSection';
import { ProfitLossAccountSection } from './ProfitLossAccountSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfitAndLossStatementProps {
    data: ProfitAndLossData | null;
    isLoading: boolean;
    dateRange: DateRange;
}

export function ProfitAndLossStatement({ data, isLoading, dateRange }: ProfitAndLossStatementProps) {
    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Trading Account Section Skeleton */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/50">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48 mt-1" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-6 space-y-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Profit & Loss Account Section Skeleton */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/50">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-48 mt-1" />
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

                {/* Summary Card Skeleton */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b border-border/50">
                        <Skeleton className="h-6 w-32" />
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
                        <p className="text-muted-foreground">No profit & loss data found for the selected period.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isProfit = data.profitBeforeTax >= 0;
    const profitLabel = isProfit ? "Net Profit" : "Net Loss";

    return (
        <div className="space-y-6">
            {/* Trading Account Section */}
            <TradingAccountSection
                tradingAccount={data.tradingAccount}
                grossProfit={data.grossProfit}
                dateRange={dateRange}
            />

            {/* Profit & Loss Account Section */}
            <ProfitLossAccountSection
                profitLossAccount={data.profitLossAccount}
                grossProfit={data.grossProfit}
                profitBeforeTax={data.profitBeforeTax}
                dateRange={dateRange}
            />

            {/* Summary Card */}
            <Card className={`shadow-sm border-2 ${isProfit ? 'border-green-500/20 bg-green-50/30' : 'border-red-500/20 bg-red-50/30'}`}>
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <span className={isProfit ? 'text-green-900' : 'text-red-900'}>Financial Summary</span>
                        <Badge variant={isProfit ? "default" : "destructive"} className={isProfit ? "bg-green-500" : ""}>
                            {profitLabel}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Gross Profit</p>
                            <p className={`text-2xl font-bold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{data.grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p>
                            <p className="text-2xl font-bold text-foreground">
                                ₹{data.profitLossAccount.totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-card border border-border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit Before Tax</p>
                            <p className={`text-2xl font-bold ${data.profitBeforeTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{data.profitBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}