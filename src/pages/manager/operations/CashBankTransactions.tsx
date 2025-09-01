import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, RefreshCw, Receipt, AlertCircle, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CashBankAccountService } from "@/services/cashBankAccountService";
import { CashBankAccount, BankTransaction } from "@/types/cashBankAccount";
import { format, subDays, startOfMonth, subMonths } from "date-fns";

interface QuickFilterOption {
    label: string;
    days: number;
}

const quickFilters: QuickFilterOption[] = [
    { label: "Last 30 Days", days: 30 },
    { label: "Last 3 Months", days: 90 },
    { label: "Last 6 Months", days: 180 },
    { label: "This Year", days: 365 },
];

export default function CashBankTransactions() {
    const navigate = useNavigate();
    const { accountId } = useParams();
    const [account, setAccount] = useState<CashBankAccount | null>(null);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    

    
    // Date filtering
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return format(subMonths(startOfMonth(date), 3), 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    useEffect(() => {
        if (accountId) {
            fetchAccountData();
            fetchTransactions();
        }
    }, [accountId, startDate, endDate]);

    const fetchAccountData = async () => {
        if (!accountId) return;

        try {
            const accountData = await CashBankAccountService.getAccountById(accountId);
            setAccount(accountData);
        } catch (error) {
            console.error('Error fetching account:', error);
            setError(`Failed to load account information: ${error}`);
        }
    };

    const fetchTransactions = async () => {
        if (!accountId) return;

        setLoading(true);
        setError(null);

        try {
            const [transactionsData, balance] = await Promise.all([
                CashBankAccountService.getAccountTransactions(
                    accountId,
                    new Date(startDate),
                    new Date(endDate)
                ),
                CashBankAccountService.getAccountBalance(accountId)
            ]);

            setTransactions(transactionsData);
            setCurrentBalance(balance);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError(`Failed to load transactions: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFilter = (days: number) => {
        const end = new Date();
        const start = subDays(end, days);
        setTempStartDate(format(start, 'yyyy-MM-dd'));
        setTempEndDate(format(end, 'yyyy-MM-dd'));
    };

    const applyDateFilter = () => {
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setDateFilterOpen(false);
    };

    const getDocumentTypeLabel = (documentType: string) => {
        const labels: Record<string, string> = {
            'sales_invoice': 'Sales Invoice',
            'purchase_bill': 'Purchase Bill',
            'invoice_payment': 'Invoice Payment',
            'bill_payment': 'Bill Payment',
            'journal_voucher': 'Journal Entry',
        };
        return labels[documentType] || documentType.replace(/_/g, ' ').toUpperCase();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (!account && !loading) {
        return (
            <div className="p-6 lg:p-8">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested account could not be found.</p>
                    <Button onClick={() => navigate('/manager/operations/cash-bank')}>
                        Back to Accounts
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        onClick={() => navigate('/manager/operations/cash-bank')}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    
                    <div className="flex items-center gap-2">
                        <Dialog open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Filter Dates
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Filter by Date Range</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600 mb-3 block">
                                            Quick Filters
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {quickFilters.map((filter) => (
                                                <Button
                                                    key={filter.label}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleQuickFilter(filter.days)}
                                                    className="text-xs"
                                                >
                                                    {filter.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="start-date">Start Date</Label>
                                            <Input
                                                id="start-date"
                                                type="date"
                                                value={tempStartDate}
                                                onChange={(e) => setTempStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="end-date">End Date</Label>
                                            <Input
                                                id="end-date"
                                                type="date"
                                                value={tempEndDate}
                                                onChange={(e) => setTempEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-4">
                                        <Button onClick={applyDateFilter} className="flex-1">
                                            Apply Filter
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setDateFilterOpen(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        <Button
                            onClick={fetchTransactions}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
                
                {account && (
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                            account.account_type === 'Cash' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                        }`}>
                            {account.account_type === 'Cash' ? (
                                <Receipt className="h-5 w-5" />
                            ) : (
                                <ArrowLeft className="h-5 w-5" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                {account.account_name}
                            </h1>
                            <p className="text-gray-600">
                                {account.account_type} Account Transactions
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Balance Card */}
            {account && (
                <Card className={`mb-6 border-l-4 ${
                    account.account_type === 'Cash' 
                        ? 'border-l-green-500 bg-green-50/50' 
                        : 'border-l-blue-500 bg-blue-50/50'
                }`}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Current Balance
                                </p>
                                <p className={`text-2xl font-bold ${
                                    account.account_type === 'Cash' ? 'text-green-600' : 'text-blue-600'
                                }`}>
                                    {formatCurrency(currentBalance)}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {format(new Date(startDate), 'MMM dd')} - {format(new Date(endDate), 'MMM dd, yyyy')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Transactions Table */}
            <Card className="rounded-xl border border-gray-100/50">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Transaction History</span>
                        {transactions.length > 0 && (
                            <Badge variant="secondary">
                                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading transactions...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={fetchTransactions} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </Button>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                            <p className="text-gray-600">This account has no transaction history for the selected period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Document Type
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {transactions.map((transaction, index) => {
                                        const isDebit = transaction.debit_amount !== undefined && transaction.debit_amount > 0;
                                        const amount = isDebit ? transaction.debit_amount! : transaction.credit_amount!;
                                        const amountColor = isDebit ? 'text-green-600' : 'text-red-600';
                                        const bgColor = isDebit ? 'bg-green-50' : 'bg-red-50';
                                        const iconColor = isDebit ? 'text-green-600' : 'text-red-600';

                                        return (
                                            <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${bgColor}`}>
                                                        {isDebit ? (
                                                            <Plus className={`h-4 w-4 ${iconColor}`} />
                                                        ) : (
                                                            <Minus className={`h-4 w-4 ${iconColor}`} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(transaction.transaction_date), 'HH:mm')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                        {transaction.particular || 'Transaction'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {transaction.source_document_type && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {getDocumentTypeLabel(transaction.source_document_type)}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className={`text-sm font-semibold ${amountColor}`}>
                                                        {isDebit ? '+' : '-'}{formatCurrency(amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {formatCurrency(transaction.running_balance)}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
