import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  RefreshCw,
  Download,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Receipt,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupplierService } from '../../../services/supplierService';
import { Supplier } from '@/integrations/supabase/manager-types';

// UI Constants
const UI_CONSTANTS = {
  colors: {
    primary: '#6366F1', // Indigo
    success: '#10B981', // Emerald
    danger: '#EF4444', // Red
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    border: '#E2E8F0',
    surface: '#FFFFFF'
  },
  spacing: {
    pagePadding: 20,
    borderRadius: 16,
    cardRadius: 16
  }
};

interface Transaction {
  id: string;
  supplier_id: string;
  transaction_date: string;
  narration: string;
  debit: number | null;
  credit: number | null;
  running_balance: number;
  source_document_type: string;
  source_document_id: string | null;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export default function SupplierTransactions() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });
  
  const pageSize = 20;

  const loadTransactions = useCallback(async () => {
    if (!supplierId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1);
      
      const [transactionsData, balance, supplierData] = await Promise.all([
        SupplierService.getSupplierTransactions(supplierId, {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          page: 1,
          limit: pageSize
        }),
        SupplierService.getSupplierBalance(supplierId),
        SupplierService.getSupplier(supplierId)
      ]);
      
      setTransactions(transactionsData);
      setCurrentBalance(balance);
      setSupplier(supplierData);
      setHasMoreData(transactionsData.length === pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [supplierId, dateRange]);

  const loadMoreTransactions = useCallback(async () => {
    if (!supplierId || isLoadingMore || !hasMoreData) return;
    
    try {
      setIsLoadingMore(true);
      
      const nextPage = currentPage + 1;
      const transactionsData = await SupplierService.getSupplierTransactions(supplierId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: nextPage,
        limit: pageSize
      });
      
      setTransactions(prev => [...prev, ...transactionsData]);
      setCurrentPage(nextPage);
      setHasMoreData(transactionsData.length === pageSize);
    } catch (err) {
      console.error('Failed to load more transactions:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [supplierId, currentPage, dateRange, isLoadingMore, hasMoreData]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({
      startDate: new Date(start),
      endDate: new Date(end)
    });
  };

  const downloadPDF = async () => {
    if (!supplierId || !supplier) return;
    
    try {
      // Get all transactions for PDF
      const allTransactions = await SupplierService.getSupplierTransactions(supplierId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page: 1,
        limit: 10000
      });
      
      // Create and download PDF (simplified version)
      const filename = `Supplier_Statement_${supplier.name}_${dateRange.startDate.toISOString().split('T')[0]}_to_${dateRange.endDate.toISOString().split('T')[0]}.pdf`;
      console.log('PDF download would start for:', filename, allTransactions.length, 'transactions');
      // TODO: Implement actual PDF generation
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        loadMoreTransactions();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <span className="ml-2" style={{ color: UI_CONSTANTS.colors.textSecondary }}>Loading transactions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={loadTransactions} error={error} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: UI_CONSTANTS.colors.background }}>
      {/* Header */}
      <div style={{ backgroundColor: UI_CONSTANTS.colors.surface }}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/manager/suppliers')}
              className="rounded-full border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
                {supplier?.name || 'Supplier Transactions'}
              </h1>
              <p className="text-sm" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                Transaction History
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange(e.target.value, dateRange.endDate.toISOString().split('T')[0])}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange(dateRange.startDate.toISOString().split('T')[0], e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadTransactions}
                className="rounded-full border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                className="rounded-full border-gray-200 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Balance Card */}
        <div className="mb-6">
          <Card className="rounded-xl border border-gray-100 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {currentBalance >= 0 ? (
                  <TrendingDown className="h-8 w-8" style={{ color: UI_CONSTANTS.colors.danger }} />
                ) : (
                  <TrendingUp className="h-8 w-8" style={{ color: UI_CONSTANTS.colors.success }} />
                )}
                <div>
                  <p className="text-sm font-medium" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                    {currentBalance >= 0 ? 'Amount Payable' : 'Amount Receivable'}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: currentBalance >= 0 ? UI_CONSTANTS.colors.danger : UI_CONSTANTS.colors.success }}>
                    {formatCurrency(Math.abs(currentBalance))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <EmptyState />
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
                    {transactions.map((transaction) => {
                      const isDebit = (transaction.debit || 0) > 0;
                      const amount = isDebit ? transaction.debit! : transaction.credit!;
                      const color = isDebit ? UI_CONSTANTS.colors.danger : UI_CONSTANTS.colors.success;

                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                              {isDebit ? (
                                <TrendingUp className="h-4 w-4" style={{ color }} />
                              ) : (
                                <TrendingDown className="h-4 w-4" style={{ color }} />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(transaction.transaction_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {transaction.narration}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-xs capitalize">
                              {transaction.source_document_type.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold" style={{ color }}>
                              {isDebit ? '-' : '+'}{formatCurrency(amount)}
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

                {hasMoreData && (
                  <div className="p-4 text-center border-t">
                    <Button
                      variant="outline"
                      onClick={loadMoreTransactions}
                      disabled={isLoadingMore}
                      className="rounded-full"
                    >
                      {isLoadingMore ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      ) : null}
                      {isLoadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Error State Component
function ErrorState({ onRetry, error }: { onRetry: () => void; error: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: UI_CONSTANTS.colors.textSecondary }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
          Error Loading Transactions
        </h3>
        <p className="text-sm mb-4" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
          {error}
        </p>
        <Button onClick={onRetry} className="rounded-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-16 px-8">
      <div className="max-w-md mx-auto">
        <Receipt className="h-12 w-12 mx-auto mb-4" style={{ color: UI_CONSTANTS.colors.textSecondary }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
          No Transactions Found
        </h3>
        <p className="text-sm" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
          This supplier has no transaction history yet
        </p>
      </div>
    </div>
  );
}
