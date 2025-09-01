import { useProfitAndLoss } from '@/hooks/useProfitAndLoss';
import { DateRangeFilter } from '@/components/profit-loss/DateRangeFilter';
import { ProfitAndLossStatement } from '@/components/profit-loss/ProfitAndLossStatement';
import { AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfitAndLoss() {
    const { data, isLoading, error, dateRange, setDateRange, refetch } = useProfitAndLoss();

    if (error) {
        return (
            <div className="container py-8">
                <Card className="max-w-2xl mx-auto border-destructive/50">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-destructive/10">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-foreground mb-1">Error Loading Profit & Loss Statement</h3>
                                <p className="text-muted-foreground text-sm">{error}</p>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={refetch}
                                    className="mt-4"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Header Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Title and Description */}
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
                                <p className="text-gray-600 mt-1">
                                    Financial performance overview with detailed breakdown
                                </p>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <DateRangeFilter
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <ProfitAndLossStatement
                        data={data}
                        isLoading={isLoading}
                        dateRange={dateRange}
                    />
                </div>
            </div>
        </div>
    );
}