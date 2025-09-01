import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChartOfAccount, AccountClass } from "@/integrations/supabase/manager-types";

export default function ManagerChartOfAccounts() {
    const { profile } = useAuth();
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!profile?.company_id) return;

            try {
                const { data, error } = await supabase
                    .from('chart_of_accounts')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .is('deleted_at', null)
                    .order('account_code');

                if (error) throw error;
                setAccounts(data || []);
            } catch (error) {
                console.error('Error fetching accounts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [profile?.company_id]);

    const filteredAccounts = accounts.filter(account =>
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAccountClassColor = (accountClass: AccountClass) => {
        switch (accountClass) {
            case 'ASSET':
                return 'bg-green-100 text-green-800';
            case 'LIABILITY':
                return 'bg-red-100 text-red-800';
            case 'EQUITY':
                return 'bg-blue-100 text-blue-800';
            case 'REVENUE':
                return 'bg-purple-100 text-purple-800';
            case 'EXPENSE':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const accountsByClass = filteredAccounts.reduce((acc, account) => {
        if (!acc[account.account_class]) {
            acc[account.account_class] = [];
        }
        acc[account.account_class].push(account);
        return acc;
    }, {} as Record<AccountClass, ChartOfAccount[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading accounts...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Chart of Accounts</h1>
                        <p className="text-gray-600">Manage your company's accounting structure</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search accounts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Add Account</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as AccountClass[]).map((accountClass) => {
                    const classAccounts = accountsByClass[accountClass] || [];
                    const getGradientColor = (accountClass: AccountClass) => {
                        switch (accountClass) {
                            case 'ASSET':
                                return 'from-green-50 to-green-100/50';
                            case 'LIABILITY':
                                return 'from-red-50 to-red-100/50';
                            case 'EQUITY':
                                return 'from-blue-50 to-blue-100/50';
                            case 'REVENUE':
                                return 'from-purple-50 to-purple-100/50';
                            case 'EXPENSE':
                                return 'from-orange-50 to-orange-100/50';
                            default:
                                return 'from-gray-50 to-gray-100/50';
                        }
                    };

                    return (
                        <Card key={accountClass} className={`rounded-xl border border-gray-100/50 bg-gradient-to-br ${getGradientColor(accountClass)} hover:shadow-sm transition-all duration-200`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-gray-700">{accountClass}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{classAccounts.length}</div>
                                <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getAccountClassColor(accountClass)}`}>
                                    {classAccounts.filter(a => a.is_active).length} active
                                </Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Accounts by Class */}
            <div className="space-y-6">
                {Object.entries(accountsByClass).map(([accountClass, classAccounts]) => (
                    <Card key={accountClass} className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Badge className={`rounded-full px-3 py-1 ${getAccountClassColor(accountClass as AccountClass)}`}>
                                        {accountClass}
                                    </Badge>
                                    {classAccounts.length} accounts
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/30">
                                        <TableRow className="hover:bg-gray-50/30">
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Code</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Account Name</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Type</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {classAccounts.map((account) => (
                                            <TableRow key={account.id} className="hover:bg-gray-50/20 transition-colors">
                                                <TableCell className="py-4 px-6 font-mono text-sm">
                                                    {account.account_code || 'N/A'}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 font-medium">
                                                    {account.account_name}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <span className="text-sm text-gray-600">
                                                        {account.account_type || 'General'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge variant={account.is_active ? "default" : "secondary"} className="rounded-full px-3 py-1">
                                                        {account.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right py-4 px-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-3 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 text-xs"
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
                ))}
            </div>

            {filteredAccounts.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm ? 'Try adjusting your search criteria or clear filters to see all accounts' : 'Start by adding your first account to build your chart of accounts'}
                            </p>
                            {(!searchTerm) && (
                                <Button
                                    className="bg-green-600 hover:bg-green-700 rounded-full px-6 transition-colors"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Account
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
