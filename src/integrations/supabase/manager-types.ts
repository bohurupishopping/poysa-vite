import { Database } from './types';

// Manager-specific type definitions
export type ManagerProfile = Database['public']['Tables']['profiles']['Row'] & {
    company_id: string; // Managers always have a company_id
};

export type Company = Database['public']['Tables']['companies']['Row'];

export type Customer = Database['public']['Tables']['customers']['Row'];

export type Supplier = Database['public']['Tables']['suppliers']['Row'];

export type Product = Database['public']['Tables']['products']['Row'];

export type SalesInvoice = Database['public']['Tables']['sales_invoices']['Row'];

export type PurchaseBill = Database['public']['Tables']['purchase_bills']['Row'];

export type ChartOfAccount = Database['public']['Tables']['chart_of_accounts']['Row'];

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

export type JournalLine = Database['public']['Tables']['journal_lines']['Row'];

export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'];

// Note: These tables don't exist in the current database schema
// Creating manual type definitions for now
export type PerformanceTarget = {
    id: string;
    company_id: string;
    name: string;
    target_value: number;
    period: TargetPeriod;
    start_date: string;
    end_date: string;
    status: TargetStatus;
    metric: TargetMetric;
    product_id?: string;
    description?: string;
    created_at: string;
    updated_at: string;
};

export type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

export type TaxRate = Database['public']['Tables']['tax_rates']['Row'];

// Define the missing TaxGroup type based on the database schema
export interface TaxGroup {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Add taxRates property for the getTaxGroupsWithRates method
  taxRates?: TaxRate[];
}

export type TaxGroupRate = {
    tax_group_id: string;
    tax_rate_id: string;
};

export type Warehouse = Database['public']['Tables']['warehouses']['Row'];

// Manual type definition for cash_bank_accounts (doesn't exist in schema)
export type CashBankAccount = {
    id: string;
    company_id: string;
    account_name: string;
    account_number: string;
    bank_name: string;
    balance: number;
    created_at: string;
    updated_at: string;
};

// Enums
export type AppRole = Database['public']['Enums']['app_role'];
export type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type BillStatus = Database['public']['Enums']['bill_status'];
export type ProductType = Database['public']['Enums']['product_type'];
export type AccountClass = Database['public']['Enums']['account_class'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];
export type TargetMetric = Database['public']['Enums']['target_metric'];
export type TargetPeriod = Database['public']['Enums']['target_period'];
export type TargetStatus = Database['public']['Enums']['target_status'];
export type DailyLogType = Database['public']['Enums']['daily_log_type'];
// Manual type definition for inventory_movement_type (doesn't exist in schema)
export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

// Customer form types
export interface CustomerDetails {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    taxNumber?: string | null;
    gstin?: string | null;
    website?: string | null;
    notes?: string | null;
    [key: string]: any; // Index signature for Supabase Json compatibility
}

export interface CreateCustomerForm {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    gstin?: string;
    taxNumber?: string;
}

export interface CreateCustomerRequest {
    company_id: string;
    name: string;
    details?: CustomerDetails;
}

// Extended types with relationships
export type SalesInvoiceWithDetails = SalesInvoice & {
    customer: Customer;
    lines: SalesInvoiceLine[];
    payments: InvoicePayment[];
};

export type SalesInvoiceLine = Database['public']['Tables']['sales_invoice_lines']['Row'] & {
    product?: Product;
    taxes: SalesInvoiceLineTax[];
};

// Define the missing table type manually since it's not in the generated types yet
export type SalesInvoiceLineTax = {
    id: string;
    invoice_line_id: string;
    tax_rate_id: string;
    tax_amount: number;
    tax_rate?: TaxRate;
};

export type InvoicePayment = Database['public']['Tables']['invoice_payments']['Row'];

export type PurchaseBillWithDetails = PurchaseBill & {
    supplier: Supplier;
    lines: PurchaseBillLine[];
    payments: BillPayment[];
};

export type PurchaseBillLine = Database['public']['Tables']['purchase_bill_lines']['Row'] & {
    product?: Product;
    taxes: PurchaseBillLineTax[];
};

// Manual type definition for purchase_bill_line_taxes (doesn't exist in schema)
export type PurchaseBillLineTax = {
    id: string;
    bill_line_id: string;
    tax_rate_id: string;
    tax_amount: number;
    tax_rate: TaxRate;
};

export type BillPayment = Database['public']['Tables']['bill_payments']['Row'];

export type ProductWithStock = Product & {
    current_stock: number;
    stock_value: number;
};

export type JournalEntryWithLines = JournalEntry & {
    lines: (JournalLine & {
        account: ChartOfAccount;
    })[];
};

export type PerformanceTargetWithProgress = PerformanceTarget & {
    current_value: number;
    progress_percentage: number;
    product?: Product;
    performance_data?: {
        targetId: string;
        targetName: string;
        primaryMetric: string;
        targetValue: number;
        primaryActualValue: number;
        achievementPercentage: number;
        status: string;
        period: {
            start: string;
            end: string;
        };
        performance_summary: {
            accrualRevenue: {
                gross: number;
                returns: number;
                net: number;
            };
            netCashCollected: {
                cashIn: number;
                cashOutRefunds: number;
                net: number;
            };
            netQuantitySold: {
                isApplicable: boolean;
                sold: number;
                returned: number;
                net: number;
            };
        };
    };
};

export type DailyLogWithAttachments = DailyLog & {
    attachments: LogAttachment[];
    created_by_profile: ManagerProfile;
};

export type LogAttachment = Database['public']['Tables']['log_attachments']['Row'];

// Dashboard types
export type DashboardMetrics = {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalReceivables: number;
    totalPayables: number;
    cashFlow: number;
    bankBalance: number;
};

export type RecentActivity = {
    id: string;
    type: 'invoice' | 'bill' | 'payment';
    description: string;
    amount: number;
    date: string;
    status: string;
};

export type MonthlyPerformance = {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
};

// Form types
// Removed duplicate CreateCustomerForm - using the interface version above

// Supplier details structure for the JSONB details field
export interface SupplierDetails {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    taxNumber?: string | null;
    gstin?: string | null;
    website?: string | null;
    contactPerson?: string | null;
    paymentTerms?: string | null;
    notes?: string | null;
    [key: string]: any; // Index signature for Supabase Json compatibility
}

export interface CreateSupplierForm {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    gstin?: string;
    taxNumber?: string;
    contactPerson?: string;
    paymentTerms?: string;
    notes?: string;
}

export interface CreateSupplierRequest {
    company_id: string;
    name: string;
    gstin?: string;
    details?: SupplierDetails;
}

export type CreateProductForm = {
    name: string;
    sku?: string;
    type: ProductType;
    description?: string;
    sale_price?: number;
    purchase_price?: number;
    hsn_sac_code?: string;
    default_tax_group_id?: string;
};

export type CreateInvoiceForm = {
    customer_id: string;
    invoice_date: string;
    due_date?: string;
    place_of_supply?: string;
    lines: CreateInvoiceLineForm[];
};

export type CreateInvoiceLineForm = {
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    hsn_sac_code?: string;
    line_taxes: CreateInvoiceLineTaxForm[];
};

export type CreateInvoiceLineTaxForm = {
    tax_rate_id: string;
    tax_amount: number;
};

export type CreateBillForm = {
    supplier_id: string;
    bill_date: string;
    due_date?: string;
    bill_number?: string;
    place_of_supply?: string;
    lines: CreateBillLineForm[];
};

export type CreateBillLineForm = {
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    hsn_sac_code?: string;
    line_taxes: CreateBillLineTaxForm[];
};

export type CreateBillLineTaxForm = {
    tax_rate_id: string;
    tax_amount: number;
};

export type CreateTargetForm = {
    name: string;
    period: TargetPeriod;
    start_date: string;
    end_date: string;
    metric: TargetMetric;
    target_value: number;
    product_id?: string;
    notes?: string;
};

export type CreateDailyLogForm = {
    log_date: string;
    log_type: DailyLogType;
    notes: string;
    latitude?: number;
    longitude?: number;
    address_snapshot?: string;
};

// Filter and search types
export type InvoiceFilters = {
    status?: InvoiceStatus[];
    customer_id?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
};

export type BillFilters = {
    status?: BillStatus[];
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
};

export type ProductFilters = {
    type?: ProductType;
    is_active?: boolean;
    has_stock?: boolean;
};

export type TargetFilters = {
    status?: TargetStatus;
    metric?: TargetMetric;
    period?: TargetPeriod;
    product_id?: string;
};

// Profit & Loss types
export type AccountDetail = {
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
};

export type ProfitAndLossData = {
    tradingAccount: {
        sales: {
            total: number;
            accounts: AccountDetail[];
        };
        costOfGoodsSold: {
            total: number;
            accounts: AccountDetail[];
        };
        directExpenses: {
            total: number;
            accounts: AccountDetail[];
        };
    };
    grossProfit: number;
    profitLossAccount: {
        otherIncome: {
            total: number;
            accounts: AccountDetail[];
        };
        totalIncome: number;
        indirectExpenses: {
            employeeBenefits: {
                total: number;
                accounts: AccountDetail[];
            };
            financeCosts: {
                total: number;
                accounts: AccountDetail[];
            };
            depreciationAmortization: {
                total: number;
                accounts: AccountDetail[];
            };
            otherExpenses: {
                total: number;
                accounts: AccountDetail[];
            };
        };
        totalIndirectExpenses: number;
    };
    profitBeforeTax: number;
};

// Balance Sheet types
export type BalanceSheetNode = {
    accountId: string;
    accountCode: string;
    accountName: string;
    total: number;
    accounts: BalanceSheetNode[];
};

export type BalanceSheetData = {
    asOfDate: string;
    assets: Record<string, BalanceSheetNode>;
    liabilities: Record<string, BalanceSheetNode>;
    equity: {
        share_capital: BalanceSheetNode;
        reserves_and_surplus: BalanceSheetNode;
        current_period_profit: BalanceSheetNode;
    };
};

// API Response types
export type ApiResponse<T> = {
    data: T | null;
    error: string | null;
    success: boolean;
};

export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
};
