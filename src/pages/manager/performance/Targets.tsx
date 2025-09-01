import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Target, TrendingUp, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { PerformanceTargetWithProgress, TargetStatus, TargetMetric, TargetPeriod } from "@/integrations/supabase/manager-types";
import { ViewTargetModal } from "@/components/modals/ViewTargetModal";
import { CreateTargetModal } from "@/components/modals/CreateTargetModal";
import { SalesTargetService } from "@/services/salesTargetService";

export default function ManagerTargets() {
    const { profile } = useAuth();
    const [targets, setTargets] = useState<PerformanceTargetWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [metricFilter, setMetricFilter] = useState<string>("all");
    const [selectedTarget, setSelectedTarget] = useState<PerformanceTargetWithProgress | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchTargets = async () => {
        if (!profile?.company_id) return;

        try {
            const targetsWithProgress = await SalesTargetService.fetchSalesTargets(profile.company_id);
            setTargets(targetsWithProgress);
        } catch (error) {
            console.error('Error fetching targets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, [profile?.company_id]);

    const handleViewTarget = (target: PerformanceTargetWithProgress) => {
        setSelectedTarget(target);
        setIsViewModalOpen(true);
    };

    const handleCreateTarget = () => {
        setIsCreateModalOpen(true);
    };

    const handleTargetCreated = () => {
        fetchTargets(); // Refresh the targets list
        setIsCreateModalOpen(false);
    };

    const filteredTargets = targets.filter(target => {
        const matchesSearch =
            target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            target.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || target.status === statusFilter as TargetStatus;
        const matchesMetric = metricFilter === "all" || target.metric === metricFilter as TargetMetric;

        return matchesSearch && matchesStatus && matchesMetric;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatValue = (value: number, metric: TargetMetric) => {
        switch (metric) {
            case 'REVENUE':
            case 'PROFIT':
                return formatCurrency(value);
            case 'QUANTITY_SOLD':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    };

    const getStatusColor = (status: TargetStatus) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-blue-100 text-blue-800';
            case 'ACHIEVED':
                return 'bg-green-100 text-green-800';
            case 'MISSED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getMetricColor = (metric: TargetMetric) => {
        switch (metric) {
            case 'REVENUE':
                return 'bg-green-100 text-green-800';
            case 'PROFIT':
                return 'bg-blue-100 text-blue-800';
            case 'QUANTITY_SOLD':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPeriodColor = (period: TargetPeriod) => {
        switch (period) {
            case 'MONTHLY':
                return 'bg-orange-100 text-orange-800';
            case 'QUARTERLY':
                return 'bg-blue-100 text-blue-800';
            case 'YEARLY':
                return 'bg-purple-100 text-purple-800';
            case 'CUSTOM':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusCounts = () => {
        return {
            all: targets.length,
            ACTIVE: targets.filter(t => t.status === 'ACTIVE').length,
            ACHIEVED: targets.filter(t => t.status === 'ACHIEVED').length,
            MISSED: targets.filter(t => t.status === 'MISSED').length,
        };
    };

    const statusCounts = getStatusCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading targets...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Performance Targets</h1>
                        <p className="text-gray-600">Track and manage your business goals</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search and Filter in same row as buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search targets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
                                    <SelectItem value="ACTIVE">Active ({statusCounts.ACTIVE})</SelectItem>
                                    <SelectItem value="ACHIEVED">Achieved ({statusCounts.ACHIEVED})</SelectItem>
                                    <SelectItem value="MISSED">Missed ({statusCounts.MISSED})</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={metricFilter} onValueChange={setMetricFilter}>
                                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                    <SelectValue placeholder="Filter by metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Metrics</SelectItem>
                                    <SelectItem value="REVENUE">Revenue</SelectItem>
                                    <SelectItem value="PROFIT">Profit</SelectItem>
                                    <SelectItem value="QUANTITY_SOLD">Quantity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                variant="outline"
                                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-0 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Analytics</span>
                            </Button>
                            <Button
                                onClick={handleCreateTarget}
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">New Target</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Targets</CardTitle>
                        <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{statusCounts.all}</div>
                        <p className="text-xs text-blue-600/70">All periods</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700">Active</CardTitle>
                        <Target className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{statusCounts.ACTIVE}</div>
                        <p className="text-xs text-orange-600/70">In progress</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Achieved</CardTitle>
                        <Target className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{statusCounts.ACHIEVED}</div>
                        <p className="text-xs text-green-600/70">Completed</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">
                            {statusCounts.all > 0
                                ? Math.round((statusCounts.ACHIEVED / statusCounts.all) * 100)
                                : 0
                            }%
                        </div>
                        <p className="text-xs text-purple-600/70">Achievement rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Targets Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Target</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Period</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Metric</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Target Value</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Current</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Progress</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTargets.map((target) => (
                                    <TableRow key={target.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div>
                                                <div className="font-medium text-gray-900">{target.name}</div>
                                                {target.product && (
                                                    <div className="text-sm text-gray-500">
                                                        Product: {target.product.name}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div>
                                                <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getPeriodColor(target.period)}`}>
                                                    {target.period}
                                                </Badge>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(target.start_date).toLocaleDateString()} - {new Date(target.end_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getMetricColor(target.metric)}`}>
                                                {target.metric.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatValue(target.target_value, target.metric)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatValue(target.current_value, target.metric)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="space-y-2">
                                                <Progress value={target.progress_percentage} className="h-2" />
                                                <div className="text-xs text-gray-500">
                                                    {Math.round(target.progress_percentage)}% complete
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getStatusColor(target.status)}`}>
                                                {target.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 text-xs"
                                                    onClick={() => handleViewTarget(target)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 text-xs"
                                                >
                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredTargets.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Target className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No targets found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || statusFilter !== "all" || metricFilter !== "all"
                                    ? 'Try adjusting your search criteria or clear filters to see all targets'
                                    : 'Create your first performance target to get started with tracking your business goals'
                                }
                            </p>
                            {(!searchTerm && statusFilter === "all" && metricFilter === "all") && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 rounded-full px-6 transition-colors"
                                    onClick={handleCreateTarget}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Target
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modals */}
            {selectedTarget && (
                <ViewTargetModal
                    target={selectedTarget}
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}

            <CreateTargetModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTargetCreated={handleTargetCreated}
            />
        </div>
    );
}
