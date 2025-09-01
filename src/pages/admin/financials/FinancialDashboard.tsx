import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, TrendingDown, CreditCard, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { supabase } from "@/integrations/supabase/client";

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  amountReceivable: number;
  amountPayable: number;
}

export default function FinancialDashboard() {
  const { selectedCompany } = useCompanyContext();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    amountReceivable: 0,
    amountPayable: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialStats = async () => {
      if (!selectedCompany) {
        setLoading(false);
        return;
      }

      try {
        // Fetch invoices for revenue and receivables
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('total_amount, amount_paid, status')
          .eq('company_id', selectedCompany);

        // Fetch bills for expenses and payables
        const { data: bills } = await supabase
          .from('purchase_bills')
          .select('total_amount, amount_paid, status')
          .eq('company_id', selectedCompany);

        const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount_paid), 0) || 0;
        const amountReceivable = invoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid)), 0) || 0;

        const totalExpenses = bills?.reduce((sum, bill) => sum + Number(bill.amount_paid), 0) || 0;
        const amountPayable = bills?.reduce((sum, bill) => sum + (Number(bill.total_amount) - Number(bill.amount_paid)), 0) || 0;

        setStats({
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          amountReceivable,
          amountPayable,
        });
      } catch (error) {
        console.error('Error fetching financial stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialStats();
  }, [selectedCompany]);

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-foreground">No Company Selected</h3>
          <p className="text-muted-foreground">Please select a company from the context switcher to view financial data.</p>
        </div>
      </div>
    );
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Company-specific financial overview and metrics</p>
      </div>

      {/* Financial Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-red-600 mt-1">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{stats.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">+15.3% from last month</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Amount Receivable</CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{stats.amountReceivable.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(stats.amountReceivable / (stats.totalRevenue + stats.amountReceivable) * 100)}% of total sales
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Amount Payable</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{stats.amountPayable.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(stats.amountPayable / (stats.totalExpenses + stats.amountPayable) * 100)}% of total purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit & Loss Chart */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Trend</h3>
          <p className="text-sm text-gray-600 mt-1">Monthly profit and loss overview for the selected company</p>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center space-y-2">
              <TrendingUp className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-sm text-gray-500">Chart implementation coming soon...</p>
              <p className="text-xs text-gray-400">Interactive charts will be available in the next update</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}