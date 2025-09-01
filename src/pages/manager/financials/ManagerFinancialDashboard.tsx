import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, CreditCard, PieChart, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinancialMetrics {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalReceivables: number;
    totalPayables: number;
    cashFlow: number;
    bankBalance: number;
}

interface MonthlyData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export default function ManagerFinancialDashboard() {
    const { profile } = useAuth();
    const [metrics, setMetrics] = useState<FinancialMetrics>({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        totalReceivables: 0,
        totalPayables: 0,
        cashFlow: 0,
        bankBalance: 0,
    });
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancialData = async () => {
            if (!profile?.company_id) return;

            try {
                // Fetch dashboard overview
                const { data: dashboardData, error: dashboardError } = await (supabase as any)
                    .rpc('get_dashboard_overview', { p_company_id: profile.company_id });

                if (dashboardError) {
                    console.error('Error fetching dashboard data:', dashboardError);
                } else if (dashboardData) {
                    const revenue = dashboardData.total_revenue || 0;
                    const expenses = dashboardData.total_expenses || 0;
                    const netProfit = revenue - expenses;
                    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

                    setMetrics({
                        totalRevenue: revenue,
                        totalExpenses: expenses,
                        netProfit,
                        profitMargin,
                        totalReceivables: dashboardData.total_receivables || 0,
                        totalPayables: dashboardData.total_payables || 0,
                        cashFlow: netProfit, // Simplified cash flow calculation
                        bankBalance: (dashboardData.total_bank_balance || 0) + (dashboardData.total_cash_balance || 0),
                    });
                }

                // Generate sample monthly data (in a real app, this would come from the database)
                const sampleMonthlyData: MonthlyData[] = [
                    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
                    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000 },
                    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000 },
                    { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000 },
                    { month: 'May', revenue: 55000, expenses: 36000, profit: 19000 },
                    { month: 'Jun', revenue: 67000, expenses: 41000, profit: 26000 },
                ];
                setMonthlyData(sampleMonthlyData);

            } catch (error) {
                console.error('Error fetching financial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinancialData();
    }, [profile?.company_id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading financial data...</span>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
                    <p className="text-gray-600">Monitor your company's financial performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-10 px-4 rounded-full border-0 bg-gray-100 hover:bg-gray-200"
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                    <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-full">
                        <PieChart className="mr-2 h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Key Financial Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</div>
                        <div className="flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                            <p className="text-xs text-green-600">+12.5% from last month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                        <CreditCard className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalExpenses)}</div>
                        <div className="flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-red-600 mr-1" />
                            <p className="text-xs text-red-600">+8.2% from last month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.netProfit)}</div>
                        <div className="flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                            <p className="text-xs text-green-600">+18.7% from last month</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
                        <PieChart className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.profitMargin)}</div>
                        <div className="flex items-center mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                            <p className="text-xs text-green-600">+2.1% from last month</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
                {/* Cash Flow Overview */}
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Cash Flow Overview</CardTitle>
                        <CardDescription>Current financial position</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-green-900">Cash & Bank Balance</p>
                                    <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.bankBalance)}</p>
                                </div>
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-green-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs font-medium text-blue-900 mb-1">Receivables</p>
                                    <p className="text-lg font-bold text-blue-900">{formatCurrency(metrics.totalReceivables)}</p>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <p className="text-xs font-medium text-orange-900 mb-1">Payables</p>
                                    <p className="text-lg font-bold text-orange-900">{formatCurrency(metrics.totalPayables)}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">Net Cash Flow</p>
                                    <Badge variant={metrics.cashFlow >= 0 ? "default" : "destructive"} className="rounded-full">
                                        {metrics.cashFlow >= 0 ? "Positive" : "Negative"}
                                    </Badge>
                                </div>
                                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(metrics.cashFlow)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Performance */}
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Monthly Performance</CardTitle>
                        <CardDescription>Revenue, expenses, and profit trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {monthlyData.slice(-3).map((data, index) => (
                                <div key={data.month} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{data.month} 2024</h4>
                                        <Badge variant="outline" className="rounded-full">
                                            {formatPercentage((data.profit / data.revenue) * 100)} margin
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Revenue</p>
                                            <p className="font-semibold text-green-600">{formatCurrency(data.revenue)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Expenses</p>
                                            <p className="font-semibold text-red-600">{formatCurrency(data.expenses)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Profit</p>
                                            <p className="font-semibold text-blue-600">{formatCurrency(data.profit)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Health Indicators */}
            <Card className="rounded-lg border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Financial Health Indicators</CardTitle>
                    <CardDescription>Key ratios and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900 mb-1">
                                {formatPercentage(metrics.profitMargin)}
                            </div>
                            <p className="text-sm text-blue-700 font-medium">Profit Margin</p>
                            <p className="text-xs text-blue-600 mt-1">Industry avg: 15%</p>
                        </div>

                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-900 mb-1">
                                {(metrics.totalReceivables / (metrics.totalRevenue || 1) * 30).toFixed(0)} days
                            </div>
                            <p className="text-sm text-green-700 font-medium">Avg Collection</p>
                            <p className="text-xs text-green-600 mt-1">Target: 30 days</p>
                        </div>

                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-900 mb-1">
                                {((metrics.totalReceivables + metrics.bankBalance) / (metrics.totalPayables || 1)).toFixed(1)}
                            </div>
                            <p className="text-sm text-purple-700 font-medium">Current Ratio</p>
                            <p className="text-xs text-purple-600 mt-1">Healthy: {'>'}1.5</p>
                        </div>

                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-900 mb-1">
                                {formatPercentage((metrics.totalRevenue / (metrics.totalRevenue + metrics.totalExpenses || 1)) * 100)}
                            </div>
                            <p className="text-sm text-orange-700 font-medium">Revenue Efficiency</p>
                            <p className="text-xs text-orange-600 mt-1">Target: {'>'}60%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
