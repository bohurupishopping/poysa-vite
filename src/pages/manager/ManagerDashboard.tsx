import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Package, ShoppingCart, Receipt, AlertCircle, Target } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
    totalRevenue: number;
    totalExpenses: number;
    totalReceivables: number;
    totalPayables: number;
    totalBankBalance: number;
    totalCashBalance: number;
}

interface DashboardOverviewResponse {
    total_revenue: number;
    total_expenses: number;
    total_receivables: number;
    total_payables: number;
    total_bank_balance: number;
    total_cash_balance: number;
}

interface RecentActivity {
    id: string;
    type: 'invoice' | 'bill' | 'payment';
    description: string;
    amount: number;
    date: string;
    status: string;
}

interface PerformanceTarget {
    id: string;
    name: string;
    target_value: number;
    current_value: number;
    metric: string;
    period: string;
    progress: number;
}

export default function ManagerDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        totalExpenses: 0,
        totalReceivables: 0,
        totalPayables: 0,
        totalBankBalance: 0,
        totalCashBalance: 0,
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [performanceTargets, setPerformanceTargets] = useState<PerformanceTarget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!profile?.company_id) return;

            try {
                // Fetch dashboard overview using the stored function
                const { data: dashboardData, error: dashboardError } = await supabase
                    .rpc('get_dashboard_overview', { p_company_id: profile.company_id });

                if (dashboardError) {
                    console.error('Error fetching dashboard data:', dashboardError);
                } else if (dashboardData) {
                    const typedData = dashboardData as DashboardOverviewResponse;
                    setStats({
                        totalRevenue: typedData.total_revenue || 0,
                        totalExpenses: typedData.total_expenses || 0,
                        totalReceivables: typedData.total_receivables || 0,
                        totalPayables: typedData.total_payables || 0,
                        totalBankBalance: typedData.total_bank_balance || 0,
                        totalCashBalance: typedData.total_cash_balance || 0,
                    });
                }

                // Fetch recent invoices for activity
                const { data: invoicesData } = await supabase
                    .from('sales_invoices')
                    .select('id, invoice_number, total_amount, invoice_date, status')
                    .eq('company_id', profile.company_id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Fetch recent bills for activity
                const { data: billsData } = await supabase
                    .from('purchase_bills')
                    .select('id, bill_number, total_amount, bill_date, status')
                    .eq('company_id', profile.company_id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Combine and format recent activity
                const activities: RecentActivity[] = [];

                invoicesData?.forEach(invoice => {
                    activities.push({
                        id: invoice.id,
                        type: 'invoice',
                        description: `Invoice ${invoice.invoice_number}`,
                        amount: invoice.total_amount,
                        date: invoice.invoice_date,
                        status: invoice.status
                    });
                });

                billsData?.forEach(bill => {
                    activities.push({
                        id: bill.id,
                        type: 'bill',
                        description: `Bill ${bill.bill_number || 'Draft'}`,
                        amount: bill.total_amount,
                        date: bill.bill_date,
                        status: bill.status
                    });
                });

                // Sort by date and take top 8
                activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecentActivity(activities.slice(0, 8));

                // Fetch performance targets
                const { data: targetsData } = await supabase
                    .from('sales_targets')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .eq('status', 'ACTIVE')
                    .limit(4);

                if (targetsData) {
                    const formattedTargets = targetsData.map(target => ({
                        ...target,
                        current_value: 0, // This would need to be calculated based on actual performance
                        progress: 0 // This would need to be calculated
                    }));
                    setPerformanceTargets(formattedTargets);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [profile?.company_id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'sent':
            case 'submitted':
                return 'bg-blue-100 text-blue-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            case 'partially_paid':
                return 'bg-yellow-100 text-yellow-800';
            case 'void':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'invoice':
                return <Receipt className="h-4 w-4 text-green-600" />;
            case 'bill':
                return <ShoppingCart className="h-4 w-4 text-orange-600" />;
            case 'payment':
                return <DollarSign className="h-4 w-4 text-blue-600" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading dashboard...</span>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
                    <p className="text-gray-600">Company overview and performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-10 px-4 rounded-full border-0 bg-gray-100 hover:bg-gray-200"
                    >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                    <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-full">
                        <Receipt className="mr-2 h-4 w-4" />
                        New Invoice
                    </Button>
                </div>
            </div>

            {/* Financial Overview */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-gray-500 mt-1">Current month</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Monthly Expenses</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</div>
                        <p className="text-xs text-gray-500 mt-1">Current month</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Receivables</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalReceivables)}</div>
                        <p className="text-xs text-gray-500 mt-1">Outstanding amount</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Cash & Bank</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatCurrency(stats.totalBankBalance + stats.totalCashBalance)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Available balance</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
                {/* Recent Activity */}
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                        <CardDescription>Latest transactions and documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getActivityIcon(activity.type)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                                <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(activity.amount)}</p>
                                            <Badge variant="outline" className={`text-xs rounded-full ${getStatusColor(activity.status)}`}>
                                                {activity.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Targets */}
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900">Performance Targets</CardTitle>
                        <CardDescription>Track your goals and achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {performanceTargets.length > 0 ? (
                                performanceTargets.map((target) => (
                                    <div key={target.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-blue-600" />
                                                <p className="text-sm font-medium text-gray-900">{target.name}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs rounded-full">
                                                {target.period}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>{formatCurrency(target.current_value)}</span>
                                                <span>{formatCurrency(target.target_value)}</span>
                                            </div>
                                            <Progress value={target.progress} className="h-2" />
                                            <p className="text-xs text-gray-500">{target.progress}% of target achieved</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p>No performance targets set</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        Set Targets
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="rounded-lg border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200">
                            <Receipt className="h-6 w-6 text-blue-600" />
                            <span className="text-sm font-medium">Create Invoice</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-200">
                            <DollarSign className="h-6 w-6 text-green-600" />
                            <span className="text-sm font-medium">Record Payment</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200">
                            <Package className="h-6 w-6 text-orange-600" />
                            <span className="text-sm font-medium">Add Product</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                            <span className="text-sm font-medium">View Reports</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}