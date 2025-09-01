import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportRow } from './ReportRow';
import { BalanceSheetNode } from '@/integrations/supabase/manager-types';

interface AssetSideProps {
    assets: Record<string, BalanceSheetNode>;
    totalAssets: number;
}

export function AssetSide({ assets, totalAssets }: AssetSideProps) {
    const assetEntries = Object.entries(assets).filter(([_, node]) => node.total !== 0);

    return (
        <Card className="shadow-sm h-fit">
            <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-between">
                    <span>ASSETS</span>
                    <span className="text-lg font-bold text-foreground">
                        ₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6 space-y-3">
                    {assetEntries.length > 0 ? (
                        <>
                            {assetEntries.map(([key, node]) => (
                                <ReportRow
                                    key={key}
                                    node={node}
                                />
                            ))}

                            {/* Total Assets */}
                            <div className="pt-4 border-t border-border/50 mt-2">
                                <ReportRow
                                    label="Total Assets"
                                    value={totalAssets}
                                    isTotal={true}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-muted-foreground">No asset data available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}