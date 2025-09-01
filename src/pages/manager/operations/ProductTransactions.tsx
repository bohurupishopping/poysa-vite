import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Plus,
  Minus,
  AlertCircle,
  Receipt,
  StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductTransactionService } from '@/services/productTransactionService';
import {
  ProductTransaction,
  ProductTransactionStats,
  ProductTransactionHelper
} from '@/types/product-transaction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface Product {
  id: string;
  name: string;
  sku?: string;
}

export default function ProductTransactions() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<ProductTransaction[]>([]);
  const [stats, setStats] = useState<ProductTransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Fetch product details
  const fetchProduct = useCallback(async () => {
    if (!productId || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('id', productId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to fetch product details');
    }
  }, [productId, profile?.company_id]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [transactionsData, statsData] = await Promise.all([
        ProductTransactionService.getProductTransactions({
          productId,
          page: 1
        }),
        ProductTransactionService.getProductTransactionStats(productId)
      ]);

      setTransactions(transactionsData);
      setStats(statsData);
      setCurrentPage(1);
      setHasMoreData(transactionsData.length >= 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  // Load more transactions
  const loadMoreTransactions = useCallback(async () => {
    if (!productId || isLoadingMore || !hasMoreData) return;

    setIsLoadingMore(true);

    try {
      const newTransactions = await ProductTransactionService.getProductTransactions({
        productId,
        page: currentPage + 1
      });

      setTransactions(prev => [...prev, ...newTransactions]);
      setCurrentPage(prev => prev + 1);
      setHasMoreData(newTransactions.length >= 20);
    } catch (err) {
      console.error('Error loading more transactions:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [productId, currentPage, isLoadingMore, hasMoreData]);

  useEffect(() => {
    fetchProduct();
    loadInitialData();
  }, [fetchProduct, loadInitialData]);

  // Format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={loadInitialData} error={error} />;
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
              onClick={() => navigate('/manager/operations/products')}
              className="rounded-full border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
                {product?.name || 'Product Transactions'}
              </h1>
              <p className="text-sm" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                Transaction History
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadInitialData}
              className="rounded-full border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        {stats && <StatsSection stats={stats} formatCurrency={formatCurrency} />}

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
                        Document
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactions.map((transaction, index) => {
                      const isInward = ProductTransactionHelper.isInward(transaction);
                      const color = isInward ? UI_CONSTANTS.colors.success : UI_CONSTANTS.colors.danger;
                      const Icon = isInward ? Plus : Minus;

                      return (
                        <tr key={`${transaction.id}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
                              <Icon className="h-4 w-4" style={{ color }} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(transaction.transaction_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {ProductTransactionHelper.getDescription(transaction)}
                            </div>
                            {transaction.notes && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {transaction.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {transaction.document_number && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.document_number}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold" style={{ color }}>
                              {ProductTransactionHelper.getFormattedQuantity(transaction)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {transaction.unit_price ? ProductTransactionHelper.getFormattedUnitPrice(transaction) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.total_amount ? ProductTransactionHelper.getFormattedTotalAmount(transaction) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm text-gray-900">
                              {transaction.running_balance !== undefined ? ProductTransactionHelper.getFormattedRunningBalance(transaction) : 'N/A'}
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

// Statistics Section Component
function StatsSection({ 
  stats, 
  formatCurrency 
}: { 
  stats: ProductTransactionStats;
  formatCurrency: (amount: number | null | undefined) => string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
        Stock Overview
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Stock"
          value={stats.current_balance.toFixed(2)}
          icon={Package}
          color={stats.current_balance >= 0 ? UI_CONSTANTS.colors.success : UI_CONSTANTS.colors.danger}
        />
        <StatCard
          title="Total Sales"
          value={stats.total_sales_qty.toFixed(0)}
          icon={TrendingDown}
          color={UI_CONSTANTS.colors.danger}
        />
        <StatCard
          title="Total Purchases"
          value={stats.total_purchase_qty.toFixed(0)}
          icon={TrendingUp}
          color={UI_CONSTANTS.colors.success}
        />
        <StatCard
          title="Sales Value"
          value={formatCurrency(stats.total_sales_value)}
          icon={IndianRupee}
          color={UI_CONSTANTS.colors.primary}
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="rounded-xl border border-gray-100 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" style={{ color }} />
          <span className="text-lg font-bold" style={{ color }}>
            {value}
          </span>
        </div>
        <p className="text-sm font-medium" style={{ color }}>
          {title}
        </p>
      </CardContent>
    </Card>
  );
}

// Transaction Card Component
function TransactionCard({ 
  transaction, 
  formatCurrency, 
  formatDate 
}: { 
  transaction: ProductTransaction;
  formatCurrency: (amount: number | null | undefined) => string;
  formatDate: (dateString: string) => string;
}) {
  const isInward = ProductTransactionHelper.isInward(transaction);
  const color = isInward ? UI_CONSTANTS.colors.success : UI_CONSTANTS.colors.danger;
  const Icon = isInward ? Plus : Minus;

  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div 
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
                {ProductTransactionHelper.getDescription(transaction)}
              </h4>
              {transaction.document_number && (
                <p className="text-xs" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                  {transaction.document_number}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-sm" style={{ color }}>
                {ProductTransactionHelper.getFormattedQuantity(transaction)}
              </span>
              {transaction.running_balance !== undefined && (
                <p className="text-xs" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                  Bal: {ProductTransactionHelper.getFormattedRunningBalance(transaction)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(transaction.transaction_date)}</span>
              </div>
              {transaction.unit_price && (
                <span>@ {ProductTransactionHelper.getFormattedUnitPrice(transaction)}</span>
              )}
            </div>
            {transaction.total_amount && (
              <span className="font-medium" style={{ color: UI_CONSTANTS.colors.textPrimary }}>
                {ProductTransactionHelper.getFormattedTotalAmount(transaction)}
              </span>
            )}
          </div>

          {transaction.notes && (
            <div className="mt-2 p-2 rounded-md" style={{ backgroundColor: UI_CONSTANTS.colors.background }}>
              <div className="flex items-start gap-1">
                <StickyNote className="h-3 w-3 mt-0.5" style={{ color: UI_CONSTANTS.colors.textSecondary }} />
                <span className="text-xs italic" style={{ color: UI_CONSTANTS.colors.textSecondary }}>
                  {transaction.notes}
                </span>
              </div>
            </div>
          )}
        </div>
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
          This product has no transaction history yet
        </p>
      </div>
    </div>
  );
}
