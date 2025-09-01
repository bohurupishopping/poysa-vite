import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import PendingAssignment from "./pages/PendingAssignment";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Companies from "./pages/admin/Companies";
import Users from "./pages/admin/Users";
import UserKYC from "./pages/admin/UserKYC";
import FinancialDashboard from "./pages/admin/financials/FinancialDashboard";
import ChartOfAccounts from "./pages/admin/financials/ChartOfAccounts";
import JournalEntries from "./pages/admin/financials/JournalEntries";
import JournalInfo from "./pages/admin/financials/JournalInfo";
import SalesInvoices from "./pages/admin/sales/SalesInvoices";
import InvoiceDetail from "./pages/admin/sales/InvoiceDetail";
import PurchaseBills from "./pages/admin/purchases/PurchaseBills";
import BillDetail from "./pages/admin/purchases/BillDetail";
import Products from "./pages/admin/operations/Products";
import Customers from "./pages/admin/operations/Customers";
import Suppliers from "./pages/admin/operations/Suppliers";
import Inventory from "./pages/admin/operations/Inventory";
import { CompanyContextProvider } from "./components/CompanyContextSwitcher";
import AdminLayout from "./components/AdminLayout";
import ManagerLayout from "./components/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerFinancialDashboard from "./pages/manager/financials/ManagerFinancialDashboard";
import ManagerChartOfAccounts from "./pages/manager/financials/ChartOfAccounts";
import ManagerJournalEntries from "./pages/manager/financials/JournalEntries";
import ManagerTrialBalance from "./pages/manager/financials/TrialBalance";
import ManagerProfitAndLoss from "./pages/manager/financials/ProfitAndLoss";
import ManagerBalanceSheet from "./pages/manager/financials/BalanceSheet";
import ManagerSalesInvoices from "./pages/manager/sales/SalesInvoices";
import CreateInvoice from "./pages/manager/sales/CreateInvoice";
import ManagerInvoiceDetail from "./pages/manager/sales/InvoiceDetail";
import Estimates from "./pages/manager/estimates/Estimates";
import CreateEstimate from "./pages/manager/estimates/CreateEstimate";
import ManagerPurchaseBills from "./pages/manager/purchases/PurchaseBills";
import CreateBill from "./pages/manager/purchases/CreateBill"; // Import the new CreateBill component
import ManagerBillDetail from "./pages/manager/purchases/ManagerBillDetail";
import PurchaseOrders from "./pages/manager/purchase-order/PurchaseOrders";
import CreatePurchaseOrder from "./pages/manager/purchase-order/CreatePurchaseOrder";
import ManagerProducts from "./pages/manager/operations/Products";
import ManagerCustomers from "./pages/manager/customers/Customers";
import ManagerSuppliers from "./pages/manager/suppliers/Suppliers";
import ManagerInventory from "./pages/manager/operations/Inventory";
import ManagerTargets from "./pages/manager/performance/Targets";
import CreateCustomer from "./pages/manager/customers/CreateCustomer";
import { CreateSupplier } from "./pages/manager/suppliers/CreateSupplier";
import CreateProduct from "./pages/manager/operations/CreateProduct";
import ProductTransactions from "./pages/manager/operations/ProductTransactions";
import CashBankAccounts from "./pages/manager/operations/CashBankAccounts";
import CreateCashBankAccount from "./pages/manager/operations/CreateCashBankAccount";
import CashBankTransactions from "./pages/manager/operations/CashBankTransactions";
import SupplierTransactions from "./pages/manager/suppliers/SupplierTransactions";
import CustomerTransactions from "./pages/manager/customers/CustomerTransactions";
import { KycForm } from "./pages/manager/KycForm";
import { KycPending } from "./pages/manager/KycPending";
import { KycRejected } from "./pages/manager/KycRejected";
import BusinessProposal from "./pages/BusinessProposal";
import BusinessProposals from "./pages/admin/BusinessProposals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyContextProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <Index />
                  </AuthGuard>
                }
              />
              <Route
                path="/pending-assignment"
                element={
                  <AuthGuard>
                    <PendingAssignment />
                  </AuthGuard>
                }
              />
              <Route path="/admin/dashboard" element={
                <AuthGuard>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/companies" element={
                <AuthGuard>
                  <AdminLayout>
                    <Companies />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/users" element={
                <AuthGuard>
                  <AdminLayout>
                    <Users />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/kyc" element={
                <AuthGuard>
                  <AdminLayout>
                    <UserKYC />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/business-proposals" element={
                <AuthGuard>
                  <AdminLayout>
                    <BusinessProposals />
                  </AdminLayout>
                </AuthGuard>
              } />

              {/* Financial Management */}
              <Route path="/admin/financials/dashboard" element={
                <AuthGuard>
                  <AdminLayout>
                    <FinancialDashboard />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/financials/accounts" element={
                <AuthGuard>
                  <AdminLayout>
                    <ChartOfAccounts />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/financials/journal" element={
                <AuthGuard>
                  <AdminLayout>
                    <JournalEntries />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/financials/journal/:id" element={
                <AuthGuard>
                  <AdminLayout>
                    <JournalInfo />
                  </AdminLayout>
                </AuthGuard>
              } />

              {/* Sales Management */}
              <Route path="/admin/sales/invoices" element={
                <AuthGuard>
                  <AdminLayout>
                    <SalesInvoices />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/sales/invoices/:id" element={
                <AuthGuard>
                  <AdminLayout>
                    <InvoiceDetail />
                  </AdminLayout>
                </AuthGuard>
              } />

              {/* Purchase Management */}
              <Route path="/admin/purchases/bills" element={
                <AuthGuard>
                  <AdminLayout>
                    <PurchaseBills />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/purchases/bills/:id" element={
                <AuthGuard>
                  <AdminLayout>
                    <BillDetail />
                  </AdminLayout>
                </AuthGuard>
              } />

              {/* Operations Management */}
              <Route path="/admin/operations/products" element={
                <AuthGuard>
                  <AdminLayout>
                    <Products />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/operations/customers" element={
                <AuthGuard>
                  <AdminLayout>
                    <Customers />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/operations/suppliers" element={
                <AuthGuard>
                  <AdminLayout>
                    <Suppliers />
                  </AdminLayout>
                </AuthGuard>
              } />
              <Route path="/admin/operations/inventory" element={
                <AuthGuard>
                  <AdminLayout>
                    <Inventory />
                  </AdminLayout>
                </AuthGuard>
              } />

              {/* Manager Routes */}
              <Route path="/manager/dashboard" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerDashboard />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager Financial Routes */}
              <Route path="/manager/financials/dashboard" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerFinancialDashboard />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/financials/accounts" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerChartOfAccounts />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/financials/journal" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerJournalEntries />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/financials/trial-balance" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerTrialBalance />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/financials/profit-loss" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerProfitAndLoss />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/financials/balance-sheet" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerBalanceSheet />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager Sales Routes */}
              <Route path="/manager/sales/invoices" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerSalesInvoices />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/sales/invoices/new" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateInvoice />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/sales/invoices/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerInvoiceDetail />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/sales/estimates" element={
                <AuthGuard>
                  <ManagerLayout>
                    <Estimates />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/sales/estimates/new" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateEstimate />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/sales/estimates/:id/edit" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateEstimate />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager Purchase Routes */}
              <Route path="/manager/purchases/bills" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerPurchaseBills />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/purchases/bills/new" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateBill />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/purchases/bills/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerBillDetail />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/purchases/purchase-orders" element={
                <AuthGuard>
                  <ManagerLayout>
                    <PurchaseOrders />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/purchases/purchase-orders/new" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreatePurchaseOrder />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/purchases/purchase-orders/:id/edit" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreatePurchaseOrder />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager Operations Routes */}
              <Route path="/manager/operations/products" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerProducts />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/products/create" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateProduct />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/products/edit/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateProduct />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/products/:productId/transactions" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ProductTransactions />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/customers" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerCustomers />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/customers/create" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateCustomer />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/customers/edit/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateCustomer />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/suppliers" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerSuppliers />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/suppliers/create" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateSupplier />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/suppliers/edit/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateSupplier />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/suppliers/:supplierId/transactions" element={
                <AuthGuard>
                  <ManagerLayout>
                    <SupplierTransactions />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/customers/:customerId/transactions" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CustomerTransactions />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/inventory" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerInventory />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/cash-bank" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CashBankAccounts />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/cash-bank/create" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateCashBankAccount />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/cash-bank/edit/:id" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CreateCashBankAccount />
                  </ManagerLayout>
                </AuthGuard>
              } />
              <Route path="/manager/operations/cash-bank/:accountId/transactions" element={
                <AuthGuard>
                  <ManagerLayout>
                    <CashBankTransactions />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager Performance Routes */}
              <Route path="/manager/performance/targets" element={
                <AuthGuard>
                  <ManagerLayout>
                    <ManagerTargets />
                  </ManagerLayout>
                </AuthGuard>
              } />

              {/* Manager KYC Routes */}
              <Route path="/manager/kyc" element={
                <AuthGuard>
                  <KycForm />
                </AuthGuard>
              } />
              <Route path="/manager/kyc-pending" element={
                <AuthGuard>
                  <KycPending />
                </AuthGuard>
              } />
              <Route path="/manager/kyc-rejected" element={
                <AuthGuard>
                  <KycRejected />
                </AuthGuard>
              } />

              {/* Business Proposal Route */}
              <Route path="/business-proposal" element={
                <AuthGuard>
                  <BusinessProposal />
                </AuthGuard>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyContextProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
