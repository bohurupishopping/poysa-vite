import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportRow } from './ReportRow';
import { BalanceSheetNode } from '@/integrations/supabase/manager-types';

interface LiabilityEquitySideProps {
    liabilities: Record<string, BalanceSheetNode>;
    equity: {
        share_capital: BalanceSheetNode;
        reserves_and_surplus: BalanceSheetNode;
        current_period_profit: BalanceSheetNode;
    };
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
}

export function LiabilityEquitySide({
    liabilities,
    equity,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity
}: LiabilityEquitySideProps) {
    const liabilityEntries = Object.entries(liabilities).filter(([_, node]) => node.total !== 0);
    const equityEntries = Object.entries(equity).filter(([_, node]) => node.total !== 0);

    return (
        <Card className="shadow-sm h-fit">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-between">
                    <span>LIABILITIES & EQUITY</span>
                    <span className="text-lg font-bold text-foreground">
                        ₹{totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6 space-y-6">
                    {/* Equity Section */}
                    {equityEntries.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                <h4 className="font-semibold text-foreground">Equity</h4>
                                <span className="text-foreground font-medium">
                                    ₹{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="space-y-2 pl-1">
                                {equityEntries.map(([key, node]) => (
                                    <ReportRow
                                        key={key}
                                        node={node}
                                    />
                                ))}
                                {equityEntries.length > 1 && (
                                    <div className="pt-2 border-t border-border/50 mt-1">
                                        <ReportRow
                                            label="Total Equity"
                                            value={totalEquity}
                                            isSubtotal={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Liabilities Section */}
                    {liabilityEntries.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                <h4 className="font-semibold text-foreground">Liabilities</h4>
                                <span className="text-foreground font-medium">
                                    ₹{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="space-y-2 pl-1">
                                {liabilityEntries.map(([key, node]) => (
                                    <ReportRow
                                        key={key}
                                        node={node}
                                    />
                                ))}
                                {liabilityEntries.length > 1 && (
                                    <div className="pt-2 border-t border-border/50 mt-1">
                                        <ReportRow
                                            label="Total Liabilities"
                                            value={totalLiabilities}
                                            isSubtotal={true}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Show message if no data */}
                    {liabilityEntries.length === 0 && equityEntries.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-muted-foreground">No liability or equity data available</p>
                        </div>
                    )}

                    {/* Total Liabilities & Equity */}
                    {(liabilityEntries.length > 0 || equityEntries.length > 0) && (
                        <div className="pt-4 border-t border-border/50 mt-2">
                            <ReportRow
                                label="Total Liabilities & Equity"
                                value={totalLiabilitiesAndEquity}
                                isTotal={true}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}