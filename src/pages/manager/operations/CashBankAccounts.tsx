import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Banknote, Eye, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { CashBankAccountService } from "@/services/cashBankAccountService";
import { CashBankAccountWithBalance } from "@/types/cashBankAccount";

export default function CashBankAccounts() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<CashBankAccountWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!profile?.company_id) return;

            try {
                const accountsWithBalances = await CashBankAccountService.getAccountsWithBalances(profile.company_id);
                setAccounts(accountsWithBalances);
            } catch (error) {
                console.error('Error fetching cash/bank accounts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [profile?.company_id]);

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch =
            account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.account_type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "all" || account.account_type === typeFilter;

        return matchesSearch && matchesType;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Bank':
                return 'bg-blue-100 text-blue-800';
            case 'Cash':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Bank':
                return <Building2 className="h-4 w-4" />;
            case 'Cash':
                return <Banknote className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    const getTypeCounts = () => {
        return {
            all: accounts.length,
            Bank: accounts.filter(a => a.account_type === 'Bank').length,
            Cash: accounts.filter(a => a.account_type === 'Cash').length,
            active: accounts.filter(a => a.is_active).length,
            inactive: accounts.filter(a => !a.is_active).length,
        };
    };

    const typeCounts = getTypeCounts();
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const bankBalance = accounts.filter(a => a.account_type === 'Bank').reduce((sum, account) => sum + account.balance, 0);
    const cashBalance = accounts.filter(a => a.account_type === 'Cash').reduce((sum, account) => sum + account.balance, 0);

    const handleDeleteAccount = async (accountId: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        
        try {
            await CashBankAccountService.deleteAccount(accountId);
            setAccounts(accounts.filter(account => account.id !== accountId));
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again.');
        }
    };

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
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Cash & Bank Accounts</h1>
                        <p className="text-gray-600">Manage your cash and bank account balances</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search and Filter */}
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
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types ({typeCounts.all})</SelectItem>
                                    <SelectItem value="Bank">Bank ({typeCounts.Bank})</SelectItem>
                                    <SelectItem value="Cash">Cash ({typeCounts.Cash})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                onClick={() => navigate('/manager/operations/cash-bank/create')}
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Add Account</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{formatCurrency(totalBalance)}</div>
                        <p className="text-xs text-blue-600/70">{typeCounts.active} active accounts</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Bank Accounts</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{formatCurrency(bankBalance)}</div>
                        <p className="text-xs text-blue-600/70">{typeCounts.Bank} bank accounts</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Cash Accounts</CardTitle>
                        <Banknote className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{formatCurrency(cashBalance)}</div>
                        <p className="text-xs text-green-600/70">{typeCounts.Cash} cash accounts</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Total Accounts</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{typeCounts.all}</div>
                        <p className="text-xs text-purple-600/70">Active & inactive</p>
                    </CardContent>
                </Card>
            </div>

            {/* Accounts Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Account Name</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Type</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Balance</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAccounts.map((account) => (
                                    <TableRow key={account.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-50">
                                                    {getTypeIcon(account.account_type)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{account.account_name}</div>
                                                    <div className="text-sm text-gray-500">ID: {account.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getTypeColor(account.account_type)}`}>
                                                {account.account_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(account.balance)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant={account.is_active ? "default" : "secondary"} className="rounded-full px-3 py-1">
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    onClick={() => navigate(`/manager/operations/cash-bank/${account.id}/transactions`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    onClick={() => navigate(`/manager/operations/cash-bank/edit/${account.id}`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteAccount(account.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs"
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

            {filteredAccounts.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Banknote className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || typeFilter !== "all"
                                    ? 'Try adjusting your search criteria or clear filters to see all accounts'
                                    : 'Create your first cash or bank account to get started with managing your finances'
                                }
                            </p>
                            {(!searchTerm && typeFilter === "all") && (
                                <Button
                                    onClick={() => navigate('/manager/operations/cash-bank/create')}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
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