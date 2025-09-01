--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.5 (Debian 17.5-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA public;


--
-- Name: account_class; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_class AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'user'
);


--
-- Name: bill_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bill_status AS ENUM (
    'draft',
    'submitted',
    'paid',
    'partially_paid',
    'void'
);


--
-- Name: daily_log_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.daily_log_type AS ENUM (
    'GENERAL_UPDATE',
    'SITE_VISIT',
    'CLIENT_MEETING',
    'SUPPLIER_MEETING',
    'INCIDENT_REPORT'
);


--
-- Name: document_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_status AS ENUM (
    'draft',
    'posted',
    'void',
    'applied'
);


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'SALES_INVOICE',
    'PURCHASE_BILL',
    'SALES_CREDIT_NOTE',
    'PURCHASE_DEBIT_NOTE'
);


--
-- Name: gstr1_b2b_invoice_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gstr1_b2b_invoice_type AS ENUM (
    'REGULAR',
    'SEZ_WITH_PAYMENT',
    'SEZ_WITHOUT_PAYMENT',
    'DEEMED_EXPORT'
);


--
-- Name: inventory_movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inventory_movement_type AS ENUM (
    'PURCHASE',
    'SALE',
    'PURCHASE_RETURN',
    'SALES_RETURN',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'INITIAL_STOCK'
);


--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'partially_paid',
    'void'
);


--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kyc_status AS ENUM (
    'not_submitted',
    'pending_review',
    'approved',
    'rejected'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'bank_transfer',
    'credit_card',
    'cheque',
    'other'
);


--
-- Name: product_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_type AS ENUM (
    'GOOD',
    'SERVICE'
);


--
-- Name: proposal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proposal_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: reconciliation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reconciliation_status AS ENUM (
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: target_creator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.target_creator AS ENUM (
    'ADMIN',
    'MANAGER'
);


--
-- Name: target_metric; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.target_metric AS ENUM (
    'REVENUE',
    'PROFIT',
    'QUANTITY_SOLD',
    'CASH_COLLECTED'
);


--
-- Name: target_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.target_period AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
    'CUSTOM'
);


--
-- Name: target_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.target_status AS ENUM (
    'ACTIVE',
    'ACHIEVED',
    'MISSED'
);


--
-- Name: create_company_rls_policy(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_company_rls_policy(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "Admin and Manager Access Policy" ON public.%I;', table_name);
  EXECUTE format('
    CREATE POLICY "Admin and Manager Access Policy" ON public.%I FOR ALL
    USING (
      ( (auth.jwt() -> ''app_metadata'' ->> ''app_role'') = ''admin'' ) OR
      ( company_id = ((auth.jwt() -> ''app_metadata'' ->> ''company_id''))::uuid )
    );
  ', table_name);
END;
$$;


--
-- Name: create_gold_standard_accounts_for_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_gold_standard_accounts_for_company(p_company_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Equity & Liabilities
    v_equity_id UUID;
    v_share_cap_id UUID;
    v_reserves_id UUID;
    v_liabilities_id UUID;
    v_non_current_liab_id UUID;
    v_long_term_borrow_id UUID;
    v_current_liab_id UUID;
    v_trade_payables_id UUID;
    v_duties_taxes_id UUID;
    v_provisions_id UUID;
    v_other_curr_liab_id UUID;

    -- Assets
    v_assets_id UUID;
    v_non_current_assets_id UUID;
    v_fixed_assets_id UUID;
    v_investments_id UUID;
    v_current_assets_id UUID;
    v_inventories_id UUID;
    v_trade_receivables_id UUID;
    v_cash_equiv_id UUID;
    v_bank_accts_id UUID;
    v_loans_adv_asset_id UUID;
    v_taxes_receivable_id UUID;

    -- Revenue
    v_revenue_id UUID;
    v_rev_from_ops_id UUID;
    v_other_income_id UUID;

    -- Expenses
    v_expenses_id UUID;
    v_cogs_id UUID;
    v_direct_exp_id UUID;
    v_indirect_exp_id UUID;
    v_employee_exp_id UUID;
    v_finance_costs_id UUID;
    v_depreciation_id UUID;
    v_admin_exp_id UUID;
    v_selling_exp_id UUID;

BEGIN
    -- =================================================================
    -- Step 1: Create Top-Level Groups (Balance Sheet & P&L)
    -- =================================================================
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class) VALUES (p_company_id, '1000', 'Equity and Liabilities', 'LIABILITY') RETURNING id INTO v_liabilities_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class) VALUES (p_company_id, '2000', 'Assets', 'ASSET') RETURNING id INTO v_assets_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class) VALUES (p_company_id, '3000', 'Revenue', 'REVENUE') RETURNING id INTO v_revenue_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class) VALUES (p_company_id, '4000', 'Expenses', 'EXPENSE') RETURNING id INTO v_expenses_id;

    -- =================================================================
    -- Step 2: Build Equity & Liabilities Hierarchy
    -- =================================================================
    -- EQUITY (Shareholders' Funds)
    --- FIX: Added bs_head to ensure future accounts created under this group inherit correctly.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1100', 'Shareholders Funds', 'EQUITY', 'Owner Equity', v_liabilities_id, 'share_capital') RETURNING id INTO v_equity_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1110', 'Share Capital', 'EQUITY', 'Owner Equity', v_equity_id, 'share_capital', 'OwnerEquity') RETURNING id INTO v_share_cap_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1120', 'Reserves and Surplus', 'EQUITY', 'Retained Earnings', v_equity_id, 'reserves_and_surplus') RETURNING id INTO v_reserves_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1121', 'Retained Earnings', 'EQUITY', 'Retained Earnings', v_reserves_id, 'reserves_and_surplus', 'RetainedEarnings');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1130', 'Drawings', 'EQUITY', 'Owner Equity', v_equity_id, 'share_capital');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, system_account_type, bs_head) VALUES (p_company_id, '3999', 'Opening Balance Equity', 'EQUITY', 'Retained Earnings', v_reserves_id, 'OpeningBalanceEquity', 'reserves_and_surplus') ON CONFLICT (company_id, system_account_type) DO NOTHING;

    -- NON-CURRENT LIABILITIES
    --- FIX: Added bs_head for robustness.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1200', 'Non-Current Liabilities', 'LIABILITY', 'Non-Current Liability', v_liabilities_id, 'long_term_borrowings') RETURNING id INTO v_non_current_liab_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1210', 'Long-Term Borrowings', 'LIABILITY', 'Non-Current Liability', v_non_current_liab_id, 'long_term_borrowings') RETURNING id INTO v_long_term_borrow_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1211', 'Secured Loans', 'LIABILITY', 'Non-Current Liability', v_long_term_borrow_id, 'long_term_borrowings');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1212', 'Unsecured Loans', 'LIABILITY', 'Non-Current Liability', v_long_term_borrow_id, 'long_term_borrowings');

    -- CURRENT LIABILITIES
    --- FIX: Added bs_head for robustness.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1300', 'Current Liabilities', 'LIABILITY', 'Current Liability', v_liabilities_id, 'other_current_liabilities') RETURNING id INTO v_current_liab_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1310', 'Trade Payables (Sundry Creditors)', 'LIABILITY', 'Current Liability', v_current_liab_id, 'trade_payables', 'AccountsPayable') RETURNING id INTO v_trade_payables_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1320', 'Duties & Taxes', 'LIABILITY', 'Current Liability', v_current_liab_id, 'other_current_liabilities') RETURNING id INTO v_duties_taxes_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1321', 'IGST Payable', 'LIABILITY', 'Current Liability', v_duties_taxes_id, 'other_current_liabilities', 'IgstPayable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1322', 'CGST Payable', 'LIABILITY', 'Current Liability', v_duties_taxes_id, 'other_current_liabilities', 'CgstPayable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1323', 'SGST Payable', 'LIABILITY', 'Current Liability', v_duties_taxes_id, 'other_current_liabilities', 'SgstPayable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '1324', 'TDS Payable', 'LIABILITY', 'Current Liability', v_duties_taxes_id, 'other_current_liabilities', 'TdsPayable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1330', 'Provisions', 'LIABILITY', 'Current Liability', v_current_liab_id, 'short_term_provisions') RETURNING id INTO v_provisions_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1331', 'Provision for Tax', 'LIABILITY', 'Current Liability', v_provisions_id, 'short_term_provisions');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1340', 'Other Current Liabilities', 'LIABILITY', 'Current Liability', v_current_liab_id, 'other_current_liabilities') RETURNING id INTO v_other_curr_liab_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '1341', 'Expenses Payable', 'LIABILITY', 'Current Liability', v_other_curr_liab_id, 'other_current_liabilities');

    -- =================================================================
    -- Step 3: Build Assets Hierarchy
    -- =================================================================
    -- NON-CURRENT ASSETS
    --- FIX: Added bs_head for robustness.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2100', 'Non-Current Assets', 'ASSET', 'Non-Current Asset', v_assets_id, 'fixed_assets') RETURNING id INTO v_non_current_assets_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2110', 'Fixed Assets', 'ASSET', 'Non-Current Asset', v_non_current_assets_id, 'fixed_assets') RETURNING id INTO v_fixed_assets_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2111', 'Land and Building', 'ASSET', 'Non-Current Asset', v_fixed_assets_id, 'fixed_assets');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2112', 'Plant and Machinery', 'ASSET', 'Non-Current Asset', v_fixed_assets_id, 'fixed_assets');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2113', 'Furniture and Fixtures', 'ASSET', 'Non-Current Asset', v_fixed_assets_id, 'fixed_assets');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id) VALUES (p_company_id, '2119', 'Accumulated Depreciation on Fixed Assets', 'ASSET', 'Non-Current Asset', v_fixed_assets_id);
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2120', 'Investments', 'ASSET', 'Non-Current Asset', v_non_current_assets_id, 'non_current_investments') RETURNING id INTO v_investments_id;

    -- CURRENT ASSETS
    --- FIX: Added bs_head for robustness.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2200', 'Current Assets', 'ASSET', 'Current Asset', v_assets_id, 'other_current_assets') RETURNING id INTO v_current_assets_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2210', 'Inventories', 'ASSET', 'Current Asset', v_current_assets_id, 'inventories', 'Inventory') RETURNING id INTO v_inventories_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2220', 'Trade Receivables (Sundry Debtors)', 'ASSET', 'Current Asset', v_current_assets_id, 'trade_receivables', 'AccountsReceivable') RETURNING id INTO v_trade_receivables_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2230', 'Cash and Cash Equivalents', 'ASSET', 'Current Asset', v_current_assets_id, 'cash_and_cash_equivalents') RETURNING id INTO v_cash_equiv_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2231', 'Cash in Hand', 'ASSET', 'Current Asset', v_cash_equiv_id, 'cash_and_cash_equivalents', 'Cash');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2232', 'Bank Accounts', 'ASSET', 'Current Asset', v_cash_equiv_id, 'cash_and_cash_equivalents', 'BankAccounts') RETURNING id INTO v_bank_accts_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2240', 'Loans & Advances (Asset)', 'ASSET', 'Current Asset', v_current_assets_id, 'short_term_loans_and_advances') RETURNING id INTO v_loans_adv_asset_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2241', 'Advances to Suppliers', 'ASSET', 'Current Asset', v_loans_adv_asset_id, 'short_term_loans_and_advances');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head) VALUES (p_company_id, '2250', 'Taxes Receivable', 'ASSET', 'Current Asset', v_loans_adv_asset_id, 'other_current_assets') RETURNING id INTO v_taxes_receivable_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2251', 'IGST Receivable', 'ASSET', 'Current Asset', v_taxes_receivable_id, 'other_current_assets', 'IgstReceivable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2252', 'CGST Receivable', 'ASSET', 'Current Asset', v_taxes_receivable_id, 'other_current_assets', 'CgstReceivable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2253', 'SGST Receivable', 'ASSET', 'Current Asset', v_taxes_receivable_id, 'other_current_assets', 'SgstReceivable');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, bs_head, system_account_type) VALUES (p_company_id, '2999', 'Suspense Account', 'ASSET', 'Current Asset', v_current_assets_id, 'suspense_account', 'SuspenseAccount');

    -- =================================================================
    -- Step 4: Build Revenue Hierarchy
    -- =================================================================
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '3100', 'Revenue from Operations', 'REVENUE', 'Operating Revenue', v_revenue_id, 'revenue_from_operations') RETURNING id INTO v_rev_from_ops_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '3110', 'Sales Revenue', 'REVENUE', 'Operating Revenue', v_rev_from_ops_id, 'revenue_from_operations', 'SalesRevenue');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '3120', 'Sales Returns', 'REVENUE', 'Contra Revenue', v_rev_from_ops_id, 'revenue_from_operations', 'SalesReturns');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '3200', 'Other Income', 'REVENUE', 'Non-Operating Revenue', v_revenue_id, 'other_income') RETURNING id INTO v_other_income_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '3210', 'Interest Received', 'REVENUE', 'Non-Operating Revenue', v_other_income_id, 'other_income');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '3220', 'Discount Received', 'REVENUE', 'Non-Operating Revenue', v_other_income_id, 'other_income');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '3230', 'Commission Received', 'REVENUE', 'Non-Operating Revenue', v_other_income_id, 'other_income');

    -- =================================================================
    -- Step 5: Build Expense Hierarchy
    -- =================================================================
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '4100', 'Cost of Goods Sold', 'EXPENSE', 'Cost of Sales', v_expenses_id, 'cost_of_materials', 'CostOfGoodsSold') RETURNING id INTO v_cogs_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4200', 'Direct Expenses', 'EXPENSE', 'Direct Expense', v_expenses_id, 'direct_expenses') RETURNING id INTO v_direct_exp_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '4210', 'Purchases', 'EXPENSE', 'Direct Expense', v_direct_exp_id, 'purchases_of_stock', 'PurchaseAccount');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '4220', 'Purchase Returns', 'EXPENSE', 'Contra Expense', v_direct_exp_id, 'purchases_of_stock', 'PurchaseReturns');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4230', 'Wages', 'EXPENSE', 'Direct Expense', v_direct_exp_id, 'direct_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4240', 'Carriage Inwards', 'EXPENSE', 'Direct Expense', v_direct_exp_id, 'direct_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4250', 'Power and Fuel', 'EXPENSE', 'Direct Expense', v_direct_exp_id, 'direct_expenses');
    
    --- FIX: Added a default pnl_head of 'other_expenses' to the main 'Indirect Expenses' group.
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4300', 'Indirect Expenses', 'EXPENSE', 'Indirect Expense', v_expenses_id, 'other_expenses') RETURNING id INTO v_indirect_exp_id;
    
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head, system_account_type) VALUES (p_company_id, '4310', 'Employee Benefits Expense', 'EXPENSE', 'Indirect Expense', v_indirect_exp_id, 'employee_benefits_expense', 'GeneralExpenses') RETURNING id INTO v_employee_exp_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4311', 'Salaries', 'EXPENSE', 'Indirect Expense', v_employee_exp_id, 'employee_benefits_expense');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4320', 'Finance Costs', 'EXPENSE', 'Indirect Expense', v_indirect_exp_id, 'finance_costs') RETURNING id INTO v_finance_costs_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4321', 'Bank Charges', 'EXPENSE', 'Indirect Expense', v_finance_costs_id, 'finance_costs');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4322', 'Interest Paid', 'EXPENSE', 'Indirect Expense', v_finance_costs_id, 'finance_costs');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4330', 'Depreciation and Amortization', 'EXPENSE', 'Indirect Expense', v_indirect_exp_id, 'depreciation_amortization') RETURNING id INTO v_depreciation_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4340', 'Administrative Expenses', 'EXPENSE', 'Indirect Expense', v_indirect_exp_id, 'other_expenses') RETURNING id INTO v_admin_exp_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4341', 'Rent, Rates & Taxes', 'EXPENSE', 'Indirect Expense', v_admin_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4342', 'Printing & Stationery', 'EXPENSE', 'Indirect Expense', v_admin_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4343', 'Legal & Professional Charges', 'EXPENSE', 'Indirect Expense', v_admin_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4344', 'Repairs & Maintenance', 'EXPENSE', 'Indirect Expense', v_admin_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4350', 'Selling & Distribution Expenses', 'EXPENSE', 'Indirect Expense', v_indirect_exp_id, 'other_expenses') RETURNING id INTO v_selling_exp_id;
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4351', 'Advertisement & Marketing', 'EXPENSE', 'Indirect Expense', v_selling_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4352', 'Freight & Cartage Outward', 'EXPENSE', 'Indirect Expense', v_selling_exp_id, 'other_expenses');
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, parent_account_id, pnl_head) VALUES (p_company_id, '4353', 'Bad Debts', 'EXPENSE', 'Indirect Expense', v_selling_exp_id, 'other_expenses');

    RAISE NOTICE 'Comprehensive Gold Standard accounts created for company %', p_company_id;
END;
$$;


--
-- Name: create_optimized_company_rls_policy(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_optimized_company_rls_policy(table_name text, id_column text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Drop any known old policies first to ensure a clean slate
  EXECUTE format('DROP POLICY IF EXISTS "Admin and Manager Access Policy" ON public.%I;', table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Admins see all, managers see their own company data." ON public.%I;', table_name);
  -- Create the single, optimized policy
  EXECUTE format('
    CREATE POLICY "Admin and Manager Access Policy" ON public.%I FOR ALL
    USING (
      ( (SELECT get_jwt_claim(''app_role'')) = ''admin'' ) OR
      ( %I = ((SELECT get_jwt_claim(''company_id'')))::uuid )
    );
  ', table_name, id_column);
END;
$$;


--
-- Name: create_reversal_journal_entry(uuid, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_reversal_journal_entry(p_company_id uuid, p_narration text, p_source_document_id uuid, p_source_document_type text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reversal_journal_entry_id UUID;
    v_original_journal_entry_id UUID;
BEGIN
    -- Find the original journal entry linked to the source document
    SELECT id INTO v_original_journal_entry_id
    FROM public.journal_entries
    WHERE source_document_id = p_source_document_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_original_journal_entry_id IS NULL THEN
        RETURN NULL; -- Nothing to reverse
    END IF;

    -- Create the new reversal journal entry header
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
    VALUES (p_company_id, CURRENT_DATE, p_narration, p_source_document_id, p_source_document_type)
    RETURNING id INTO v_reversal_journal_entry_id;

    -- THE FIX: Copy the original lines, swap debit/credit, AND carry over the entity links.
    INSERT INTO public.journal_lines (
        journal_entry_id,
        account_id,
        debit,
        credit,
        cash_bank_account_id,
        customer_id, -- Added this column
        supplier_id  -- Added this column
    )
    SELECT
        v_reversal_journal_entry_id,
        account_id,
        credit, -- Swapped
        debit,  -- Swapped
        cash_bank_account_id,
        customer_id, -- Carry over the original customer link
        supplier_id  -- Carry over the original supplier link
    FROM public.journal_lines
    WHERE journal_entry_id = v_original_journal_entry_id;

    RETURN v_reversal_journal_entry_id;
END;
$$;


--
-- Name: create_system_accounts_for_company(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_system_accounts_for_company(p_company_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Create System Accounts (unchanged logic)
    INSERT INTO public.chart_of_accounts (company_id, account_code, account_name, account_class, account_type, system_account_type) VALUES (p_company_id, '1100', 'Accounts Receivable', 'ASSET', 'Current Asset', 'AccountsReceivable'),(p_company_id, '1210', 'Bank Accounts', 'ASSET', 'Current Asset', 'BankAccounts'),(p_company_id, '1300', 'Inventory', 'ASSET', 'Current Asset', 'Inventory'),(p_company_id, '1410', 'IGST Receivable', 'ASSET', 'Current Asset', 'IgstReceivable'),(p_company_id, '1420', 'CGST Receivable', 'ASSET', 'Current Asset', 'CgstReceivable'),(p_company_id, '1430', 'SGST Receivable', 'ASSET', 'Current Asset', 'SgstReceivable'),(p_company_id, '2100', 'Accounts Payable', 'LIABILITY', 'Current Liability', 'AccountsPayable'),(p_company_id, '2210', 'IGST Payable', 'LIABILITY', 'Current Liability', 'IgstPayable'),(p_company_id, '2220', 'CGST Payable', 'LIABILITY', 'Current Liability', 'CgstPayable'),(p_company_id, '2230', 'SGST Payable', 'LIABILITY', 'Current Liability', 'SgstPayable'),(p_company_id, '4100', 'Sales Revenue', 'REVENUE', 'Operating Revenue', 'SalesRevenue'),(p_company_id, '4200', 'Sales Returns', 'REVENUE', 'Contra Revenue', 'SalesReturns'),(p_company_id, '5100', 'Cost of Goods Sold', 'EXPENSE', 'Cost of Sales', 'CostOfGoodsSold'),(p_company_id, '5300', 'Purchase Returns', 'EXPENSE', 'Contra Expense', 'PurchaseReturns'),(p_company_id, '3200', 'Retained Earnings', 'EQUITY', 'Retained Earnings', 'RetainedEarnings') ON CONFLICT (company_id, system_account_type) DO UPDATE SET account_name = EXCLUDED.account_name;

    -- *** NEW: Create a default warehouse for the new company ***
    INSERT INTO public.warehouses (company_id, name, location)
    VALUES (p_company_id, 'Main Warehouse', 'Default Location')
    ON CONFLICT (company_id, name) DO NOTHING; -- Avoid errors if it somehow already exists

    RAISE NOTICE 'System accounts and default warehouse created for company %', p_company_id;
END;
$$;


--
-- Name: create_tax_group_with_rates(uuid, text, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_tax_group_with_rates(p_company_id uuid, p_name text, p_tax_rate_ids uuid[]) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tax_group_id UUID;
    v_tax_rate_id UUID;
    v_result JSON;
BEGIN
    -- Create the tax group
    INSERT INTO public.tax_groups (company_id, name)
    VALUES (p_company_id, p_name)
    RETURNING id INTO v_tax_group_id;
    
    -- Link the tax group to the specified tax rates
    IF p_tax_rate_ids IS NOT NULL AND array_length(p_tax_rate_ids, 1) > 0 THEN
        FOREACH v_tax_rate_id IN ARRAY p_tax_rate_ids
        LOOP
            INSERT INTO public.tax_group_rates (tax_group_id, tax_rate_id)
            VALUES (v_tax_group_id, v_tax_rate_id);
        END LOOP;
    END IF;
    
    -- Return the created tax group as JSON
    SELECT row_to_json(tg.*)
    INTO v_result
    FROM (
        SELECT 
            id,
            company_id,
            name,
            created_at,
            updated_at,
            deleted_at
        FROM public.tax_groups
        WHERE id = v_tax_group_id
    ) tg;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create tax group: %', SQLERRM;
END;
$$;


--
-- Name: delete_company_and_all_data(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_company_and_all_data(p_company_id_to_delete uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Step 1: Unlink any users from the company.
    UPDATE public.profiles
    SET company_id = NULL
    WHERE company_id = p_company_id_to_delete;

    -- Step 2: Delete all source financial and operational documents.
    -- Your existing triggers will correctly handle the deletion of journal entries
    -- and inventory movements *associated with these specific documents*.
    DELETE FROM public.sales_invoices WHERE company_id = p_company_id_to_delete;
    DELETE FROM publipurchase_billsc. WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.sales_credit_notes WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.purchase_debit_notes WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.journal_vouchers WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.daily_logs WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.sales_targets WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.fixed_assets WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.financial_periods WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.bank_reconciliations
        WHERE account_id IN (SELECT id FROM public.chart_of_accounts WHERE company_id = p_company_id_to_delete);

    -- Step 3: Explicitly delete all remaining inventory movements.
    -- This is the critical new step. It removes any movements not linked to the
    -- documents above (e.g., INITIAL_STOCK, ADJUSTMENT_IN/OUT). This clears the path
    -- for deleting products, as the 'inventory_movements_product_id_fkey'
    -- constraint will now be satisfied.
    DELETE FROM public.inventory_movements WHERE company_id = p_company_id_to_delete;

    -- Step 4: Delete master data. Now that their transaction history is gone,
    -- these can be safely deleted in any order.
    DELETE FROM public.products WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.customers WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.suppliers WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.warehouses WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.tax_groups WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.tax_rates WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.numbering_settings WHERE company_id = p_company_id_to_delete;

    -- Step 5: Delete the accounting structure.
    -- All source documents and journal vouchers are gone, so their triggers have already
    -- removed all journal_entries and journal_lines. The path is now clear to
    -- delete the chart of accounts.
    DELETE FROM public.cash_bank_accounts WHERE company_id = p_company_id_to_delete;
    DELETE FROM public.chart_of_accounts WHERE company_id = p_company_id_to_delete;

    -- Step 6: Finally, delete the company record itself.
    DELETE FROM public.companies WHERE id = p_company_id_to_delete;

    RAISE NOTICE 'Successfully deleted company % and all its associated data.', p_company_id_to_delete;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'An error occurred during company deletion: %', SQLERRM;
END;
$$;


--
-- Name: generate_balance_sheet_statement(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_balance_sheet_statement(p_company_id uuid, p_as_of_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_report JSONB;
    v_fy_start_date DATE := (date_trunc('year', p_as_of_date - interval '3 months') + interval '3 months')::date;
    v_total_assets NUMERIC;
    v_total_liabilities NUMERIC;
    v_total_equity NUMERIC;
    v_assets JSONB;
    v_liabilities JSONB;
    v_equity JSONB;
BEGIN
    -- This CTE calculates the closing balance for every account that has a bs_head.
    -- The balance is calculated as (Debit - Credit).
    -- ASSET balances will be positive.
    -- LIABILITY & EQUITY balances will be negative.
    WITH account_balances AS (
        SELECT
            coa.bs_head,
            coa.account_class,
            SUM(jl.debit - jl.credit) as balance
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        JOIN public.chart_of_accounts coa ON jl.account_id = coa.id
        WHERE
            je.company_id = p_company_id
            AND je.entry_date <= p_as_of_date
            AND coa.account_class IN ('ASSET', 'LIABILITY', 'EQUITY')
            AND coa.bs_head IS NOT NULL
        GROUP BY coa.bs_head, coa.account_class
    ),
    -- This CTE gets the profit (or loss) for the current financial period.
    current_period_profit AS (
        SELECT
            -- We extract the 'profitBeforeTax' value from the P&L JSON report.
            -- COALESCE ensures it's 0 if the report is empty.
            COALESCE((public.generate_trading_and_pl_statement(p_company_id, v_fy_start_date, p_as_of_date) ->> 'profitBeforeTax')::numeric, 0) as amount
    ),
    -- This CTE gets the sum of all retained earnings from PREVIOUSLY closed periods.
    historical_retained_earnings AS (
        SELECT
             -- This value is stored after closing a financial year.
            COALESCE(SUM(retained_earnings), 0) as amount
        FROM public.financial_periods
        WHERE
            company_id = p_company_id
            AND status = 'closed'
            AND end_date < v_fy_start_date
    ),
    -- This CTE builds the final structure for the report's JSON.
    report_structure AS (
        SELECT
            -- Aggregate all ASSET accounts into a single JSON object.
            -- The balance is kept as is (positive).
            jsonb_object_agg(bs_head, balance) FILTER (WHERE account_class = 'ASSET') AS assets_json,

            -- Aggregate all LIABILITY accounts into a single JSON object.
            -- We negate the balance (-balance) to show it as a positive number in the report.
            jsonb_object_agg(bs_head, -balance) FILTER (WHERE account_class = 'LIABILITY') AS liabilities_json,

            -- Build the EQUITY section manually for clarity.
            jsonb_build_object(
                'share_capital', COALESCE((SELECT -balance FROM account_balances WHERE bs_head = 'share_capital'), 0),
                'reserves_and_surplus', (SELECT amount FROM historical_retained_earnings),
                'current_period_profit', (SELECT amount FROM current_period_profit)
            ) AS equity_json
        FROM account_balances
    )
    -- Final SELECT to populate the variables and build the final report object.
    SELECT
        COALESCE(assets_json, '{}'::jsonb),
        COALESCE(liabilities_json, '{}'::jsonb),
        equity_json,
        -- Calculate totals for verification.
        (SELECT COALESCE(SUM(balance), 0) FROM account_balances WHERE account_class = 'ASSET'),
        (SELECT COALESCE(SUM(-balance), 0) FROM account_balances WHERE account_class = 'LIABILITY'),
        -- Total Equity is Capital + Historical Profit + Current Profit
        (SELECT COALESCE(SUM(-balance), 0) FROM account_balances WHERE bs_head = 'share_capital') +
        (SELECT amount FROM historical_retained_earnings) +
        (SELECT amount FROM current_period_profit)
    INTO
        v_assets,
        v_liabilities,
        v_equity,
        v_total_assets,
        v_total_liabilities,
        v_total_equity
    FROM report_structure;

    -- Construct the final JSONB report object.
    v_report := jsonb_build_object(
        'asOfDate', p_as_of_date,
        'financialYearStart', v_fy_start_date,
        'assets', v_assets,
        'liabilities', v_liabilities,
        'equity', v_equity,
        'totals', jsonb_build_object(
            'assets', v_total_assets,
            'liabilities', v_total_liabilities,
            'equity', v_total_equity,
            'liabilitiesAndEquity', v_total_liabilities + v_total_equity
        ),
        'isBalanced', (v_total_assets = (v_total_liabilities + v_total_equity))
    );

    RETURN v_report;
END;
$$;


--
-- Name: generate_cash_flow_statement(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_cash_flow_statement(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_opening_balance NUMERIC;
    v_result JSONB;
BEGIN
    -- Step 1: Calculate the opening balance of all cash/bank accounts before the start date.
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) INTO v_opening_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.company_id = p_company_id
      AND jl.account_id IN (SELECT chart_of_account_id FROM public.cash_bank_accounts WHERE company_id = p_company_id)
      AND je.entry_date < p_start_date;

    -- Step 2: Use CTEs to find all cash-related journal entries and categorize them.
    WITH 
    -- First, get a list of all cash/bank account IDs for the company.
    cash_accounts AS (
        SELECT chart_of_account_id FROM public.cash_bank_accounts WHERE company_id = p_company_id
    ),
    -- For each journal entry, calculate its net cash impact and find the classes of all non-cash accounts.
    entry_analysis AS (
        SELECT
            je.id,
            je.entry_date,
            je.narration,
            -- Calculate the net cash change within this single journal entry.
            SUM(CASE WHEN jl.account_id IN (SELECT chart_of_account_id FROM cash_accounts) THEN jl.debit - jl.credit ELSE 0 END) as net_cash_change,
            -- Aggregate the account classes of all *other* accounts in the entry.
            array_agg(DISTINCT coa.account_class) FILTER (WHERE jl.account_id NOT IN (SELECT chart_of_account_id FROM cash_accounts)) as counter_party_classes
        FROM public.journal_entries je
        JOIN public.journal_lines jl ON je.id = jl.journal_entry_id
        JOIN public.chart_of_accounts coa ON jl.account_id = coa.id
        WHERE je.company_id = p_company_id
          AND je.entry_date BETWEEN p_start_date AND p_end_date
          -- Only include entries that have a cash component.
          AND EXISTS (
              SELECT 1 FROM public.journal_lines jl_check 
              WHERE jl_check.journal_entry_id = je.id 
              AND jl_check.account_id IN (SELECT chart_of_account_id FROM cash_accounts)
          )
        GROUP BY je.id, je.entry_date, je.narration
    ),
    -- Categorize each transaction based on the strict hierarchy.
    categorized_transactions AS (
        SELECT
            entry_date,
            narration,
            net_cash_change,
            CASE
                WHEN 'EQUITY' = ANY(counter_party_classes) OR 'LIABILITY' = ANY(counter_party_classes) THEN 'Financing'
                WHEN 'ASSET' = ANY(counter_party_classes) THEN 'Investing'
                ELSE 'Operating'
            END AS category
        FROM entry_analysis
        -- This logic refines the category for Liabilities and Assets based on if they are current or non-current in a real-world scenario.
        -- For simplicity and robustness, we use the main classes here.
    )
    -- Final aggregation to build the detailed JSON output.
    SELECT jsonb_build_object(
        'period', jsonb_build_object('start', p_start_date, 'end', p_end_date),
        'openingBalance', v_opening_balance,
        'operatingActivities', jsonb_build_object(
            'net', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Operating'), 0),
            'inflows', jsonb_build_object(
                'total', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Operating' AND net_cash_change > 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', net_cash_change)) FILTER (WHERE category = 'Operating' AND net_cash_change > 0), '[]')
            ),
            'outflows', jsonb_build_object(
                'total', COALESCE(SUM(ABS(net_cash_change)) FILTER (WHERE category = 'Operating' AND net_cash_change < 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', ABS(net_cash_change))) FILTER (WHERE category = 'Operating' AND net_cash_change < 0), '[]')
            )
        ),
        'investingActivities', jsonb_build_object(
             'net', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Investing'), 0),
            'inflows', jsonb_build_object(
                'total', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Investing' AND net_cash_change > 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', net_cash_change)) FILTER (WHERE category = 'Investing' AND net_cash_change > 0), '[]')
            ),
            'outflows', jsonb_build_object(
                'total', COALESCE(SUM(ABS(net_cash_change)) FILTER (WHERE category = 'Investing' AND net_cash_change < 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', ABS(net_cash_change))) FILTER (WHERE category = 'Investing' AND net_cash_change < 0), '[]')
            )
        ),
        'financingActivities', jsonb_build_object(
             'net', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Financing'), 0),
            'inflows', jsonb_build_object(
                'total', COALESCE(SUM(net_cash_change) FILTER (WHERE category = 'Financing' AND net_cash_change > 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', net_cash_change)) FILTER (WHERE category = 'Financing' AND net_cash_change > 0), '[]')
            ),
            'outflows', jsonb_build_object(
                'total', COALESCE(SUM(ABS(net_cash_change)) FILTER (WHERE category = 'Financing' AND net_cash_change < 0), 0),
                'transactions', COALESCE(jsonb_agg(jsonb_build_object('date', entry_date, 'narration', narration, 'amount', ABS(net_cash_change))) FILTER (WHERE category = 'Financing' AND net_cash_change < 0), '[]')
            )
        ),
        'netChangeInCash', COALESCE(SUM(net_cash_change), 0),
        'closingBalance', v_opening_balance + COALESCE(SUM(net_cash_change), 0)
    ) INTO v_result
    FROM categorized_transactions;

    RETURN v_result;
END;
$$;


--
-- Name: generate_detailed_balance_sheet_statement(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_detailed_balance_sheet_statement(p_company_id uuid, p_as_of_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result JSONB;
    v_fy_start_date DATE := (date_trunc('year', p_as_of_date - interval '3 months') + interval '3 months')::date;
BEGIN
    WITH
    -- Get individual account balances with their details
    account_balances AS (
        SELECT
            coa.id as account_id,
            coa.account_code,
            coa.account_name,
            coa.bs_head,
            coa.account_class,
            coa.parent_account_id,
            SUM(jl.debit - jl.credit) as balance
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        JOIN public.chart_of_accounts coa ON jl.account_id = coa.id
        WHERE
            je.company_id = p_company_id
            AND je.entry_date <= p_as_of_date
            AND coa.account_class IN ('ASSET', 'LIABILITY', 'EQUITY')
            AND coa.bs_head IS NOT NULL
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.bs_head, coa.account_class, coa.parent_account_id
        HAVING SUM(jl.debit - jl.credit) != 0
    ),
    -- Get current period profit
    current_period_profit AS (
        SELECT
            COALESCE((public.generate_trading_and_pl_statement(p_company_id, v_fy_start_date, p_as_of_date) ->> 'profitBeforeTax')::numeric, 0) as amount
    ),
    -- Get historical retained earnings
    historical_retained_earnings AS (
        SELECT
            COALESCE(SUM(retained_earnings), 0) as amount
        FROM public.financial_periods
        WHERE
            company_id = p_company_id
            AND status = 'closed'
            AND end_date < v_fy_start_date
    ),
    -- Build hierarchical structure for each BS head
    hierarchical_accounts AS (
        SELECT
            bs_head,
            account_class,
            jsonb_build_object(
                'accountId', bs_head || '_group',
                'accountCode', UPPER(bs_head),
                'accountName', CASE 
                    WHEN bs_head = 'current_assets' THEN 'Current Assets'
                    WHEN bs_head = 'fixed_assets' THEN 'Fixed Assets'
                    WHEN bs_head = 'investments' THEN 'Investments'
                    WHEN bs_head = 'other_assets' THEN 'Other Assets'
                    WHEN bs_head = 'current_liabilities' THEN 'Current Liabilities'
                    WHEN bs_head = 'long_term_liabilities' THEN 'Long Term Liabilities'
                    WHEN bs_head = 'provisions' THEN 'Provisions'
                    WHEN bs_head = 'share_capital' THEN 'Share Capital'
                    ELSE INITCAP(REPLACE(bs_head, '_', ' '))
                END,
                'total', CASE 
                    WHEN account_class = 'ASSET' THEN COALESCE(SUM(balance), 0)
                    ELSE COALESCE(SUM(-balance), 0)  -- Show liabilities and equity as positive
                END,
                'accounts', COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'accountId', account_id::text,
                        'accountCode', account_code,
                        'accountName', account_name,
                        'total', CASE 
                            WHEN account_class = 'ASSET' THEN balance
                            ELSE -balance  -- Show liabilities and equity as positive
                        END,
                        'accounts', '[]'::jsonb
                    )
                    ORDER BY account_code
                ) FILTER (WHERE account_id IS NOT NULL), '[]'::jsonb)
            ) as node_data,
            CASE 
                WHEN account_class = 'ASSET' THEN COALESCE(SUM(balance), 0)
                ELSE COALESCE(SUM(-balance), 0)
            END as total
        FROM account_balances
        GROUP BY bs_head, account_class
    )
    -- Build the final result
    SELECT jsonb_build_object(
        'asOfDate', p_as_of_date,
        'assets', COALESCE((
            SELECT jsonb_object_agg(bs_head, node_data)
            FROM hierarchical_accounts 
            WHERE account_class = 'ASSET'
        ), '{}'::jsonb),
        'liabilities', COALESCE((
            SELECT jsonb_object_agg(bs_head, node_data)
            FROM hierarchical_accounts 
            WHERE account_class = 'LIABILITY'
        ), '{}'::jsonb),
        'equity', jsonb_build_object(
            'share_capital', COALESCE((
                SELECT node_data FROM hierarchical_accounts WHERE bs_head = 'share_capital'
            ), jsonb_build_object(
                'accountId', 'share_capital_group',
                'accountCode', 'SHARE_CAPITAL',
                'accountName', 'Share Capital',
                'total', 0,
                'accounts', '[]'::jsonb
            )),
           'reserves_and_surplus',
                -- Start with the live accounts (like Opening Balance Equity) fetched from the CTE.
                -- Coalesce ensures we have a valid JSON object even if no live accounts exist.
                COALESCE((SELECT node_data FROM hierarchical_accounts WHERE bs_head = 'reserves_and_surplus'), jsonb_build_object('total', 0, 'accounts', '[]'::jsonb))
                -- Merge in the historical retained earnings data.
                || jsonb_build_object(
                    'total', (COALESCE((SELECT total FROM hierarchical_accounts WHERE bs_head = 'reserves_and_surplus'), 0) + (SELECT amount FROM historical_retained_earnings)),
                    'accounts', COALESCE((SELECT node_data->'accounts' FROM hierarchical_accounts WHERE bs_head = 'reserves_and_surplus'), '[]'::jsonb) ||
                                jsonb_build_array(
                                    jsonb_build_object(
                                        'accountId', 'historical_retained_earnings',
                                        'accountCode', 'HIST_RE',
                                        'accountName', 'Retained Earnings (Prior Periods)',
                                        'total', (SELECT amount FROM historical_retained_earnings),
                                        'accounts', '[]'::jsonb
                                    )
                                )
                ),
            'current_period_profit', jsonb_build_object(
                'accountId', 'current_period_profit_group',
                'accountCode', 'CURR_PROFIT',
                'accountName', 'Current Period Profit',
                'total', (SELECT amount FROM current_period_profit),
                'accounts', jsonb_build_array(
                    jsonb_build_object(
                        'accountId', 'current_profit_detail',
                        'accountCode', 'PROFIT',
                        'accountName', 'Profit / (Loss) for the period',
                        'total', (SELECT amount FROM current_period_profit),
                        'accounts', '[]'::jsonb
                    )
                )
            )
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;


--
-- Name: generate_detailed_gstr1_report(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_detailed_gstr1_report(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result JSONB;
    v_company_gstin TEXT;
    v_company_state TEXT;
BEGIN
    -- Get the company's own GSTIN and State for context
    SELECT gstin, state INTO v_company_gstin, v_company_state FROM public.companies WHERE id = p_company_id;

    WITH
    -- Pre-aggregrate taxes at the line-item level to prevent double-counting taxable value
    line_tax_agg AS (
        SELECT
            silt.invoice_line_id,
            tr.rate,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.sales_invoice_line_taxes silt
        JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
        GROUP BY silt.invoice_line_id, tr.rate
    ),
    -- Section 1: Business-to-Business (B2B) Invoices
    b2b_rate_summary AS (
        SELECT
            sil.invoice_id,
            lta.rate,
            SUM(sil.line_total) AS taxable_value,
            SUM(lta.igst) AS igst,
            SUM(lta.cgst) AS cgst,
            SUM(lta.sgst) AS sgst
        FROM public.sales_invoice_lines sil
        JOIN line_tax_agg lta ON sil.id = lta.invoice_line_id
        GROUP BY sil.invoice_id, lta.rate
    ),
    b2b_invoices AS (
        SELECT
            c.gstin AS recipient_gstin,
            si.invoice_number,
            si.invoice_date,
            si.total_amount AS invoice_value,
            si.place_of_supply,
            si.gstr1_invoice_type::TEXT AS invoice_type,
            jsonb_agg(jsonb_build_object(
                'rate', brs.rate,
                'taxable_value', brs.taxable_value,
                'igst', brs.igst,
                'cgst', brs.cgst,
                'sgst', brs.sgst
            )) AS rate_details
        FROM public.sales_invoices si
        JOIN public.customers c ON si.customer_id = c.id
        JOIN b2b_rate_summary brs ON si.id = brs.invoice_id
        WHERE si.company_id = p_company_id
          AND si.invoice_date BETWEEN p_start_date AND p_end_date
          AND c.gstin IS NOT NULL
        GROUP BY si.id, c.gstin
    ),

    -- Section 2: Business-to-Consumer Large (B2CL) Invoices
    b2cl_invoices AS (
        SELECT
            si.invoice_number,
            si.invoice_date,
            si.total_amount AS invoice_value,
            si.place_of_supply,
            jsonb_agg(jsonb_build_object(
                'rate', brs.rate,
                'taxable_value', brs.taxable_value,
                'igst', brs.igst
            )) AS rate_details
        FROM public.sales_invoices si
        JOIN public.customers c ON si.customer_id = c.id
        JOIN b2b_rate_summary brs ON si.id = brs.invoice_id -- Can reuse b2b_rate_summary
        WHERE si.company_id = p_company_id
          AND si.invoice_date BETWEEN p_start_date AND p_end_date
          AND c.gstin IS NULL
          AND si.total_amount > 250000
          AND si.place_of_supply != v_company_state
        GROUP BY si.id
    ),

    -- Section 3: Business-to-Consumer Small (B2CS) Summary
    b2cs_summary AS (
        SELECT
            si.place_of_supply,
            tr.rate,
            'OE' as type,
            SUM(sil.line_total) AS total_taxable_value,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS total_igst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS total_cgst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS total_sgst
        FROM public.sales_invoices si
        JOIN public.customers c ON si.customer_id = c.id
        JOIN public.sales_invoice_lines sil ON si.id = sil.invoice_id
        LEFT JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
        LEFT JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
        WHERE si.company_id = p_company_id
          AND si.invoice_date BETWEEN p_start_date AND p_end_date
          AND c.gstin IS NULL
          AND NOT (si.total_amount > 250000 AND si.place_of_supply != v_company_state) -- Exclude B2CL
        GROUP BY si.place_of_supply, tr.rate
    ),

    -- Section 4: Credit/Debit Notes (Registered - CDNR)
    credit_note_line_tax_agg AS (
        SELECT
            scnlt.credit_note_line_id,
            tr.rate,
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.sales_credit_note_line_taxes scnlt
        JOIN public.tax_rates tr ON scnlt.tax_rate_id = tr.id
        GROUP BY scnlt.credit_note_line_id, tr.rate
    ),
    cdnr_rate_summary AS (
        SELECT
            scnl.credit_note_id,
            cnta.rate,
            SUM(scnl.line_total) AS taxable_value,
            SUM(cnta.igst) AS igst,
            SUM(cnta.cgst) AS cgst,
            SUM(cnta.sgst) AS sgst
        FROM public.sales_credit_note_lines scnl
        JOIN credit_note_line_tax_agg cnta ON scnl.id = cnta.credit_note_line_id
        GROUP BY scnl.credit_note_id, cnta.rate
    ),
    cdnr_notes AS (
        SELECT
            c.gstin AS recipient_gstin,
            scn.note_number,
            scn.note_date,
            'C' AS note_type,
            si.invoice_number AS original_invoice_number,
            si.invoice_date AS original_invoice_date,
            scn.total_amount AS note_value,
            scn.place_of_supply,
             jsonb_agg(jsonb_build_object(
                'rate', crs.rate,
                'taxable_value', crs.taxable_value,
                'igst', crs.igst,
                'cgst', crs.cgst,
                'sgst', crs.sgst
            )) AS rate_details
        FROM public.sales_credit_notes scn
        JOIN public.customers c ON scn.customer_id = c.id
        LEFT JOIN public.sales_invoices si ON scn.original_invoice_id = si.id
        JOIN cdnr_rate_summary crs ON scn.id = crs.credit_note_id
        WHERE scn.company_id = p_company_id
          AND scn.note_date BETWEEN p_start_date AND p_end_date
          AND c.gstin IS NOT NULL
        GROUP BY scn.id, c.gstin, si.invoice_number, si.invoice_date
    ),

    -- Section 5: HSN-wise Summary of Outward Supplies -- <<<<<<<<<<<<<<< FIX IS HERE
    hsn_base AS (
        SELECT
            sil.hsn_sac_code,
            p.description,
            SUM(sil.quantity) AS total_quantity,
            SUM(sil.line_total) AS total_taxable_value
        FROM public.sales_invoice_lines sil
        JOIN public.sales_invoices si ON sil.invoice_id = si.id
        JOIN public.products p ON sil.product_id = p.id
        WHERE si.company_id = p_company_id
          AND si.invoice_date BETWEEN p_start_date AND p_end_date
        GROUP BY sil.hsn_sac_code, p.description
    ),
    hsn_taxes AS (
        SELECT
            sil.hsn_sac_code,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS total_igst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS total_cgst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS total_sgst
        FROM public.sales_invoice_lines sil
        JOIN public.sales_invoices si ON sil.invoice_id = si.id
        JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
        JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
        WHERE si.company_id = p_company_id
          AND si.invoice_date BETWEEN p_start_date AND p_end_date
        GROUP BY sil.hsn_sac_code
    ),
    hsn_summary AS (
        SELECT
            hb.hsn_sac_code,
            hb.description,
            hb.total_quantity,
            hb.total_taxable_value,
            COALESCE(ht.total_igst, 0) AS total_igst,
            COALESCE(ht.total_cgst, 0) AS total_cgst,
            COALESCE(ht.total_sgst, 0) AS total_sgst
        FROM hsn_base hb
        LEFT JOIN hsn_taxes ht ON hb.hsn_sac_code = ht.hsn_sac_code
    )

    -- Final Assembly of the Report
    SELECT jsonb_build_object(
        'gstin', v_company_gstin,
        'period', to_char(p_start_date, 'MMYYYY'),
        'b2b', COALESCE((SELECT jsonb_agg(b2b) FROM b2b_invoices b2b), '[]'::jsonb),
        'b2cl', COALESCE((SELECT jsonb_agg(b2cl) FROM b2cl_invoices b2cl), '[]'::jsonb),
        'b2cs', COALESCE((SELECT jsonb_agg(b2cs) FROM b2cs_summary b2cs), '[]'::jsonb),
        'cdnr', COALESCE((SELECT jsonb_agg(cdnr) FROM cdnr_notes cdnr), '[]'::jsonb),
        'hsn', COALESCE((SELECT jsonb_agg(hsn) FROM hsn_summary hsn), '[]'::jsonb)
    ) INTO v_result;

    RETURN v_result;
END;
$$;


--
-- Name: generate_detailed_gstr3b_report(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_detailed_gstr3b_report(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH
    -- == PART 1: OUTWARD SUPPLIES (SALES) and REDUCTIONS (CREDIT NOTES) ==

    -- Step 1.1: Calculate GROSS Taxable Sales
    gross_outward_taxable_value AS (
        SELECT COALESCE(SUM(si.subtotal), 0) AS value
        FROM public.sales_invoices si
        WHERE si.company_id = p_company_id AND si.invoice_date BETWEEN p_start_date AND p_end_date
          AND EXISTS (SELECT 1 FROM sales_invoice_lines sil JOIN sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id WHERE sil.invoice_id = si.id)
    ),
    -- Step 1.2: Calculate GROSS Sales Tax
    gross_outward_taxes AS (
        SELECT
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(silt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.sales_invoices si
        JOIN public.sales_invoice_lines sil ON si.id = sil.invoice_id
        JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
        JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
        WHERE si.company_id = p_company_id AND si.invoice_date BETWEEN p_start_date AND p_end_date
    ),
    -- Step 1.3: Calculate REDUCTION in Taxable Value from Credit Notes
    credit_note_taxable_value AS (
        SELECT COALESCE(SUM(scn.subtotal), 0) AS value
        FROM public.sales_credit_notes scn
        WHERE scn.company_id = p_company_id AND scn.note_date BETWEEN p_start_date AND p_end_date
          AND EXISTS (SELECT 1 FROM sales_credit_note_lines scnl JOIN sales_credit_note_line_taxes scnlt ON scnl.id = scnlt.credit_note_line_id WHERE scnl.credit_note_id = scn.id)
    ),
    -- Step 1.4: Calculate REDUCTION in Tax from Credit Notes
    credit_note_taxes AS (
        SELECT
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(scnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.sales_credit_notes scn
        JOIN public.sales_credit_note_lines scnl ON scn.id = scnl.credit_note_id
        JOIN public.sales_credit_note_line_taxes scnlt ON scnl.id = scnlt.credit_note_line_id
        JOIN public.tax_rates tr ON scnlt.tax_rate_id = tr.id
        WHERE scn.company_id = p_company_id AND scn.note_date BETWEEN p_start_date AND p_end_date
    ),
    -- Step 1.5: Calculate NET Outward Supplies
    net_outward_summary AS (
        SELECT
            (gotv.value - cntv.value) AS total_taxable_value,
            (got.igst - cnt.igst) AS igst,
            (got.cgst - cnt.cgst) AS cgst,
            (got.sgst - cnt.sgst) AS sgst
        FROM gross_outward_taxable_value gotv, gross_outward_taxes got,
             credit_note_taxable_value cntv, credit_note_taxes cnt
    ),

    -- == PART 2: INWARD SUPPLIES (RCM) == (Assuming no RCM returns for simplicity, can be added if needed)
    inward_rcm_summary AS (
        SELECT
            COALESCE(SUM(pb.subtotal), 0) AS total_taxable_value,
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.purchase_bills pb
        JOIN public.purchase_bill_lines pbl ON pb.id = pbl.bill_id
        JOIN public.purchase_bill_line_taxes pblt ON pbl.id = pblt.bill_line_id
        JOIN public.tax_rates tr ON pblt.tax_rate_id = tr.id
        WHERE pb.company_id = p_company_id
          AND pb.bill_date BETWEEN p_start_date AND p_end_date
          AND pb.is_reverse_charge_applicable = TRUE
    ),

    -- == PART 3: ELIGIBLE ITC and REVERSALS (DEBIT NOTES) ==

    -- Step 3.1: Calculate GROSS Eligible ITC from Purchases
    gross_eligible_itc AS (
        SELECT
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(pblt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.purchase_bills pb
        JOIN public.purchase_bill_lines pbl ON pb.id = pbl.bill_id
        JOIN public.purchase_bill_line_taxes pblt ON pbl.id = pblt.bill_line_id
        JOIN public.tax_rates tr ON pblt.tax_rate_id = tr.id
        WHERE pb.company_id = p_company_id
          AND pb.bill_date BETWEEN p_start_date AND p_end_date
          AND pb.is_reverse_charge_applicable = FALSE
    ),
    -- Step 3.2: Calculate ITC REVERSAL from Debit Notes
    debit_note_itc_reversal AS (
        SELECT
            COALESCE(SUM(pdnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'IGST%'), 0) AS igst,
            COALESCE(SUM(pdnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'CGST%'), 0) AS cgst,
            COALESCE(SUM(pdnlt.tax_amount) FILTER (WHERE tr.name ILIKE 'SGST%'), 0) AS sgst
        FROM public.purchase_debit_notes pdn
        JOIN public.purchase_debit_note_lines pdnl ON pdn.id = pdnl.debit_note_id
        JOIN public.purchase_debit_note_line_taxes pdnlt ON pdnl.id = pdnlt.debit_note_line_id
        JOIN public.tax_rates tr ON pdnlt.tax_rate_id = tr.id
        WHERE pdn.company_id = p_company_id AND pdn.note_date BETWEEN p_start_date AND p_end_date
    ),
    -- Step 3.3: Calculate NET Eligible ITC
    net_eligible_itc AS (
        SELECT
            (gei.igst - dnr.igst) as igst,
            (gei.cgst - dnr.cgst) as cgst,
            (gei.sgst - dnr.sgst) as sgst
        FROM gross_eligible_itc gei, debit_note_itc_reversal dnr
    )

    -- Final Assembly of the Report
    SELECT jsonb_build_object(
        'period', jsonb_build_object('start_date', p_start_date, 'end_date', p_end_date),
        'outward_supplies', (SELECT to_jsonb(nos) FROM net_outward_summary nos),
        'inward_rcm_supplies', (SELECT to_jsonb(irs) FROM inward_rcm_summary irs),
        'eligible_itc', (SELECT to_jsonb(nei) FROM net_eligible_itc nei)
    ) INTO v_result;

    RETURN v_result;
END;
$$;


--
-- Name: generate_detailed_trading_and_pl_statement(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_detailed_trading_and_pl_statement(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Use the existing logic from the working function but enhance the output
    WITH account_balances AS (
        SELECT
            coa.id as account_id,
            coa.account_code,
            coa.account_name,
            coa.pnl_head,
            CASE 
                WHEN coa.pnl_head IN ('revenue_from_operations', 'other_income') THEN
                    COALESCE(SUM(jl.credit - jl.debit), 0)
                ELSE
                    COALESCE(SUM(jl.debit - jl.credit), 0)
            END as balance
        FROM public.chart_of_accounts coa
        LEFT JOIN public.journal_lines jl ON coa.id = jl.account_id
        LEFT JOIN public.journal_entries je ON jl.journal_entry_id = je.id
            AND je.entry_date BETWEEN p_start_date AND p_end_date
            AND je.company_id = p_company_id
        WHERE
            coa.company_id = p_company_id
            AND coa.pnl_head IS NOT NULL
            AND coa.account_class IN ('REVENUE', 'EXPENSE')
        GROUP BY coa.id, coa.account_code, coa.account_name, coa.pnl_head
        HAVING COALESCE(SUM(CASE 
            WHEN coa.pnl_head IN ('revenue_from_operations', 'other_income') THEN jl.credit - jl.debit
            ELSE jl.debit - jl.credit
        END), 0) != 0
    )
    SELECT jsonb_build_object(
        'tradingAccount', jsonb_build_object(
            'sales', jsonb_build_object(
                'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'revenue_from_operations'), 0),
                'accounts', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'accountId', account_id::text,
                            'accountCode', account_code,
                            'accountName', account_name,
                            'amount', balance
                        ) ORDER BY account_code
                    )
                    FROM account_balances 
                    WHERE pnl_head = 'revenue_from_operations'
                ), '[]'::jsonb)
            ),
            'costOfGoodsSold', jsonb_build_object(
                'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'cost_of_materials'), 0),
                'accounts', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'accountId', account_id::text,
                            'accountCode', account_code,
                            'accountName', account_name,
                            'amount', balance
                        ) ORDER BY account_code
                    )
                    FROM account_balances 
                    WHERE pnl_head = 'cost_of_materials'
                ), '[]'::jsonb)
            ),
            'directExpenses', jsonb_build_object(
                'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'direct_expenses'), 0),
                'accounts', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'accountId', account_id::text,
                            'accountCode', account_code,
                            'accountName', account_name,
                            'amount', balance
                        ) ORDER BY account_code
                    )
                    FROM account_balances 
                    WHERE pnl_head = 'direct_expenses'
                ), '[]'::jsonb)
            )
        ),
        'grossProfit', 
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'revenue_from_operations'), 0) -
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'cost_of_materials'), 0) -
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'direct_expenses'), 0),
        'profitLossAccount', jsonb_build_object(
            'otherIncome', jsonb_build_object(
                'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_income'), 0),
                'accounts', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'accountId', account_id::text,
                            'accountCode', account_code,
                            'accountName', account_name,
                            'amount', balance
                        ) ORDER BY account_code
                    )
                    FROM account_balances 
                    WHERE pnl_head = 'other_income'
                ), '[]'::jsonb)
            ),
            'totalIncome', (
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'revenue_from_operations'), 0) -
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'cost_of_materials'), 0) -
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'direct_expenses'), 0)
            ) + COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_income'), 0),
            'indirectExpenses', jsonb_build_object(
                'employeeBenefits', jsonb_build_object(
                    'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'employee_benefits_expense'), 0),
                    'accounts', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'accountId', account_id::text,
                                'accountCode', account_code,
                                'accountName', account_name,
                                'amount', balance
                            ) ORDER BY account_code
                        )
                        FROM account_balances 
                        WHERE pnl_head = 'employee_benefits_expense'
                    ), '[]'::jsonb)
                ),
                'financeCosts', jsonb_build_object(
                    'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'finance_costs'), 0),
                    'accounts', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'accountId', account_id::text,
                                'accountCode', account_code,
                                'accountName', account_name,
                                'amount', balance
                            ) ORDER BY account_code
                        )
                        FROM account_balances 
                        WHERE pnl_head = 'finance_costs'
                    ), '[]'::jsonb)
                ),
                'depreciationAmortization', jsonb_build_object(
                    'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'depreciation_amortization'), 0),
                    'accounts', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'accountId', account_id::text,
                                'accountCode', account_code,
                                'accountName', account_name,
                                'amount', balance
                            ) ORDER BY account_code
                        )
                        FROM account_balances 
                        WHERE pnl_head = 'depreciation_amortization'
                    ), '[]'::jsonb)
                ),
                'otherExpenses', jsonb_build_object(
                    'total', COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_expenses'), 0),
                    'accounts', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'accountId', account_id::text,
                                'accountCode', account_code,
                                'accountName', account_name,
                                'amount', balance
                            ) ORDER BY account_code
                        )
                        FROM account_balances 
                        WHERE pnl_head = 'other_expenses'
                    ), '[]'::jsonb)
                )
            ),
            'totalIndirectExpenses', 
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'employee_benefits_expense'), 0) +
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'finance_costs'), 0) +
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'depreciation_amortization'), 0) +
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_expenses'), 0)
        ),
        'profitBeforeTax', (
            (
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'revenue_from_operations'), 0) -
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'cost_of_materials'), 0) -
                COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'direct_expenses'), 0)
            ) + COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_income'), 0)
        ) - (
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'employee_benefits_expense'), 0) +
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'finance_costs'), 0) +
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'depreciation_amortization'), 0) +
            COALESCE((SELECT SUM(balance) FROM account_balances WHERE pnl_head = 'other_expenses'), 0)
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


--
-- Name: generate_next_document_number(uuid, public.document_type, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_next_document_number(p_company_id uuid, p_document_type public.document_type, p_date date DEFAULT CURRENT_DATE) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_settings public.numbering_settings;
    v_date_part TEXT := '';
    v_number_part TEXT;
    v_result TEXT;
BEGIN
    -- Get or create settings
    SELECT * INTO v_settings FROM public.get_or_create_numbering_settings(p_company_id, p_document_type);
    
    -- Generate date part if enabled
    IF v_settings.include_date THEN
        CASE v_settings.date_format
            WHEN 'YYYY' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT;
            WHEN 'YYYYMM' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT || 
                              LPAD(EXTRACT(MONTH FROM p_date)::TEXT, 2, '0');
            WHEN 'YYYYMMDD' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT || 
                              LPAD(EXTRACT(MONTH FROM p_date)::TEXT, 2, '0') ||
                              LPAD(EXTRACT(DAY FROM p_date)::TEXT, 2, '0');
        END CASE;
    END IF;
    
    -- Generate number part with padding
    v_number_part := LPAD(v_settings.current_number::TEXT, v_settings.digit_count, '0');
    
    -- Combine parts
    IF v_settings.prefix != '' AND v_date_part != '' THEN
        v_result := v_settings.prefix || v_settings.separator || v_date_part || v_settings.separator || v_number_part;
    ELSIF v_settings.prefix != '' THEN
        v_result := v_settings.prefix || v_settings.separator || v_number_part;
    ELSIF v_date_part != '' THEN
        v_result := v_date_part || v_settings.separator || v_number_part;
    ELSE
        v_result := v_number_part;
    END IF;
    
    -- Increment the counter for next use
    UPDATE public.numbering_settings 
    SET current_number = current_number + 1,
        updated_at = NOW()
    WHERE company_id = p_company_id AND document_type = p_document_type;
    
    RETURN v_result;
END;
$$;


--
-- Name: generate_trading_and_pl_statement(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_trading_and_pl_statement(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- FIX: Initialize all variables to 0 to prevent nulls.
    v_sales NUMERIC := 0;
    v_cogs NUMERIC := 0;
    v_direct_expenses NUMERIC := 0;
    v_other_income NUMERIC := 0;
    v_employee_benefits NUMERIC := 0;
    v_finance_costs NUMERIC := 0;
    v_depreciation NUMERIC := 0;
    v_other_expenses NUMERIC := 0;
BEGIN
    -- This single, robust query calculates all values.
    SELECT
        COALESCE(SUM(jl.credit - jl.debit) FILTER (WHERE coa.pnl_head = 'revenue_from_operations'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'cost_of_materials'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'direct_expenses'), 0),
        COALESCE(SUM(jl.credit - jl.debit) FILTER (WHERE coa.pnl_head = 'other_income'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'employee_benefits_expense'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'finance_costs'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'depreciation_amortization'), 0),
        COALESCE(SUM(jl.debit - jl.credit) FILTER (WHERE coa.pnl_head = 'other_expenses'), 0)
    INTO
        v_sales,
        v_cogs,
        v_direct_expenses,
        v_other_income,
        v_employee_benefits,
        v_finance_costs,
        v_depreciation,
        v_other_expenses
    FROM
        public.chart_of_accounts coa
    LEFT JOIN
        public.journal_lines jl ON coa.id = jl.account_id
    LEFT JOIN
        public.journal_entries je ON jl.journal_entry_id = je.id
        AND je.entry_date BETWEEN p_start_date AND p_end_date
    WHERE
        coa.company_id = p_company_id
        AND coa.pnl_head IS NOT NULL;

    -- Build the final JSON. All variables are guaranteed to be numeric.
    RETURN jsonb_build_object(
        'tradingAccount', jsonb_build_object(
            'sales', v_sales,
            'costOfGoodsSold', v_cogs,
            'directExpenses', v_direct_expenses
        ),
        'grossProfit', v_sales - v_cogs - v_direct_expenses,
        'profitLossAccount', jsonb_build_object(
            'otherIncome', v_other_income,
            'totalIncome', (v_sales - v_cogs - v_direct_expenses) + v_other_income,
            'indirectExpenses', jsonb_build_object(
                'employeeBenefits', v_employee_benefits,
                'financeCosts', v_finance_costs,
                'depreciationAmortization', v_depreciation,
                'otherExpenses', v_other_expenses
            ),
            'totalIndirectExpenses', v_employee_benefits + v_finance_costs + v_depreciation + v_other_expenses
        ),
        'profitBeforeTax', (v_sales - v_cogs - v_direct_expenses) + v_other_income - (v_employee_benefits + v_finance_costs + v_depreciation + v_other_expenses)
    );
END;
$$;


--
-- Name: generate_trial_balance(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_trial_balance(p_company_id uuid, p_as_of_date date) RETURNS TABLE(account_id uuid, account_code text, account_name text, closing_debit numeric, closing_credit numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH account_balances AS (
        SELECT
            jl.account_id,
            SUM(jl.debit - jl.credit) as balance
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE je.company_id = p_company_id AND je.entry_date <= p_as_of_date
        GROUP BY jl.account_id
    )
    SELECT
        coa.id AS account_id,
        coa.account_code,
        coa.account_name,
        CASE WHEN ab.balance > 0 THEN ab.balance ELSE 0 END AS closing_debit,
        CASE WHEN ab.balance < 0 THEN -ab.balance ELSE 0 END AS closing_credit
    FROM public.chart_of_accounts coa
    JOIN account_balances ab ON coa.id = ab.account_id
    WHERE
        coa.company_id = p_company_id
        AND ab.balance != 0
        -- This is the key improvement:
        -- It only includes accounts that are NOT parents to any other account.
        AND coa.id NOT IN (SELECT parent_account_id FROM public.chart_of_accounts WHERE parent_account_id IS NOT NULL AND company_id = p_company_id)
    ORDER BY
        coa.account_code;
END;
$$;


--
-- Name: get_account_ledger(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_account_ledger(p_account_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(entry_date date, narration text, debit numeric, credit numeric, running_balance numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_opening_balance NUMERIC;
BEGIN
    -- Step 1: Calculate the opening balance by summing all transactions BEFORE the start date.
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0)
    INTO v_opening_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.account_id = p_account_id AND je.entry_date < p_start_date;

    RETURN QUERY
    -- Step 2: Return the opening balance as the first row.
    SELECT
        p_start_date AS entry_date,
        'Opening Balance' AS narration,
        NULL::NUMERIC AS debit,
        NULL::NUMERIC AS credit,
        v_opening_balance AS running_balance
    UNION ALL
    -- Step 3: Return all transactions within the period and calculate the running balance.
    SELECT
        je.entry_date,
        je.narration,
        jl.debit,
        jl.credit,
        v_opening_balance + SUM(jl.debit - jl.credit) OVER (ORDER BY je.entry_date, je.created_at, jl.id) AS running_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.account_id = p_account_id
      AND je.entry_date BETWEEN p_start_date AND p_end_date
    ORDER BY entry_date;
END;
$$;


--
-- Name: get_advisor_executive_summary(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_advisor_executive_summary(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_result JSONB;
    v_detailed_pl JSONB;
    v_detailed_bs JSONB;
BEGIN
    -- Step 1: Generate the canonical detailed reports first.
    -- These are the source of truth for P&L and Balance Sheet figures.
    v_detailed_pl := public.generate_detailed_trading_and_pl_statement(p_company_id, p_start_date, p_end_date);
    v_detailed_bs := public.generate_detailed_balance_sheet_statement(p_company_id, p_end_date);

    -- Step 2: Extract key figures from the reports and calculate other period-specific metrics.
    WITH period_metrics AS (
        SELECT
            -- Profitability for the period (from detailed P&L)
            COALESCE((v_detailed_pl ->> 'profitBeforeTax')::NUMERIC, 0) AS profit_before_tax,
            -- Cash flow for the period (from cash flow statement)
            COALESCE((public.generate_cash_flow_statement(p_company_id, p_start_date, p_end_date) ->> 'netChangeInCash')::NUMERIC, 0) AS net_cash_change,
            -- Total revenue booked in the period
            (SELECT COALESCE(SUM(total_amount), 0) FROM public.sales_invoices si WHERE si.company_id = p_company_id AND si.invoice_date BETWEEN p_start_date AND p_end_date AND si.status IN ('sent', 'paid', 'partially_paid')) AS total_revenue,
            -- Total expenses (bills) booked in the period
            (SELECT COALESCE(SUM(total_amount), 0) FROM public.purchase_bills pb WHERE pb.company_id = p_company_id AND pb.bill_date BETWEEN p_start_date AND p_end_date AND pb.status IN ('submitted', 'paid', 'partially_paid')) AS total_expenses
    ),
    balance_metrics AS (
        SELECT
            -- Total outstanding receivables as of the end date (from detailed Balance Sheet)
            COALESCE((v_detailed_bs -> 'assets' -> 'trade_receivables' ->> 'total')::NUMERIC, 0) AS total_receivables,
            -- Total outstanding payables as of the end date (from detailed Balance Sheet)
            COALESCE((v_detailed_bs -> 'liabilities' -> 'trade_payables' ->> 'total')::NUMERIC, 0) AS total_payables
    )
    SELECT jsonb_build_object(
        'period', jsonb_build_object('start_date', p_start_date, 'end_date', p_end_date),
        'profit_and_loss', to_jsonb(pm),
        'balance_sheet_summary', to_jsonb(bm)
    )
    INTO v_result
    FROM period_metrics pm, balance_metrics bm;

    RETURN v_result;
END;
$$;


--
-- Name: get_advisor_inventory_health(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_advisor_inventory_health(p_company_id uuid, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
-- (Code is identical to the previous response, it is correct as is)
DECLARE
    v_result JSONB;
BEGIN
    WITH stale_stock AS (
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.quantity_on_hand,
            (SELECT MAX(im.movement_date)::DATE FROM public.inventory_movements im WHERE im.product_id = p.id AND im.movement_type = 'SALE' AND im.movement_date <= p_end_date) AS last_sale_date
        FROM public.products p
        WHERE p.company_id = p_company_id AND p.quantity_on_hand > 0 AND p.type = 'GOOD' AND p.deleted_at IS NULL
    ),
    negative_stock AS (
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.quantity_on_hand
        FROM public.products p
        WHERE p.company_id = p_company_id AND p.quantity_on_hand < 0 AND p.type = 'GOOD' AND p.deleted_at IS NULL
    )
    SELECT jsonb_build_object(
        'analysis_date', p_end_date,
        'stale_stock_details', (
            SELECT COALESCE(jsonb_agg(to_jsonb(ss.*) ORDER BY ss.last_sale_date ASC NULLS FIRST, ss.quantity_on_hand DESC), '[]'::jsonb)
            FROM stale_stock ss
            WHERE ss.last_sale_date IS NULL OR ss.last_sale_date < (p_end_date - INTERVAL '90 days')
        ),
        'negative_stock_errors', (
            SELECT COALESCE(jsonb_agg(to_jsonb(ns.*) ORDER BY ns.product_name), '[]'::jsonb)
            FROM negative_stock ns
        )
    )
    INTO v_result;
    RETURN v_result;
END;
$$;


--
-- Name: get_advisor_payables_risk(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_advisor_payables_risk(p_company_id uuid, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
-- (Code is identical to the previous response, it is correct as is)
DECLARE
    v_result JSONB;
BEGIN
    WITH overdue_bills AS (
        SELECT
            pb.id AS bill_id,
            pb.bill_number,
            s.name AS supplier_name,
            s.id AS supplier_id,
            pb.due_date,
            (pb.total_amount - pb.amount_paid) AS amount_due,
            (p_end_date - pb.due_date) AS days_overdue
        FROM public.purchase_bills pb
        JOIN public.suppliers s ON pb.supplier_id = s.id
        WHERE pb.company_id = p_company_id AND pb.status IN ('submitted', 'partially_paid') AND pb.due_date < p_end_date AND (pb.total_amount - pb.amount_paid) > 0.01
    ),
    upcoming_bills AS (
        SELECT
            pb.id AS bill_id,
            pb.bill_number,
            s.name AS supplier_name,
            s.id AS supplier_id,
            pb.due_date,
            (pb.total_amount - pb.amount_paid) AS amount_due
        FROM public.purchase_bills pb
        JOIN public.suppliers s ON pb.supplier_id = s.id
        WHERE pb.company_id = p_company_id AND pb.status IN ('submitted', 'partially_paid') AND pb.due_date > p_end_date AND pb.due_date <= (p_end_date + INTERVAL '15 days') AND (pb.total_amount - pb.amount_paid) > 0.01
    )
    SELECT jsonb_build_object(
        'analysis_date', p_end_date,
        'overdue_payments', jsonb_build_object(
            'count', (SELECT COUNT(*) FROM overdue_bills),
            'total_amount', (SELECT COALESCE(SUM(amount_due), 0) FROM overdue_bills),
            'details', COALESCE((SELECT jsonb_agg(to_jsonb(ob.*) ORDER BY ob.days_overdue DESC) FROM overdue_bills ob), '[]'::jsonb)
        ),
        'upcoming_payments_next_15_days', jsonb_build_object(
            'count', (SELECT COUNT(*) FROM upcoming_bills),
            'total_amount', (SELECT COALESCE(SUM(amount_due), 0) FROM upcoming_bills),
            'details', COALESCE((SELECT jsonb_agg(to_jsonb(ub.*) ORDER BY ub.due_date ASC) FROM upcoming_bills ub), '[]'::jsonb)
        )
    )
    INTO v_result;
    RETURN v_result;
END;
$$;


--
-- Name: get_advisor_receivables_health(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_advisor_receivables_health(p_company_id uuid, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
-- (Code is identical to the previous response, it is correct as is)
DECLARE
    v_result JSONB;
BEGIN
    WITH overdue_invoices AS (
        SELECT
            si.id AS invoice_id,
            si.invoice_number,
            c.name AS customer_name,
            c.id AS customer_id,
            si.due_date,
            (si.total_amount - si.amount_paid) AS amount_due,
            (p_end_date - si.due_date) AS days_overdue
        FROM public.sales_invoices si
        JOIN public.customers c ON si.customer_id = c.id
        WHERE si.company_id = p_company_id
          AND si.status IN ('sent', 'partially_paid')
          AND si.due_date < (p_end_date - INTERVAL '25 days')
          AND (si.total_amount - si.amount_paid) > 0.01
    )
    SELECT jsonb_build_object(
        'analysis_date', p_end_date,
        'long_overdue_count', (SELECT COUNT(*) FROM overdue_invoices),
        'long_overdue_total_amount', (SELECT COALESCE(SUM(amount_due), 0) FROM overdue_invoices),
        'details', COALESCE((SELECT jsonb_agg(to_jsonb(oi.*) ORDER BY oi.days_overdue DESC) FROM overdue_invoices oi), '[]'::jsonb)
    )
    INTO v_result;

    RETURN v_result;
END;
$$;


--
-- Name: get_advisor_sales_target_analysis(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_advisor_sales_target_analysis(p_company_id uuid, p_start_date date, p_end_date date) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            public.get_sales_target_performance(st.id)
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.sales_targets st
    WHERE st.company_id = p_company_id
      AND st.status = 'ACTIVE'
      AND st.start_date <= p_end_date 
      AND st.end_date >= p_start_date;

    RETURN jsonb_build_object(
        'period', jsonb_build_object('start_date', p_start_date, 'end_date', p_end_date),
        'targets', v_result
    );
END;
$$;


--
-- Name: get_cash_bank_balance(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_cash_bank_balance(p_cash_bank_account_id uuid, p_as_of_date date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_balance NUMERIC;
    v_ledger_account_id UUID;
BEGIN
    -- Step 1: Find the actual ledger account ID linked to this bank account.
    SELECT chart_of_account_id INTO v_ledger_account_id
    FROM public.cash_bank_accounts
    WHERE id = p_cash_bank_account_id;

    -- Step 2: Calculate the balance from the journal_lines table using the correct ledger account ID
    -- AND filtering by the specific cash bank account ID to ensure we get the correct balance
    -- for this specific bank account, not just the ledger account.
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0)
    INTO v_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.account_id = v_ledger_account_id
      AND jl.cash_bank_account_id = p_cash_bank_account_id
      AND je.entry_date <= p_as_of_date;

    RETURN v_balance;
END;
$$;


--
-- Name: get_company_purchase_bills_paginated(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_company_purchase_bills_paginated(p_company_id uuid, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0) RETURNS TABLE(bill_id uuid, company_id uuid, supplier_id uuid, bill_number text, bill_date date, due_date date, subtotal numeric, total_tax numeric, total_amount numeric, amount_paid numeric, status text, supplier_name text, place_of_supply text, line_id uuid, product_id uuid, product_name text, description text, quantity numeric, unit_price numeric, line_total numeric, hsn_sac_code text, tax_id uuid, tax_rate_id uuid, tax_name text, tax_rate numeric, tax_amount numeric, payment_id uuid, payment_date date, payment_amount numeric, payment_method text, reference_number text, payment_notes text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH paginated_bills AS (
        SELECT pb.id
        FROM public.purchase_bills pb
        WHERE pb.company_id = p_company_id
        ORDER BY pb.bill_date DESC, pb.bill_number
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        -- Bill fields
        pb.id as bill_id,
        pb.company_id,
        pb.supplier_id,
        pb.bill_number,
        pb.bill_date,
        pb.due_date,
        pb.subtotal,
        pb.total_tax,
        pb.total_amount,
        pb.amount_paid,
        pb.status::TEXT,
        s.name as supplier_name,
        pb.place_of_supply,
        
        -- Line item fields
        pbl.id as line_id,
        pbl.product_id,
        p.name as product_name,
        pbl.description,
        pbl.quantity,
        pbl.unit_price,
        pbl.line_total,
        pbl.hsn_sac_code,
        
        -- Tax fields
        pblt.id as tax_id,
        pblt.tax_rate_id,
        tr.name as tax_name,
        tr.rate as tax_rate,
        pblt.tax_amount,
        
        -- Payment fields
        bp.id as payment_id,
        bp.payment_date,
        bp.amount as payment_amount,
        bp.method::TEXT as payment_method,
        bp.reference_number,
        bp.notes as payment_notes
        
    FROM paginated_bills pbi
    JOIN public.purchase_bills pb ON pbi.id = pb.id
    LEFT JOIN public.suppliers s ON pb.supplier_id = s.id
    LEFT JOIN public.purchase_bill_lines pbl ON pb.id = pbl.bill_id
    LEFT JOIN public.products p ON pbl.product_id = p.id
    LEFT JOIN public.purchase_bill_line_taxes pblt ON pbl.id = pblt.bill_line_id
    LEFT JOIN public.tax_rates tr ON pblt.tax_rate_id = tr.id
    LEFT JOIN public.bill_payments bp ON pb.id = bp.bill_id
    ORDER BY pb.bill_date DESC, pb.bill_number, pbl.id, pblt.id, bp.payment_date;
END;
$$;


--
-- Name: get_company_sales_invoices_with_taxes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_company_sales_invoices_with_taxes(p_company_id uuid) RETURNS TABLE(invoice_id uuid, company_id uuid, customer_id uuid, invoice_number text, invoice_date date, due_date date, subtotal numeric, total_tax numeric, total_amount numeric, amount_paid numeric, status text, customer_name text, line_id uuid, product_id uuid, product_name text, description text, quantity numeric, unit_price numeric, line_total numeric, tax_id uuid, tax_rate_id uuid, tax_name text, tax_rate numeric, tax_amount numeric, payment_id uuid, payment_date date, payment_amount numeric, payment_method text, reference_number text, payment_notes text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Invoice fields
        si.id as invoice_id,
        si.company_id,
        si.customer_id,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.subtotal,
        si.total_tax,
        si.total_amount,
        si.amount_paid,
        si.status::TEXT,
        c.name as customer_name,
        
        -- Line item fields
        sil.id as line_id,
        sil.product_id,
        p.name as product_name,
        sil.description,
        sil.quantity,
        sil.unit_price,
        sil.line_total,
        
        -- Tax fields
        silt.id as tax_id,
        silt.tax_rate_id,
        tr.name as tax_name,
        tr.rate as tax_rate,
        silt.tax_amount,
        
        -- Payment fields
        ip.id as payment_id,
        ip.payment_date,
        ip.amount as payment_amount,
        ip.method::TEXT as payment_method,
        ip.reference_number,
        ip.notes as payment_notes
        
    FROM public.sales_invoices si
    LEFT JOIN public.customers c ON si.customer_id = c.id
    LEFT JOIN public.sales_invoice_lines sil ON si.id = sil.invoice_id
    LEFT JOIN public.products p ON sil.product_id = p.id
    LEFT JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
    LEFT JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
    LEFT JOIN public.invoice_payments ip ON si.id = ip.invoice_id
    WHERE si.company_id = p_company_id
    ORDER BY si.invoice_date DESC, si.invoice_number, sil.id, silt.id, ip.payment_date;
END;
$$;


--
-- Name: get_company_sales_invoices_with_taxes_paginated(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_company_sales_invoices_with_taxes_paginated(p_company_id uuid, p_limit integer DEFAULT 25, p_offset integer DEFAULT 0) RETURNS TABLE(invoice_id uuid, company_id uuid, customer_id uuid, invoice_number text, invoice_date date, due_date date, subtotal numeric, total_tax numeric, total_amount numeric, amount_paid numeric, status text, customer_name text, line_id uuid, product_id uuid, product_name text, description text, quantity numeric, unit_price numeric, line_total numeric, tax_id uuid, tax_rate_id uuid, tax_name text, tax_rate numeric, tax_amount numeric, payment_id uuid, payment_date date, payment_amount numeric, payment_method text, reference_number text, payment_notes text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH paginated_invoices AS (
        SELECT si.id
        FROM public.sales_invoices si
        WHERE si.company_id = p_company_id
        ORDER BY si.invoice_date DESC, si.invoice_number
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        -- Invoice fields
        si.id as invoice_id,
        si.company_id,
        si.customer_id,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.subtotal,
        si.total_tax,
        si.total_amount,
        si.amount_paid,
        si.status::TEXT,
        c.name as customer_name,
        
        -- Line item fields
        sil.id as line_id,
        sil.product_id,
        p.name as product_name,
        sil.description,
        sil.quantity,
        sil.unit_price,
        sil.line_total,
        
        -- Tax fields
        silt.id as tax_id,
        silt.tax_rate_id,
        tr.name as tax_name,
        tr.rate as tax_rate,
        silt.tax_amount,
        
        -- Payment fields
        ip.id as payment_id,
        ip.payment_date,
        ip.amount as payment_amount,
        ip.method::TEXT as payment_method,
        ip.reference_number,
        ip.notes as payment_notes
        
    FROM paginated_invoices pi
    JOIN public.sales_invoices si ON pi.id = si.id
    LEFT JOIN public.customers c ON si.customer_id = c.id
    LEFT JOIN public.sales_invoice_lines sil ON si.id = sil.invoice_id
    LEFT JOIN public.products p ON sil.product_id = p.id
    LEFT JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
    LEFT JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
    LEFT JOIN public.invoice_payments ip ON si.id = ip.invoice_id
    ORDER BY si.invoice_date DESC, si.invoice_number, sil.id, silt.id, ip.payment_date;
END;
$$;


--
-- Name: get_current_claim(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_claim(claim text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>claim, 'anonymous');
$$;


--
-- Name: get_customer_statement(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_customer_statement(p_customer_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(transaction_date date, narration text, debit numeric, credit numeric, running_balance numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_opening_balance NUMERIC;
    v_company_id UUID;
BEGIN
    -- Determine the company from the customer record to ensure all queries are scoped correctly.
    SELECT company_id INTO v_company_id FROM public.customers WHERE id = p_customer_id;

    -- Step 1: Calculate the opening balance.
    -- For a customer (an Asset/Receivable), the balance is Debit - Credit.
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0)
    INTO v_opening_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.customer_id = p_customer_id
      AND je.company_id = v_company_id
      AND je.entry_date < p_start_date;

    -- Step 2: Combine the opening balance with the transactions within the date range.
    RETURN QUERY
    WITH transactions AS (
        -- First, the opening balance row
        SELECT
            p_start_date AS sort_date,
            0 as sort_order,
            'Opening Balance' AS narration,
            NULL::NUMERIC AS debit,
            NULL::NUMERIC AS credit,
            v_opening_balance AS balance_change
        UNION ALL
        -- Then, all the transactions within the specified period
        SELECT
            je.entry_date AS sort_date,
            1 as sort_order,
            je.narration,
            jl.debit,
            jl.credit,
            (jl.debit - jl.credit) AS balance_change
        FROM
            public.journal_lines jl
        JOIN
            public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE
            jl.customer_id = p_customer_id
            AND je.company_id = v_company_id
            AND je.entry_date BETWEEN p_start_date AND p_end_date
    )
    -- Final SELECT to calculate the running balance
    SELECT
        t.sort_date AS transaction_date,
        t.narration,
        t.debit,
        t.credit,
        -- The running balance is the opening balance plus the sum of all subsequent changes
        v_opening_balance + COALESCE(SUM(t.balance_change) FILTER (WHERE t.sort_order > 0) OVER (ORDER BY t.sort_date, t.narration), 0) AS running_balance
    FROM
        transactions t
    ORDER BY
        t.sort_date, t.sort_order, t.narration;

END;
$$;


--
-- Name: get_dashboard_overview(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_overview(p_company_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_result JSON;
    v_period_start DATE := date_trunc('month', current_date);
    v_period_end DATE := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;
    v_ar_acct_id UUID := public.get_system_account_id(p_company_id, 'AccountsReceivable');
    v_ap_acct_id UUID := public.get_system_account_id(p_company_id, 'AccountsPayable');
BEGIN
    WITH metrics AS (
        SELECT
            -- Sales and Expense for the current month (performance metric)
            (SELECT COALESCE(SUM(total_amount), 0) FROM public.sales_invoices WHERE company_id = p_company_id AND invoice_date BETWEEN v_period_start AND v_period_end AND status IN ('sent', 'paid', 'partially_paid')) AS total_revenue,
            (SELECT COALESCE(SUM(total_amount), 0) FROM public.purchase_bills WHERE company_id = p_company_id AND bill_date BETWEEN v_period_start AND v_period_end AND status IN ('submitted', 'paid', 'partially_paid')) AS total_expenses,

            -- Total Receivables and Payables (balance sheet metric, true as of today)
            (SELECT COALESCE(SUM(debit-credit), 0) FROM public.journal_lines WHERE account_id = v_ar_acct_id) AS total_receivables,
            (SELECT COALESCE(SUM(credit-debit), 0) FROM public.journal_lines WHERE account_id = v_ap_acct_id) AS total_payables, -- Note: Payables are a credit balance

            -- Total Bank and Cash Balances (balance sheet metric, true as of today)
            (SELECT COALESCE(SUM(public.get_cash_bank_balance(id, current_date)), 0) FROM public.cash_bank_accounts WHERE company_id = p_company_id AND account_type = 'Bank') AS total_bank_balance,
            (SELECT COALESCE(SUM(public.get_cash_bank_balance(id, current_date)), 0) FROM public.cash_bank_accounts WHERE company_id = p_company_id AND account_type = 'Cash') AS total_cash_balance
    )
    SELECT row_to_json(metrics)
    INTO v_result
    FROM metrics;

    RETURN v_result;
END;
$$;


--
-- Name: get_jwt_claim(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_jwt_claim(claim text) RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT auth.jwt()->'app_metadata'->>claim;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: numbering_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.numbering_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    document_type public.document_type NOT NULL,
    prefix text DEFAULT ''::text NOT NULL,
    separator text DEFAULT '/'::text NOT NULL,
    digit_count integer DEFAULT 5 NOT NULL,
    current_number integer DEFAULT 1 NOT NULL,
    include_date boolean DEFAULT true NOT NULL,
    date_format text DEFAULT 'YYYYMMDD'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT numbering_settings_current_number_check CHECK ((current_number > 0)),
    CONSTRAINT numbering_settings_date_format_check CHECK ((date_format = ANY (ARRAY['YYYY'::text, 'YYYYMM'::text, 'YYYYMMDD'::text]))),
    CONSTRAINT numbering_settings_digit_count_check CHECK (((digit_count > 0) AND (digit_count <= 10)))
);


--
-- Name: get_or_create_numbering_settings(uuid, public.document_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_or_create_numbering_settings(p_company_id uuid, p_document_type public.document_type) RETURNS public.numbering_settings
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_settings public.numbering_settings;
    v_default_prefix TEXT;
BEGIN
    -- Try to get existing settings
    SELECT * INTO v_settings 
    FROM public.numbering_settings 
    WHERE company_id = p_company_id AND document_type = p_document_type;
    
    -- If not found, create default settings
    IF NOT FOUND THEN
        -- Set default prefix based on document type
        CASE p_document_type
            WHEN 'SALES_INVOICE' THEN v_default_prefix := 'INV';
            WHEN 'PURCHASE_BILL' THEN v_default_prefix := 'BILL';
            WHEN 'SALES_CREDIT_NOTE' THEN v_default_prefix := 'CN';
            WHEN 'PURCHASE_DEBIT_NOTE' THEN v_default_prefix := 'DN';
            ELSE v_default_prefix := 'DOC';
        END CASE;
        
        -- Insert default settings
        INSERT INTO public.numbering_settings (
            company_id, 
            document_type, 
            prefix, 
            separator, 
            digit_count, 
            current_number, 
            include_date, 
            date_format
        ) VALUES (
            p_company_id,
            p_document_type,
            v_default_prefix,
            '/',
            5,
            1,
            true,
            'YYYYMMDD'
        ) RETURNING * INTO v_settings;
    END IF;
    
    RETURN v_settings;
END;
$$;


--
-- Name: get_sales_invoice_tax_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_invoice_tax_summary(p_invoice_id uuid) RETURNS TABLE(tax_name text, tax_rate numeric, total_tax_amount numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.name as tax_name,
        tr.rate as tax_rate,
        SUM(silt.tax_amount) as total_tax_amount
    FROM public.sales_invoice_line_taxes silt
    JOIN public.sales_invoice_lines sil ON silt.invoice_line_id = sil.id
    JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
    WHERE sil.invoice_id = p_invoice_id
    GROUP BY tr.name, tr.rate
    ORDER BY tr.name;
END;
$$;


--
-- Name: get_sales_invoice_with_taxes(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_invoice_with_taxes(p_invoice_id uuid) RETURNS TABLE(invoice_id uuid, company_id uuid, customer_id uuid, invoice_number text, invoice_date date, due_date date, subtotal numeric, total_tax numeric, total_amount numeric, amount_paid numeric, status text, customer_name text, line_id uuid, product_id uuid, product_name text, description text, quantity numeric, unit_price numeric, line_total numeric, tax_id uuid, tax_rate_id uuid, tax_name text, tax_rate numeric, tax_amount numeric, payment_id uuid, payment_date date, payment_amount numeric, payment_method text, reference_number text, payment_notes text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Invoice fields
        si.id as invoice_id,
        si.company_id,
        si.customer_id,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.subtotal,
        si.total_tax,
        si.total_amount,
        si.amount_paid,
        si.status::TEXT,
        c.name as customer_name,
        
        -- Line item fields
        sil.id as line_id,
        sil.product_id,
        p.name as product_name,
        sil.description,
        sil.quantity,
        sil.unit_price,
        sil.line_total,
        
        -- Tax fields
        silt.id as tax_id,
        silt.tax_rate_id,
        tr.name as tax_name,
        tr.rate as tax_rate,
        silt.tax_amount,
        
        -- Payment fields
        ip.id as payment_id,
        ip.payment_date,
        ip.amount as payment_amount,
        ip.method::TEXT as payment_method,
        ip.reference_number,
        ip.notes as payment_notes
        
    FROM public.sales_invoices si
    LEFT JOIN public.customers c ON si.customer_id = c.id
    LEFT JOIN public.sales_invoice_lines sil ON si.id = sil.invoice_id
    LEFT JOIN public.products p ON sil.product_id = p.id
    LEFT JOIN public.sales_invoice_line_taxes silt ON sil.id = silt.invoice_line_id
    LEFT JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
    LEFT JOIN public.invoice_payments ip ON si.id = ip.invoice_id
    WHERE si.id = p_invoice_id
    ORDER BY sil.id, silt.id, ip.payment_date;
END;
$$;


--
-- Name: get_sales_target_performance(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_target_performance(p_target_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_target RECORD;
    v_actual_primary_value NUMERIC := 0;
    v_achievement_percentage NUMERIC := 0;
    v_status TEXT;

    -- System Account ID
    v_ar_acct_id UUID;

    -- Performance Metrics
    v_gross_revenue NUMERIC := 0;
    v_revenue_returns NUMERIC := 0;
    v_accrual_revenue NUMERIC := 0;
    
    v_cash_in_from_payments NUMERIC := 0;
    v_cash_out_as_refunds NUMERIC := 0;
    v_net_cash_collected NUMERIC := 0;

    v_quantity_sold NUMERIC := 0;
    v_quantity_returned NUMERIC := 0;
    v_net_quantity_sold NUMERIC := 0;

BEGIN
    -- Step 1: Fetch target details and the Accounts Receivable system account ID
    SELECT * INTO v_target FROM public.sales_targets WHERE id = p_target_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Target not found');
    END IF;

    v_ar_acct_id := public.get_system_account_id(v_target.company_id, 'AccountsReceivable');
    IF v_ar_acct_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Critical system account AccountsReceivable is not configured.');
    END IF;

    -- =================================================================
    -- Part 1: ACCRUAL REVENUE CALCULATION (FIXED: Using General Ledger)
    -- This now calculates the total value by summing debits and credits to Accounts Receivable.
    -- =================================================================
    IF v_target.product_id IS NOT NULL THEN
        -- Product-specific logic requires joining back to the source document lines.
        -- Gross Value (Debits to AR from sales of this product)
        SELECT COALESCE(SUM(jl.debit), 0) INTO v_gross_revenue
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        -- We must join to the invoice lines to ensure this journal entry belongs to the specific product
        WHERE je.source_document_id IN (
              SELECT DISTINCT invoice_id FROM public.sales_invoice_lines WHERE product_id = v_target.product_id
          )
          AND je.company_id = v_target.company_id
          AND jl.account_id = v_ar_acct_id
          AND je.source_document_type = 'sales_invoice_revenue'
          AND je.entry_date BETWEEN v_target.start_date AND v_target.end_date;

        -- Value of Returns (Credits to AR from returns of this product)
        SELECT COALESCE(SUM(jl.credit), 0) INTO v_revenue_returns
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE je.source_document_id IN (
              SELECT DISTINCT credit_note_id FROM public.sales_credit_note_lines WHERE product_id = v_target.product_id
          )
          AND je.company_id = v_target.company_id
          AND jl.account_id = v_ar_acct_id
          AND je.source_document_type = 'sales_credit_note'
          AND je.entry_date BETWEEN v_target.start_date AND v_target.end_date;
    ELSE
        -- Company-wide logic is a direct query on the ledger.
        -- Gross Value
        SELECT COALESCE(SUM(jl.debit), 0) INTO v_gross_revenue
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE je.company_id = v_target.company_id
          AND jl.account_id = v_ar_acct_id
          AND je.source_document_type = 'sales_invoice_revenue'
          AND je.entry_date BETWEEN v_target.start_date AND v_target.end_date;
        
        -- Value of Returns
        SELECT COALESCE(SUM(jl.credit), 0) INTO v_revenue_returns
        FROM public.journal_lines jl
        JOIN public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE je.company_id = v_target.company_id
          AND jl.account_id = v_ar_acct_id
          AND je.source_document_type = 'sales_credit_note'
          AND je.entry_date BETWEEN v_target.start_date AND v_target.end_date;
    END IF;
    v_accrual_revenue := v_gross_revenue - v_revenue_returns;

    -- =================================================================
    -- Part 2: NET CASH COLLECTED (UNCHANGED: This logic is correct and ledger-based)
    -- =================================================================
    SELECT COALESCE(SUM(ip.amount), 0) INTO v_cash_in_from_payments
    FROM public.invoice_payments ip
    JOIN public.sales_invoices si ON ip.invoice_id = si.id
    WHERE si.company_id = v_target.company_id
      AND ip.payment_date BETWEEN v_target.start_date AND v_target.end_date;

    SELECT COALESCE(SUM(jl.credit), 0) INTO v_cash_out_as_refunds
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE je.company_id = v_target.company_id
      AND je.source_document_type = 'customer_payment'
      AND jl.account_id IN (SELECT chart_of_account_id FROM public.cash_bank_accounts WHERE company_id = v_target.company_id)
      AND je.entry_date BETWEEN v_target.start_date AND v_target.end_date;

    v_net_cash_collected := v_cash_in_from_payments - v_cash_out_as_refunds;

    -- =================================================================
    -- Part 3: NET QUANTITY SOLD (UNCHANGED: Uses inventory_movements as the source of truth)
    -- =================================================================
    IF v_target.product_id IS NOT NULL THEN
        SELECT COALESCE(SUM(ABS(quantity_change)), 0) INTO v_quantity_sold
        FROM public.inventory_movements
        WHERE product_id = v_target.product_id
          AND company_id = v_target.company_id
          AND movement_type = 'SALE'
          AND movement_date BETWEEN v_target.start_date AND v_target.end_date;

        SELECT COALESCE(SUM(quantity_change), 0) INTO v_quantity_returned
        FROM public.inventory_movements
        WHERE product_id = v_target.product_id
          AND company_id = v_target.company_id
          AND movement_type = 'SALES_RETURN'
          AND movement_date BETWEEN v_target.start_date AND v_target.end_date;
          
        v_net_quantity_sold := v_quantity_sold - v_quantity_returned;
    END IF;

    -- =================================================================
    -- Part 4: Final Evaluation
    -- =================================================================
    CASE v_target.metric
        WHEN 'REVENUE' THEN v_actual_primary_value := v_accrual_revenue;
        WHEN 'QUANTITY_SOLD' THEN
            IF v_target.product_id IS NULL THEN RETURN jsonb_build_object('error', 'QUANTITY_SOLD metric requires a product to be selected.'); END IF;
            v_actual_primary_value := v_net_quantity_sold;
        WHEN 'CASH_COLLECTED' THEN v_actual_primary_value := v_net_cash_collected;
    END CASE;
    
    IF v_target.target_value <> 0 THEN v_achievement_percentage := (v_actual_primary_value / v_target.target_value) * 100;
    ELSE v_achievement_percentage := 0; END IF;

    IF v_achievement_percentage >= 100 THEN v_status := 'Achieved';
    ELSIF v_target.end_date < CURRENT_DATE THEN v_status := 'Missed';
    ELSE v_status := 'On Track'; END IF;

    -- =================================================================
    -- Part 5: Construct Final JSON Output (Format is UNCHANGED)
    -- =================================================================
    RETURN jsonb_build_object(
        'targetId', v_target.id,
        'targetName', v_target.name,
        'primaryMetric', v_target.metric,
        'targetValue', v_target.target_value,
        'primaryActualValue', v_actual_primary_value,
        'achievementPercentage', round(v_achievement_percentage, 2),
        'status', v_status,
        'period', jsonb_build_object('start', v_target.start_date, 'end', v_target.end_date),
        'performance_summary', jsonb_build_object(
            'accrualRevenue', jsonb_build_object(
                'gross', v_gross_revenue, 
                'returns', v_revenue_returns, 
                'net', v_accrual_revenue
            ),
            'netCashCollected', jsonb_build_object(
                'cashIn', v_cash_in_from_payments, 
                'cashOutRefunds', v_cash_out_as_refunds, 
                'net', v_net_cash_collected
            ),
            'netQuantitySold', jsonb_build_object(
                'isApplicable', (v_target.product_id IS NOT NULL), 
                'sold', v_quantity_sold, 
                'returned', v_quantity_returned, 
                'net', v_net_quantity_sold
            )
        )
    );
END;
$$;


--
-- Name: get_stock_balance_by_date(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_stock_balance_by_date(p_product_id uuid, p_balance_date date) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT COALESCE(SUM(quantity_change), 0)
    INTO v_balance
    FROM public.inventory_movements
    WHERE product_id = p_product_id
      AND movement_date::date <= p_balance_date;
    RETURN v_balance;
END;
$$;


--
-- Name: get_stock_ledger(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_stock_ledger(p_product_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(transaction_date timestamp with time zone, narration text, quantity_in numeric, quantity_out numeric, running_balance numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_opening_balance NUMERIC;
BEGIN
    v_opening_balance := public.get_stock_balance_by_date(p_product_id, p_start_date - INTERVAL '1 day');
    RETURN QUERY SELECT p_start_date::timestamp with time zone, 'Opening Balance', NULL::NUMERIC, NULL::NUMERIC, v_opening_balance
    UNION ALL
    SELECT im.movement_date, im.reason, CASE WHEN im.quantity_change > 0 THEN im.quantity_change ELSE 0 END, CASE WHEN im.quantity_change < 0 THEN -im.quantity_change ELSE 0 END, v_opening_balance + SUM(im.quantity_change) OVER (ORDER BY im.movement_date, im.id)
    FROM public.inventory_movements im
    WHERE im.product_id = p_product_id AND im.movement_date::date BETWEEN p_start_date AND p_end_date
    ORDER BY transaction_date;
END;
$$;


--
-- Name: get_supplier_statement(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_supplier_statement(p_supplier_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(transaction_date date, narration text, debit numeric, credit numeric, running_balance numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_opening_balance NUMERIC;
    v_company_id UUID;
BEGIN
    -- Determine the company from the supplier record.
    SELECT company_id INTO v_company_id FROM public.suppliers WHERE id = p_supplier_id;

    -- Step 1: Calculate the opening balance.
    -- For a supplier (a Liability/Payable), the balance is Credit - Debit.
    SELECT COALESCE(SUM(jl.credit - jl.debit), 0)
    INTO v_opening_balance
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.supplier_id = p_supplier_id
      AND je.company_id = v_company_id
      AND je.entry_date < p_start_date;

    -- Step 2: Combine the opening balance with transactions.
    RETURN QUERY
    WITH transactions AS (
        -- The opening balance row
        SELECT
            p_start_date AS sort_date,
            0 as sort_order,
            'Opening Balance' AS narration,
            NULL::NUMERIC AS debit,
            NULL::NUMERIC AS credit,
            v_opening_balance AS balance_change
        UNION ALL
        -- All transactions within the period
        SELECT
            je.entry_date AS sort_date,
            1 as sort_order,
            je.narration,
            jl.debit,
            jl.credit,
            (jl.credit - jl.debit) AS balance_change
        FROM
            public.journal_lines jl
        JOIN
            public.journal_entries je ON jl.journal_entry_id = je.id
        WHERE
            jl.supplier_id = p_supplier_id
            AND je.company_id = v_company_id
            AND je.entry_date BETWEEN p_start_date AND p_end_date
    )
    -- Final SELECT to calculate the running balance
    SELECT
        t.sort_date AS transaction_date,
        t.narration,
        t.debit,
        t.credit,
        v_opening_balance + COALESCE(SUM(t.balance_change) FILTER (WHERE t.sort_order > 0) OVER (ORDER BY t.sort_date, t.narration), 0) AS running_balance
    FROM
        transactions t
    ORDER BY
        t.sort_date, t.sort_order, t.narration;

END;
$$;


--
-- Name: get_system_account_id(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_system_account_id(p_company_id uuid, p_system_account_type text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_account_id UUID;
BEGIN
    SELECT id INTO v_account_id
    FROM public.chart_of_accounts
    WHERE company_id = p_company_id
      AND system_account_type = p_system_account_type
    LIMIT 1;
    
    RETURN v_account_id;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'user' -- New signups default to 'user' role, unassigned to a company.
  );
  RETURN new;
END;
$$;


--
-- Name: handle_true_journal_voucher_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_true_journal_voucher_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only act if deleting a posted voucher that has a journal entry
    IF OLD.status = 'posted' THEN
        -- Delete the related journal entry, which will cascade to its lines
        DELETE FROM public.journal_entries WHERE source_document_id = OLD.id AND source_document_type = 'journal_voucher';
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: handle_true_purchase_bill_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_true_purchase_bill_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Step 1: Delete journal entries for any payments made for this bill.
    -- The `bill_payments` records themselves will be deleted by the `ON DELETE CASCADE` constraint later.
    -- This preemptively cleans up their financial trail.
    DELETE FROM public.journal_entries
    WHERE source_document_id IN (
        SELECT id FROM public.bill_payments WHERE bill_id = OLD.id
    );

    -- Step 2: Delete the bill's own journal entry.
    DELETE FROM public.journal_entries
    WHERE source_document_id = OLD.id AND source_document_type = 'purchase_bill';

    -- Step 3: Delete related inventory movements to correct stock levels.
    DELETE FROM public.inventory_movements
    WHERE source_document_id = OLD.id AND movement_type = 'PURCHASE';

    -- Allow the original DELETE on the `purchase_bills` table to proceed.
    RETURN OLD;
END;
$$;


--
-- Name: handle_true_purchase_debit_note_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_true_purchase_debit_note_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete all related journal entries (for the note AND its payments)
    -- This automatically cascades to journal_lines
    DELETE FROM public.journal_entries WHERE source_document_id = OLD.id;

    -- Delete any related inventory movements (the purchase return)
    DELETE FROM public.inventory_movements WHERE source_document_id = OLD.id;

    RETURN OLD;
END;
$$;


--
-- Name: handle_true_sales_credit_note_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_true_sales_credit_note_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Delete all related journal entries (for the note AND its refunds)
    -- This automatically cascades to journal_lines
    DELETE FROM public.journal_entries WHERE source_document_id = OLD.id;

    -- Delete any related inventory movements (the sales return)
    DELETE FROM public.inventory_movements WHERE source_document_id = OLD.id;

    RETURN OLD;
END;
$$;


--
-- Name: handle_true_sales_invoice_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_true_sales_invoice_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Step 1: Delete journal entries for any payments made against this invoice.
    -- The `invoice_payments` records themselves will be deleted by the `ON DELETE CASCADE` constraint later.
    -- This step preemptively cleans up their financial trail, preventing the payment-level
    -- delete trigger from creating an incorrect reversal.
    DELETE FROM public.journal_entries
    WHERE source_document_id IN (
        SELECT id FROM public.invoice_payments WHERE invoice_id = OLD.id
    );

    -- Step 2: Delete the invoice's own journal entries (for revenue and COGS).
    -- The `LIKE 'sales_invoice%'` clause is used to catch both the revenue entry
    -- (`sales_invoice_revenue`) and the Cost of Goods Sold entry (`sales_invoice_cogs`).
    DELETE FROM public.journal_entries
    WHERE source_document_id = OLD.id
      AND source_document_type LIKE 'sales_invoice%';

    -- Step 3: Delete related inventory movements to correct stock levels.
    DELETE FROM public.inventory_movements
    WHERE source_document_id = OLD.id AND movement_type = 'SALE';

    -- Allow the original DELETE on the `sales_invoices` table to proceed.
    RETURN OLD;
END;
$$;


--
-- Name: inherit_parent_reporting_heads(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.inherit_parent_reporting_heads() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_parent_pnl_head TEXT;
    v_parent_bs_head TEXT;
BEGIN
    -- This trigger only acts if a parent_account_id is provided.
    IF NEW.parent_account_id IS NOT NULL THEN
        -- Find the reporting heads of the parent account.
        SELECT pnl_head, bs_head
        INTO v_parent_pnl_head, v_parent_bs_head
        FROM public.chart_of_accounts
        WHERE id = NEW.parent_account_id;

        -- **THE FIX**: Check for both NULL and empty strings.
        -- This ensures inheritance works even if the application sends '' instead of NULL.
        IF NEW.pnl_head IS NULL OR NEW.pnl_head = '' THEN
            NEW.pnl_head := v_parent_pnl_head;
        END IF;

        -- **THE FIX**: Same check for the Balance Sheet head.
        IF NEW.bs_head IS NULL OR NEW.bs_head = '' THEN
            NEW.bs_head := v_parent_bs_head;
        END IF;
    END IF;

    -- Return the modified row to be inserted/updated.
    RETURN NEW;
END;
$$;


--
-- Name: log_inventory_movement(uuid, uuid, uuid, public.inventory_movement_type, numeric, numeric, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_inventory_movement(p_company_id uuid, p_product_id uuid, p_warehouse_id uuid, p_movement_type public.inventory_movement_type, p_quantity_change numeric, p_unit_cost numeric, p_source_document_id uuid, p_reason text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_quantity_change = 0 THEN RETURN; END IF;
    
    INSERT INTO public.inventory_movements (
        company_id, -- This is the key field that satisfies RLS
        product_id, 
        warehouse_id, 
        movement_type, 
        quantity_change, 
        unit_cost, 
        source_document_id, 
        reason, 
        movement_date
    )
    VALUES (
        p_company_id, 
        p_product_id, 
        p_warehouse_id, 
        p_movement_type, 
        p_quantity_change, 
        p_unit_cost, 
        p_source_document_id, 
        p_reason, 
        NOW()
    );
END;
$$;


--
-- Name: preview_next_document_number(uuid, public.document_type, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.preview_next_document_number(p_company_id uuid, p_document_type public.document_type, p_date date DEFAULT CURRENT_DATE) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_settings public.numbering_settings;
    v_date_part TEXT := '';
    v_number_part TEXT;
    v_result TEXT;
BEGIN
    -- Get or create settings
    SELECT * INTO v_settings FROM public.get_or_create_numbering_settings(p_company_id, p_document_type);
    
    -- Generate date part if enabled
    IF v_settings.include_date THEN
        CASE v_settings.date_format
            WHEN 'YYYY' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT;
            WHEN 'YYYYMM' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT || 
                              LPAD(EXTRACT(MONTH FROM p_date)::TEXT, 2, '0');
            WHEN 'YYYYMMDD' THEN 
                v_date_part := EXTRACT(YEAR FROM p_date)::TEXT || 
                              LPAD(EXTRACT(MONTH FROM p_date)::TEXT, 2, '0') ||
                              LPAD(EXTRACT(DAY FROM p_date)::TEXT, 2, '0');
        END CASE;
    END IF;
    
    -- Generate number part with padding
    v_number_part := LPAD(v_settings.current_number::TEXT, v_settings.digit_count, '0');
    
    -- Combine parts
    IF v_settings.prefix != '' AND v_date_part != '' THEN
        v_result := v_settings.prefix || v_settings.separator || v_date_part || v_settings.separator || v_number_part;
    ELSIF v_settings.prefix != '' THEN
        v_result := v_settings.prefix || v_settings.separator || v_number_part;
    ELSIF v_date_part != '' THEN
        v_result := v_date_part || v_settings.separator || v_number_part;
    ELSE
        v_result := v_number_part;
    END IF;
    
    RETURN v_result;
END;
$$;


--
-- Name: record_all_opening_balances(uuid, date, jsonb, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_all_opening_balances(p_company_id uuid, p_as_of_date date, p_account_balances jsonb, p_inventory_balances jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_opening_equity_acct_id UUID;
    v_inventory_asset_acct_id UUID;
    v_warehouse_id UUID;
    v_account_balance RECORD;
    v_inventory_item RECORD;
    v_account_class_val public.account_class;
    v_total_inventory_value NUMERIC := 0;
BEGIN
    -- STEP 1: Get critical accounts
    v_opening_equity_acct_id := public.get_system_account_id(p_company_id, 'OpeningBalanceEquity');
    v_inventory_asset_acct_id := public.get_system_account_id(p_company_id, 'Inventory');
    SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = p_company_id AND is_active = true LIMIT 1;

    IF v_opening_equity_acct_id IS NULL THEN
        RAISE EXCEPTION 'CRITICAL: Opening Balance Equity account is not configured for this company.';
    END IF;

    -- STEP 2: Create the single master Journal Entry
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_type)
    VALUES (p_company_id, p_as_of_date, 'Opening Balances Posted', 'OPENING_BALANCE')
    RETURNING id INTO v_journal_entry_id;

    -- STEP 3: Process general account balances
    FOR v_account_balance IN
        SELECT *
        FROM jsonb_to_recordset(p_account_balances) AS x(
            account_id UUID,
            amount NUMERIC,
            customer_id UUID,
            supplier_id UUID,
            cash_bank_account_id UUID
        )
    LOOP
        SELECT account_class INTO v_account_class_val FROM public.chart_of_accounts WHERE id = v_account_balance.account_id;

        IF v_account_class_val IN ('ASSET', 'EXPENSE') THEN
            INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, customer_id, supplier_id, cash_bank_account_id)
            VALUES (v_journal_entry_id, v_account_balance.account_id, v_account_balance.amount, v_account_balance.customer_id, v_account_balance.supplier_id, v_account_balance.cash_bank_account_id);
            
            INSERT INTO public.journal_lines (journal_entry_id, account_id, credit)
            VALUES (v_journal_entry_id, v_opening_equity_acct_id, v_account_balance.amount);

        ELSE -- LIABILITY, EQUITY, REVENUE
            INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, customer_id, supplier_id, cash_bank_account_id)
            VALUES (v_journal_entry_id, v_account_balance.account_id, v_account_balance.amount, v_account_balance.customer_id, v_account_balance.supplier_id, v_account_balance.cash_bank_account_id);

            INSERT INTO public.journal_lines (journal_entry_id, account_id, debit)
            VALUES (v_journal_entry_id, v_opening_equity_acct_id, v_account_balance.amount);
        END IF;
    END LOOP;

    -- STEP 4: Process inventory
    IF jsonb_array_length(p_inventory_balances) > 0 THEN
        IF v_inventory_asset_acct_id IS NULL OR v_warehouse_id IS NULL THEN
            RAISE EXCEPTION 'CRITICAL: Inventory asset account or an active warehouse is missing.';
        END IF;
    
        FOR v_inventory_item IN SELECT * FROM jsonb_to_recordset(p_inventory_balances) AS x(product_id UUID, quantity NUMERIC, cost NUMERIC)
        LOOP
            PERFORM public.log_inventory_movement(p_company_id, v_inventory_item.product_id, v_warehouse_id, 'INITIAL_STOCK', v_inventory_item.quantity, v_inventory_item.cost, v_journal_entry_id, 'Opening Stock');
            UPDATE public.products SET quantity_on_hand = v_inventory_item.quantity, average_cost = v_inventory_item.cost WHERE id = v_inventory_item.product_id;
            v_total_inventory_value := v_total_inventory_value + (v_inventory_item.quantity * v_inventory_item.cost);
        END LOOP;

        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit) VALUES (v_journal_entry_id, v_inventory_asset_acct_id, v_total_inventory_value);
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit) VALUES (v_journal_entry_id, v_opening_equity_acct_id, v_total_inventory_value);
    END IF;

    RETURN v_journal_entry_id;
END;
$$;


--
-- Name: record_customer_payment(uuid, uuid, uuid, numeric, date, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_customer_payment(p_company_id uuid, p_customer_id uuid, p_credit_note_id uuid, p_payment_amount numeric, p_payment_date date, p_cash_bank_account_id uuid, p_narration text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_ar_acct_id UUID;
    v_cash_bank_ledger_acct_id UUID;
BEGIN
    -- Get system accounts
    v_ar_acct_id := public.get_system_account_id(p_company_id, 'AccountsReceivable');
    SELECT chart_of_account_id INTO v_cash_bank_ledger_acct_id
    FROM public.cash_bank_accounts WHERE id = p_cash_bank_account_id;

    -- Safety checks
    IF v_ar_acct_id IS NULL OR v_cash_bank_ledger_acct_id IS NULL THEN
        RAISE EXCEPTION 'Critical system accounts (AccountsReceivable or Bank/Cash) are missing.';
    END IF;

    -- Create the journal entry for the refund payment
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
    VALUES (p_company_id, p_payment_date, p_narration, p_credit_note_id, 'customer_payment')
    RETURNING id INTO v_journal_entry_id;

    ---------------------------------------------------------------------
    -- THE CORRECTED LOGIC
    ---------------------------------------------------------------------

    -- 1. Debit Accounts Receivable:
    -- When a customer has a credit balance, it's a liability for you.
    -- To cancel a liability or a credit balance, you must DEBIT it.
    -- This correctly reduces the amount you owe the customer.
    INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, customer_id)
    VALUES (v_journal_entry_id, v_ar_acct_id, p_payment_amount, p_customer_id);

    -- 2. Credit Bank/Cash Account:
    -- Money is leaving your business to pay the refund.
    -- A decrease in an asset (like cash) is always a CREDIT.
    INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, cash_bank_account_id)
    VALUES (v_journal_entry_id, v_cash_bank_ledger_acct_id, p_payment_amount, p_cash_bank_account_id);

    ---------------------------------------------------------------------

    -- Update the Credit Note status
    UPDATE public.sales_credit_notes
    SET status = 'applied', amount_applied = amount_applied + p_payment_amount
    WHERE id = p_credit_note_id;

    RETURN v_journal_entry_id;
END;
$$;


--
-- Name: record_fixed_asset_purchase(uuid, uuid, text, date, numeric, uuid, uuid, uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_fixed_asset_purchase(p_company_id uuid, p_user_profile_id uuid, p_asset_name text, p_purchase_date date, p_purchase_price numeric, p_asset_account_id uuid, p_accumulated_depreciation_account_id uuid, p_paid_from_cash_bank_account_id uuid, p_supplier_id uuid, p_narration text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_voucher_id UUID;
    v_journal_entry_id UUID;
    v_credit_account_id UUID;
    v_fixed_asset_id UUID;
BEGIN
    -- Input validation
    IF p_paid_from_cash_bank_account_id IS NOT NULL AND p_supplier_id IS NOT NULL THEN
        RAISE EXCEPTION 'An asset purchase can either be paid immediately or be a credit purchase, not both.';
    END IF;
    IF p_paid_from_cash_bank_account_id IS NULL AND p_supplier_id IS NULL THEN
        RAISE EXCEPTION 'You must specify either a payment account or a supplier.';
    END IF;

    -- 1. Create the Journal Voucher Header
    INSERT INTO public.journal_vouchers (company_id, voucher_date, voucher_number, narration, created_by, status)
    VALUES (p_company_id, p_purchase_date, 'AP-' || EXTRACT(YEAR FROM p_purchase_date) || '-' || LPAD(EXTRACT(DOY FROM p_purchase_date)::text, 3, '0') || '-' || LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0'), p_narration, p_user_profile_id, 'draft')
    RETURNING id INTO v_voucher_id;

    -- 2. Add the Journal Voucher Lines
    -- Debit the specific Fixed Asset account
    INSERT INTO public.journal_voucher_lines (voucher_id, account_id, debit)
    VALUES (v_voucher_id, p_asset_account_id, p_purchase_price);

    -- Determine the account to credit
    IF p_supplier_id IS NOT NULL THEN
        -- It's a credit purchase, so credit Accounts Payable
        v_credit_account_id := public.get_system_account_id(p_company_id, 'AccountsPayable');
        INSERT INTO public.journal_voucher_lines (voucher_id, account_id, credit)
        VALUES (v_voucher_id, v_credit_account_id, p_purchase_price);
    ELSE
        -- It's a cash/bank purchase
        SELECT chart_of_account_id INTO v_credit_account_id FROM public.cash_bank_accounts WHERE id = p_paid_from_cash_bank_account_id;
        INSERT INTO public.journal_voucher_lines (voucher_id, account_id, credit, cash_bank_account_id)
        VALUES (v_voucher_id, v_credit_account_id, p_purchase_price, p_paid_from_cash_bank_account_id);
    END IF;

    -- 3. Post the Voucher to create the real Journal Entry
    UPDATE public.journal_vouchers SET status = 'posted' WHERE id = v_voucher_id;

    -- 4. (Conditional) Manually link the Supplier if it was a credit purchase
    -- The trigger doesn't know about the supplier, so we add it here.
    IF p_supplier_id IS NOT NULL THEN
        SELECT id INTO v_journal_entry_id FROM public.journal_entries WHERE source_document_id = v_voucher_id;
        
        UPDATE public.journal_lines
        SET supplier_id = p_supplier_id
        WHERE journal_entry_id = v_journal_entry_id AND account_id = v_credit_account_id;
    END IF;
    
    -- 5. Register the asset in the fixed_assets table for depreciation tracking
    INSERT INTO public.fixed_assets (company_id, asset_name, purchase_date, purchase_price, asset_account_id, accumulated_depreciation_account_id)
    VALUES (p_company_id, p_asset_name, p_purchase_date, p_purchase_price, p_asset_account_id, p_accumulated_depreciation_account_id)
    RETURNING id INTO v_fixed_asset_id;

    RETURN v_fixed_asset_id;
END;
$$;


--
-- Name: record_supplier_payment(uuid, uuid, uuid, numeric, date, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_supplier_payment(p_company_id uuid, p_supplier_id uuid, p_debit_note_id uuid, p_payment_amount numeric, p_payment_date date, p_cash_bank_account_id uuid, p_narration text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_ap_acct_id UUID;
    v_cash_bank_ledger_acct_id UUID;
BEGIN
    -- Get system accounts
    v_ap_acct_id := public.get_system_account_id(p_company_id, 'AccountsPayable');
    SELECT chart_of_account_id INTO v_cash_bank_ledger_acct_id
    FROM public.cash_bank_accounts WHERE id = p_cash_bank_account_id;

    -- Safety checks
    IF v_ap_acct_id IS NULL OR v_cash_bank_ledger_acct_id IS NULL THEN
        RAISE EXCEPTION 'Critical system accounts are missing.';
    END IF;

    -- Create the journal entry
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
    VALUES (p_company_id, p_payment_date, p_narration, p_debit_note_id, 'supplier_payment')
    RETURNING id INTO v_journal_entry_id;

    -- Create journal lines
    INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, cash_bank_account_id)
    VALUES (v_journal_entry_id, v_cash_bank_ledger_acct_id, p_payment_amount, p_cash_bank_account_id);

    INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, supplier_id)
    VALUES (v_journal_entry_id, v_ap_acct_id, p_payment_amount, p_supplier_id);

    -- Update the debit note status (This will now work)
    UPDATE public.purchase_debit_notes
    SET
        status = 'applied',
        amount_applied = amount_applied + p_payment_amount
    WHERE id = p_debit_note_id;
    
    RETURN v_journal_entry_id;
END;
$$;


--
-- Name: submit_purchase_bill(uuid, uuid, date, jsonb, uuid, text, date, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_purchase_bill(p_company_id uuid, p_supplier_id uuid, p_bill_date date, p_lines jsonb, p_existing_bill_id uuid DEFAULT NULL::uuid, p_bill_number text DEFAULT NULL::text, p_due_date date DEFAULT NULL::date, p_place_of_supply text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bill_id UUID;
    v_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_line JSONB;
    v_line_id UUID;
    v_tax JSONB;
BEGIN
    -- Calculate totals from lines
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_subtotal := v_subtotal + (v_line->>'line_total')::NUMERIC;
        
        -- Calculate tax total for this line
        FOR v_tax IN SELECT * FROM jsonb_array_elements(v_line->'line_taxes')
        LOOP
            v_total_tax := v_total_tax + (v_tax->>'tax_amount')::NUMERIC;
        END LOOP;
    END LOOP;
    
    v_total_amount := v_subtotal + v_total_tax;

    -- Step 1: Insert/Update bill as DRAFT
    IF p_existing_bill_id IS NOT NULL THEN
        -- Update existing bill
        UPDATE public.purchase_bills SET
            supplier_id = p_supplier_id,
            bill_number = p_bill_number,
            bill_date = p_bill_date,
            due_date = p_due_date,
            subtotal = v_subtotal,
            total_tax = v_total_tax,
            total_amount = v_total_amount,
            status = 'draft',
            place_of_supply = p_place_of_supply,
            updated_at = NOW()
        WHERE id = p_existing_bill_id AND company_id = p_company_id;
        
        v_bill_id := p_existing_bill_id;
        
        -- Delete existing lines
        DELETE FROM public.purchase_bill_lines WHERE bill_id = v_bill_id;
    ELSE
        -- Insert new bill
        INSERT INTO public.purchase_bills (
            company_id, supplier_id, bill_number, bill_date, due_date,
            subtotal, total_tax, total_amount, status, place_of_supply
        ) VALUES (
            p_company_id, p_supplier_id, p_bill_number, p_bill_date, p_due_date,
            v_subtotal, v_total_tax, v_total_amount, 'draft', p_place_of_supply
        ) RETURNING id INTO v_bill_id;
    END IF;

    -- Step 2: Insert all line items
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO public.purchase_bill_lines (
            bill_id, product_id, description, quantity, unit_price, line_total, hsn_sac_code
        ) VALUES (
            v_bill_id,
            (v_line->>'product_id')::UUID,
            v_line->>'description',
            (v_line->>'quantity')::NUMERIC,
            (v_line->>'unit_price')::NUMERIC,
            (v_line->>'line_total')::NUMERIC,
            v_line->>'hsn_sac_code'
        ) RETURNING id INTO v_line_id;

        -- Insert line taxes
        FOR v_tax IN SELECT * FROM jsonb_array_elements(v_line->'line_taxes')
        LOOP
            INSERT INTO public.purchase_bill_line_taxes (
                bill_line_id, tax_rate_id, tax_amount
            ) VALUES (
                v_line_id,
                (v_tax->>'tax_rate_id')::UUID,
                (v_tax->>'tax_amount')::NUMERIC
            );
        END LOOP;
    END LOOP;

    -- Step 3: Update status to 'submitted' (this triggers the accounting & inventory)
    UPDATE public.purchase_bills 
    SET status = 'submitted', updated_at = NOW()
    WHERE id = v_bill_id;

    -- Return the bill ID
    RETURN json_build_object('bill_id', v_bill_id);
END;
$$;


--
-- Name: submit_sales_invoice(uuid, uuid, text, date, jsonb, uuid, date, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.submit_sales_invoice(p_company_id uuid, p_customer_id uuid, p_invoice_number text, p_invoice_date date, p_lines jsonb, p_existing_invoice_id uuid DEFAULT NULL::uuid, p_due_date date DEFAULT NULL::date, p_place_of_supply text DEFAULT NULL::text) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_invoice_id UUID;
    v_subtotal NUMERIC := 0;
    v_total_tax NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_line JSONB;
    v_line_id UUID;
    v_tax JSONB;
BEGIN
    -- Calculate totals from lines
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        v_subtotal := v_subtotal + (v_line->>'line_total')::NUMERIC;
        
        -- Calculate tax total for this line
        FOR v_tax IN SELECT * FROM jsonb_array_elements(v_line->'line_taxes')
        LOOP
            v_total_tax := v_total_tax + (v_tax->>'tax_amount')::NUMERIC;
        END LOOP;
    END LOOP;
    
    v_total_amount := v_subtotal + v_total_tax;

    -- Step 1: Insert/Update invoice as DRAFT
    IF p_existing_invoice_id IS NOT NULL THEN
        -- Update existing invoice
        UPDATE public.sales_invoices SET
            customer_id = p_customer_id,
            invoice_number = p_invoice_number,
            invoice_date = p_invoice_date,
            due_date = p_due_date,
            subtotal = v_subtotal,
            total_tax = v_total_tax,
            total_amount = v_total_amount,
            status = 'draft',
            place_of_supply = p_place_of_supply
        WHERE id = p_existing_invoice_id AND company_id = p_company_id;
        
        v_invoice_id := p_existing_invoice_id;
        
        -- Delete existing lines
        DELETE FROM public.sales_invoice_lines WHERE invoice_id = v_invoice_id;
    ELSE
        -- Insert new invoice
        INSERT INTO public.sales_invoices (
            company_id, customer_id, invoice_number, invoice_date, due_date,
            subtotal, total_tax, total_amount, status, place_of_supply
        ) VALUES (
            p_company_id, p_customer_id, p_invoice_number, p_invoice_date, p_due_date,
            v_subtotal, v_total_tax, v_total_amount, 'draft', p_place_of_supply
        ) RETURNING id INTO v_invoice_id;
    END IF;

    -- Step 2: Insert all line items
    FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
    LOOP
        INSERT INTO public.sales_invoice_lines (
            invoice_id, product_id, description, quantity, unit_price, line_total, hsn_sac_code
        ) VALUES (
            v_invoice_id,
            (v_line->>'product_id')::UUID,
            v_line->>'description',
            (v_line->>'quantity')::NUMERIC,
            (v_line->>'unit_price')::NUMERIC,
            (v_line->>'line_total')::NUMERIC,
            v_line->>'hsn_sac_code'
        ) RETURNING id INTO v_line_id;

        -- Insert line taxes
        FOR v_tax IN SELECT * FROM jsonb_array_elements(v_line->'line_taxes')
        LOOP
            INSERT INTO public.sales_invoice_line_taxes (
                invoice_line_id, tax_rate_id, tax_amount
            ) VALUES (
                v_line_id,
                (v_tax->>'tax_rate_id')::UUID,
                (v_tax->>'tax_amount')::NUMERIC
            );
        END LOOP;
    END LOOP;

    -- Step 3: Update status to 'sent' (this triggers the accounting & inventory)
    UPDATE public.sales_invoices 
    SET status = 'sent'
    WHERE id = v_invoice_id;

    -- Return the invoice ID
    RETURN json_build_object('invoice_id', v_invoice_id);
END;
$$;


--
-- Name: tg_handle_bill_payment_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_handle_bill_payment_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This payment record is about to be deleted. We must reverse its journal entry.
    -- We can re-use our generic reversal function.
    PERFORM public.create_reversal_journal_entry(
        (SELECT company_id FROM public.purchase_bills WHERE id = OLD.bill_id), -- Find company_id from the bill
        'REVERSAL: DELETED Payment for Bill', -- A generic narration
        OLD.id, -- The source_document_id is the payment's own ID
        'bill_payment_delete'
    );
    -- Allow the delete to proceed
    RETURN OLD;
END;
$$;


--
-- Name: tg_handle_invoice_payment_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_handle_invoice_payment_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM public.create_reversal_journal_entry(
        (SELECT company_id FROM public.sales_invoices WHERE id = OLD.invoice_id),
        'REVERSAL: DELETED Payment for Invoice',
        OLD.id,
        'invoice_payment_delete'
    );
    RETURN OLD;
END;
$$;


--
-- Name: tg_handle_purchase_bill_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_handle_purchase_bill_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_line RECORD;
BEGIN
    IF OLD.status IN ('submitted', 'paid', 'partially_paid') THEN
        -- 1. Reverse the Journal Entry
        PERFORM public.create_reversal_journal_entry(
            OLD.company_id,
            'REVERSAL: DELETED Bill #' || OLD.bill_number,
            OLD.id,
            'purchase_bill_delete'
        );

        -- 2. Reverse the Inventory Movement (Stock Decreases)
        FOR v_line IN
            SELECT pbl.product_id, pbl.quantity
            FROM public.purchase_bill_lines pbl
            JOIN public.products p ON pbl.product_id = p.id
            WHERE pbl.bill_id = OLD.id AND p.type = 'GOOD'
        LOOP
            INSERT INTO public.inventory_movements (product_id, warehouse_id, quantity_change, reason, source_document_id)
            VALUES (v_line.product_id, (SELECT id FROM public.warehouses WHERE company_id = OLD.company_id LIMIT 1), -v_line.quantity, 'REVERSAL: DELETED Bill #' || OLD.bill_number, OLD.id);
        END LOOP;
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: tg_handle_sales_invoice_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_handle_sales_invoice_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_line RECORD;
BEGIN
    -- Only act if deleting a financially relevant document
    IF OLD.status IN ('sent', 'paid', 'partially_paid') THEN
        -- 1. Reverse the Journal Entry
        PERFORM public.create_reversal_journal_entry(
            OLD.company_id,
            'REVERSAL: DELETED Invoice #' || OLD.invoice_number,
            OLD.id,
            'sales_invoice_delete'
        );

        -- 2. Reverse the Inventory Movement (Stock Increases)
        FOR v_line IN
            SELECT sil.product_id, sil.quantity
            FROM public.sales_invoice_lines sil
            JOIN public.products p ON sil.product_id = p.id
            WHERE sil.invoice_id = OLD.id AND p.type = 'GOOD'
        LOOP
            INSERT INTO public.inventory_movements (product_id, warehouse_id, quantity_change, reason, source_document_id)
            VALUES (v_line.product_id, (SELECT id FROM public.warehouses WHERE company_id = OLD.company_id LIMIT 1), v_line.quantity, 'REVERSAL: DELETED Invoice #' || OLD.invoice_number, OLD.id);
        END LOOP;
    END IF;
    -- Allow the delete to proceed
    RETURN OLD;
END;
$$;


--
-- Name: tg_impact_purchase_debit_note(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_impact_purchase_debit_note() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_ap_acct_id UUID;
    v_inventory_acct_id UUID; -- The account to be credited
    v_tax_receivable_acct_id UUID;
    v_line RECORD;
    v_tax_line RECORD;
    v_warehouse_id UUID;
BEGIN
    -- Get system accounts
    v_ap_acct_id := public.get_system_account_id(NEW.company_id, 'AccountsPayable');
    v_inventory_acct_id := public.get_system_account_id(NEW.company_id, 'Inventory');
    SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = NEW.company_id LIMIT 1;
    
    -- Safety checks
    IF v_ap_acct_id IS NULL OR v_inventory_acct_id IS NULL OR v_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: Critical accounts or warehouse are missing for company %', NEW.company_id;
    END IF;

    -- Action when note is posted
    IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, NEW.note_date, 'Purchase Return - DN #' || NEW.note_number, NEW.id, 'purchase_debit_note')
        RETURNING id INTO v_journal_entry_id;

        -- Debit Accounts Payable and link to the specific supplier
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, supplier_id)
        VALUES (v_journal_entry_id, v_ap_acct_id, NEW.total_amount, NEW.supplier_id);

        -- Reverse any tax credits (credit the receivable accounts)
        FOR v_tax_line IN SELECT pdnlt.tax_amount, tr.name FROM public.purchase_debit_note_line_taxes pdnlt JOIN public.tax_rates tr ON pdnlt.tax_rate_id = tr.id JOIN public.purchase_debit_note_lines pdnl ON pdnlt.debit_note_line_id = pdnl.id WHERE pdnl.debit_note_id = NEW.id LOOP
            v_tax_receivable_acct_id := CASE WHEN v_tax_line.name ILIKE 'IGST%' THEN public.get_system_account_id(NEW.company_id, 'IgstReceivable') WHEN v_tax_line.name ILIKE 'CGST%' THEN public.get_system_account_id(NEW.company_id, 'CgstReceivable') WHEN v_tax_line.name ILIKE 'SGST%' THEN public.get_system_account_id(NEW.company_id, 'SgstReceivable') ELSE NULL END;
            IF v_tax_receivable_acct_id IS NOT NULL THEN
                INSERT INTO public.journal_lines (journal_entry_id, account_id, credit) VALUES (v_journal_entry_id, v_tax_receivable_acct_id, v_tax_line.tax_amount);
            END IF;
        END LOOP;

        -- **THE CORRECT FIX**: Credit the Inventory asset account to reduce its value.
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit)
        VALUES (v_journal_entry_id, v_inventory_acct_id, NEW.subtotal);

        -- Update inventory physical quantities
        FOR v_line IN SELECT pdnl.product_id, pdnl.quantity, p.average_cost FROM public.purchase_debit_note_lines pdnl JOIN public.products p ON pdnl.product_id = p.id WHERE pdnl.debit_note_id = NEW.id AND p.type = 'GOOD' LOOP
            PERFORM public.log_inventory_movement(NEW.company_id, v_line.product_id, v_warehouse_id, 'PURCHASE_RETURN', -v_line.quantity, v_line.average_cost, NEW.id, 'Purchase Return via DN #' || NEW.note_number);
            UPDATE public.products SET quantity_on_hand = quantity_on_hand - v_line.quantity WHERE id = v_line.product_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: tg_impact_sales_credit_note(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_impact_sales_credit_note() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Revenue reversal variables
    v_revenue_journal_entry_id UUID;
    v_ar_acct_id UUID;
    v_sales_returns_acct_id UUID;
    v_tax_payable_acct_id UUID;
    v_tax_line RECORD;

    -- COGS reversal variables
    v_cogs_journal_entry_id UUID;
    v_inventory_acct_id UUID;
    v_cogs_acct_id UUID;
    v_line RECORD;
    v_total_cogs_reversal NUMERIC := 0;
    
    -- Common variables
    v_warehouse_id UUID;
BEGIN
    -- Get common accounts and warehouse
    v_ar_acct_id := public.get_system_account_id(NEW.company_id, 'AccountsReceivable');
    v_sales_returns_acct_id := public.get_system_account_id(NEW.company_id, 'SalesReturns');
    v_inventory_acct_id := public.get_system_account_id(NEW.company_id, 'Inventory');
    v_cogs_acct_id := public.get_system_account_id(NEW.company_id, 'CostOfGoodsSold');
    SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = NEW.company_id LIMIT 1;

    -- Safety checks for critical accounts
    IF v_ar_acct_id IS NULL OR v_sales_returns_acct_id IS NULL OR v_inventory_acct_id IS NULL OR v_cogs_acct_id IS NULL OR v_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: Critical accounts or warehouse are missing for company %', NEW.company_id;
    END IF;

    -- Trigger action when a credit note is POSTED
    IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
        -------------------------------------------------------------
        -- ENTRY 1: REVERSE REVENUE AND ACCOUNTS RECEIVABLE
        -------------------------------------------------------------
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, NEW.note_date, 'Sales Return - CN #' || NEW.note_number, NEW.id, 'sales_credit_note')
        RETURNING id INTO v_revenue_journal_entry_id;

        -- Debit Sales Returns (a contra-revenue account)
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit)
        VALUES (v_revenue_journal_entry_id, v_sales_returns_acct_id, NEW.subtotal);

        -- Debit Tax Payables (reversing the tax liability)
        FOR v_tax_line IN SELECT scnlt.tax_amount, tr.name FROM public.sales_credit_note_line_taxes scnlt JOIN public.tax_rates tr ON scnlt.tax_rate_id = tr.id JOIN public.sales_credit_note_lines scnl ON scnlt.credit_note_line_id = scnl.id WHERE scnl.credit_note_id = NEW.id LOOP
            v_tax_payable_acct_id := CASE WHEN v_tax_line.name ILIKE 'IGST%' THEN public.get_system_account_id(NEW.company_id, 'IgstPayable') WHEN v_tax_line.name ILIKE 'CGST%' THEN public.get_system_account_id(NEW.company_id, 'CgstPayable') WHEN v_tax_line.name ILIKE 'SGST%' THEN public.get_system_account_id(NEW.company_id, 'SgstPayable') ELSE NULL END;
            IF v_tax_payable_acct_id IS NOT NULL THEN
                INSERT INTO public.journal_lines (journal_entry_id, account_id, debit) VALUES (v_revenue_journal_entry_id, v_tax_payable_acct_id, v_tax_line.tax_amount);
            END IF;
        END LOOP;

        -- **THE FIX**: Credit Accounts Receivable and link it to the specific customer
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, customer_id)
        VALUES (v_revenue_journal_entry_id, v_ar_acct_id, NEW.total_amount, NEW.customer_id);

        -------------------------------------------------------------
        -- ENTRY 2: REVERSE COGS AND RETURN GOODS TO INVENTORY
        -------------------------------------------------------------
        -- Calculate the total cost of the returned goods
        FOR v_line IN SELECT scnl.product_id, scnl.quantity, p.average_cost FROM public.sales_credit_note_lines scnl JOIN public.products p ON scnl.product_id = p.id WHERE scnl.credit_note_id = NEW.id AND p.type = 'GOOD' LOOP
            v_total_cogs_reversal := v_total_cogs_reversal + (v_line.quantity * v_line.average_cost);
            PERFORM public.log_inventory_movement(NEW.company_id, v_line.product_id, v_warehouse_id, 'SALES_RETURN', v_line.quantity, v_line.average_cost, NEW.id, 'Sales Return via CN #' || NEW.note_number);
            UPDATE public.products SET quantity_on_hand = quantity_on_hand + v_line.quantity WHERE id = v_line.product_id;
        END LOOP;

        -- Create the COGS reversal journal entry only if there were goods returned
        IF v_total_cogs_reversal > 0 THEN
            INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
            VALUES (NEW.company_id, NEW.note_date, 'COGS Reversal for CN #' || NEW.note_number, NEW.id, 'sales_credit_note_cogs')
            RETURNING id INTO v_cogs_journal_entry_id;

            INSERT INTO public.journal_lines (journal_entry_id, account_id, debit) VALUES (v_cogs_journal_entry_id, v_inventory_acct_id, v_total_cogs_reversal);
            INSERT INTO public.journal_lines (journal_entry_id, account_id, credit) VALUES (v_cogs_journal_entry_id, v_cogs_acct_id, v_total_cogs_reversal);
        END IF;

    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_bill_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_bill_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_journal_entry_id UUID;
  v_ap_acct_id UUID;
  v_cash_bank_ledger_acct_id UUID;
  v_company_id UUID;
  v_bill_number TEXT;
  v_supplier_id UUID; -- <<<< VARIABLE ADDED
BEGIN
  -- Get context from the related bill
  SELECT pb.company_id, pb.bill_number, pb.supplier_id 
  INTO v_company_id, v_bill_number, v_supplier_id -- <<<< supplier_id ADDED HERE
  FROM public.purchase_bills pb WHERE pb.id = NEW.bill_id;

  v_ap_acct_id := public.get_system_account_id(v_company_id, 'AccountsPayable');
  SELECT chart_of_account_id INTO v_cash_bank_ledger_acct_id FROM public.cash_bank_accounts WHERE id = NEW.cash_bank_account_id;

  -- Create the main journal entry
  INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
  VALUES (v_company_id, NEW.payment_date, 'Payment Made for Bill #' || v_bill_number, NEW.id, 'bill_payment')
  RETURNING id INTO v_journal_entry_id;

  -- Debit: Accounts Payable (Liability Decreases) -- <<< THIS IS THE CORRECTED LINE
  INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, supplier_id)
  VALUES (v_journal_entry_id, v_ap_acct_id, NEW.amount, v_supplier_id);

  -- Credit: Bank/Cash (Asset Decreases)
  INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, cash_bank_account_id)
  VALUES (v_journal_entry_id, v_cash_bank_ledger_acct_id, NEW.amount, NEW.cash_bank_account_id);

  RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_invoice_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_invoice_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_journal_entry_id UUID;
  v_ar_acct_id UUID;
  v_cash_bank_ledger_acct_id UUID;
  v_company_id UUID;
  v_invoice_number TEXT;
  v_customer_id UUID; -- <<<< VARIABLE ADDED
BEGIN
  -- Get context from the related invoice
  SELECT si.company_id, si.invoice_number, si.customer_id 
  INTO v_company_id, v_invoice_number, v_customer_id -- <<<< customer_id ADDED HERE
  FROM public.sales_invoices si WHERE si.id = NEW.invoice_id;

  v_ar_acct_id := public.get_system_account_id(v_company_id, 'AccountsReceivable');
  SELECT chart_of_account_id INTO v_cash_bank_ledger_acct_id FROM public.cash_bank_accounts WHERE id = NEW.cash_bank_account_id;

  -- Create the main journal entry
  INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
  VALUES (v_company_id, NEW.payment_date, 'Payment Received for Invoice #' || v_invoice_number, NEW.id, 'invoice_payment')
  RETURNING id INTO v_journal_entry_id;

  -- Debit: Bank/Cash (Asset Increases)
  INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, cash_bank_account_id)
  VALUES (v_journal_entry_id, v_cash_bank_ledger_acct_id, NEW.amount, NEW.cash_bank_account_id);

  -- Credit: Accounts Receivable (Asset Decreases) -- <<< THIS IS THE CORRECTED LINE
  INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, customer_id)
  VALUES (v_journal_entry_id, v_ar_acct_id, NEW.amount, v_customer_id);

  RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_journal_voucher(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_journal_voucher() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_journal_entry_id UUID;
  v_line RECORD;
BEGIN
  -- POSTING a new journal voucher
  IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
    -- Create the journal entry
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
    VALUES (NEW.company_id, NEW.voucher_date, 'Journal Voucher #' || NEW.voucher_number || ' - ' || NEW.narration, NEW.id, 'journal_voucher')
    RETURNING id INTO v_journal_entry_id;
    
    -- Insert all journal lines from journal_voucher_lines - **MODIFIED PART**
    -- Now includes the specific cash_bank_account_id if it was provided in the voucher line.
    FOR v_line IN 
      SELECT account_id, debit, credit, cash_bank_account_id
      FROM public.journal_voucher_lines 
      WHERE voucher_id = NEW.id
    LOOP
      INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, credit, cash_bank_account_id) 
      VALUES (v_journal_entry_id, v_line.account_id, v_line.debit, v_line.credit, v_line.cash_bank_account_id);
    END LOOP;

  -- VOIDING an existing journal voucher
  ELSIF NEW.status = 'void' AND OLD.status = 'posted' THEN
    -- Create reversal journal entry
    INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
    VALUES (NEW.company_id, CURRENT_DATE, 'REVERSAL: Journal Voucher #' || NEW.voucher_number || ' - ' || NEW.narration, NEW.id, 'journal_voucher_void')
    RETURNING id INTO v_journal_entry_id;
    
    -- Insert reversal lines (swap debit and credit)
    FOR v_line IN 
      SELECT account_id, debit, credit, cash_bank_account_id
      FROM public.journal_voucher_lines 
      WHERE voucher_id = NEW.id
    LOOP
      INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, credit, cash_bank_account_id) 
      VALUES (v_journal_entry_id, v_line.account_id, v_line.credit, v_line.debit, v_line.cash_bank_account_id); -- carry over the link in reversal too
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_purchase_bill(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_purchase_bill() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_ap_acct_id UUID;
    v_inventory_acct_id UUID;
    v_tax_receivable_acct_id UUID;
    v_line RECORD;
    v_tax_line RECORD;
    v_warehouse_id UUID;
    v_product RECORD;
BEGIN
    -- This trigger runs only when a bill is first posted from a draft state or inserted as already posted.
    IF (TG_OP = 'UPDATE' AND NEW.status IN ('submitted', 'paid', 'partially_paid') AND OLD.status = 'draft') OR
       (TG_OP = 'INSERT' AND NEW.status IN ('submitted', 'paid', 'partially_paid'))
    THEN
        -- 1. GET SYSTEM ACCOUNTS AND WAREHOUSE
        v_ap_acct_id := public.get_system_account_id(NEW.company_id, 'AccountsPayable');
        v_inventory_acct_id := public.get_system_account_id(NEW.company_id, 'Inventory');
        SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = NEW.company_id AND is_active = true LIMIT 1;

        -- Safety checks
        IF v_ap_acct_id IS NULL OR v_inventory_acct_id IS NULL OR v_warehouse_id IS NULL THEN
            RAISE EXCEPTION 'Critical system accounts (AP, Inventory) or an active warehouse are missing for company %', NEW.company_id;
        END IF;

        -- 2. CREATE THE FINANCIAL JOURNAL ENTRY (Preserved Logic)
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, NEW.bill_date, 'Purchase - Bill #' || NEW.bill_number, NEW.id, 'purchase_bill')
        RETURNING id INTO v_journal_entry_id;

        -- Credit: Accounts Payable (Liability increases), linked to the supplier.
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit, supplier_id)
        VALUES (v_journal_entry_id, v_ap_acct_id, NEW.total_amount, NEW.supplier_id);

        -- Debit: Tax accounts for tax paid (Asset increases - tax receivable).
        FOR v_tax_line IN
            SELECT pblt.tax_amount, tr.name
            FROM public.purchase_bill_line_taxes pblt
            JOIN public.tax_rates tr ON pblt.tax_rate_id = tr.id
            JOIN public.purchase_bill_lines pbl ON pblt.bill_line_id = pbl.id
            WHERE pbl.bill_id = NEW.id
        LOOP
            v_tax_receivable_acct_id :=
                CASE
                    WHEN v_tax_line.name ILIKE 'IGST%' THEN public.get_system_account_id(NEW.company_id, 'IgstReceivable')
                    WHEN v_tax_line.name ILIKE 'CGST%' THEN public.get_system_account_id(NEW.company_id, 'CgstReceivable')
                    WHEN v_tax_line.name ILIKE 'SGST%' THEN public.get_system_account_id(NEW.company_id, 'SgstReceivable')
                    ELSE NULL
                END;
            IF v_tax_receivable_acct_id IS NOT NULL THEN
                INSERT INTO public.journal_lines (journal_entry_id, account_id, debit)
                VALUES (v_journal_entry_id, v_tax_receivable_acct_id, v_tax_line.tax_amount);
            END IF;
        END LOOP;

        -- Debit: Inventory Asset account for the subtotal amount.
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit)
        VALUES (v_journal_entry_id, v_inventory_acct_id, NEW.subtotal);

        -- 3. *** NEW: UPDATE INVENTORY MOVEMENTS AND STOCK LEVELS ***
        FOR v_line IN
            SELECT pbl.product_id, pbl.quantity, pbl.unit_price
            FROM public.purchase_bill_lines pbl
            JOIN public.products p ON pbl.product_id = p.id
            WHERE pbl.bill_id = NEW.id AND p.type = 'GOOD'
        LOOP
            -- Log the physical stock movement (stock increases)
            PERFORM public.log_inventory_movement(
                NEW.company_id,
                v_line.product_id,
                v_warehouse_id,
                'PURCHASE',
                v_line.quantity,
                v_line.unit_price,
                NEW.id,
                'Purchase via Bill #' || NEW.bill_number
            );

            -- Update product quantity on hand and recalculate weighted average cost
            SELECT quantity_on_hand, average_cost INTO v_product FROM public.products WHERE id = v_line.product_id;

            UPDATE public.products
            SET
                quantity_on_hand = v_product.quantity_on_hand + v_line.quantity,
                average_cost =
                    CASE
                        WHEN (v_product.quantity_on_hand + v_line.quantity) > 0
                        THEN ((COALESCE(v_product.quantity_on_hand, 0) * COALESCE(v_product.average_cost, 0)) + (v_line.quantity * v_line.unit_price)) / (v_product.quantity_on_hand + v_line.quantity)
                        ELSE 0
                    END
            WHERE id = v_line.product_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_sales_credit_note(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_sales_credit_note() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_journal_entry_id UUID;
    v_ar_acct_id UUID;
    v_sales_returns_acct_id UUID;
BEGIN
    v_ar_acct_id := public.get_system_account_id(NEW.company_id, 'AccountsReceivable');
    v_sales_returns_acct_id := public.get_system_account_id(NEW.company_id, 'SalesReturns'); -- A Contra-Revenue account

    -- POSTING a credit note
    IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, NEW.note_date, 'Sales Return - Credit Note #' || NEW.note_number, NEW.id, 'sales_credit_note')
        RETURNING id INTO v_journal_entry_id;
        -- Debit: Sales Returns (Contra-Revenue Increases)
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit) VALUES (v_journal_entry_id, v_sales_returns_acct_id, NEW.subtotal);
        -- Credit: Accounts Receivable (Asset Decreases, customer owes less)
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit) VALUES (v_journal_entry_id, v_ar_acct_id, NEW.subtotal);
        -- NOTE: Also debit any tax accounts here if reversing tax

    -- VOIDING a credit note
    ELSIF NEW.status = 'void' AND OLD.status = 'posted' THEN
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, CURRENT_DATE, 'REVERSAL: Credit Note #' || NEW.note_number, NEW.id, 'sales_credit_note_void')
        RETURNING id INTO v_journal_entry_id;
        -- Credit: Sales Returns (Reversing the Debit)
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit) VALUES (v_journal_entry_id, v_sales_returns_acct_id, OLD.subtotal);
        -- Debit: Accounts Receivable (Reversing the Credit)
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit) VALUES (v_journal_entry_id, v_ar_acct_id, OLD.subtotal);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: tg_journalize_sales_invoice(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tg_journalize_sales_invoice() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Revenue entry variables
    v_revenue_journal_entry_id UUID;
    v_ar_acct_id UUID;
    v_sales_acct_id UUID;
    v_tax_payable_acct_id UUID;
    v_tax_line RECORD;

    -- COGS & Inventory variables
    v_cogs_journal_entry_id UUID;
    v_cogs_acct_id UUID;
    v_inventory_acct_id UUID;
    v_total_cogs NUMERIC := 0;
    v_line RECORD;
    v_warehouse_id UUID;
BEGIN
    -- This trigger runs only when an invoice is first posted from a draft state or inserted as already posted.
    IF (TG_OP = 'UPDATE' AND NEW.status IN ('sent', 'paid', 'partially_paid') AND OLD.status = 'draft') OR
       (TG_OP = 'INSERT' AND NEW.status IN ('sent', 'paid', 'partially_paid'))
    THEN
        -- 1. GET SYSTEM ACCOUNTS AND WAREHOUSE
        v_ar_acct_id := public.get_system_account_id(NEW.company_id, 'AccountsReceivable');
        v_sales_acct_id := public.get_system_account_id(NEW.company_id, 'SalesRevenue');
        v_cogs_acct_id := public.get_system_account_id(NEW.company_id, 'CostOfGoodsSold');
        v_inventory_acct_id := public.get_system_account_id(NEW.company_id, 'Inventory');
        SELECT id INTO v_warehouse_id FROM public.warehouses WHERE company_id = NEW.company_id AND is_active = true LIMIT 1;

        -- Safety checks
        IF v_ar_acct_id IS NULL OR v_sales_acct_id IS NULL OR v_cogs_acct_id IS NULL OR v_inventory_acct_id IS NULL OR v_warehouse_id IS NULL THEN
            RAISE EXCEPTION 'Critical system accounts (AR, Sales, COGS, Inventory) or an active warehouse are missing for company %', NEW.company_id;
        END IF;

        -- 2. CREATE REVENUE JOURNAL ENTRY (Preserved Logic)
        INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
        VALUES (NEW.company_id, NEW.invoice_date, 'Sale via Invoice #' || NEW.invoice_number, NEW.id, 'sales_invoice_revenue')
        RETURNING id INTO v_revenue_journal_entry_id;

        -- Debit: Accounts Receivable (Asset increases), linked to the customer.
        INSERT INTO public.journal_lines (journal_entry_id, account_id, debit, customer_id)
        VALUES (v_revenue_journal_entry_id, v_ar_acct_id, NEW.total_amount, NEW.customer_id);

        -- Credit: Sales Revenue account for the subtotal.
        INSERT INTO public.journal_lines (journal_entry_id, account_id, credit)
        VALUES (v_revenue_journal_entry_id, v_sales_acct_id, NEW.subtotal);

        -- Credit: Tax accounts for tax collected (Liability increases).
        FOR v_tax_line IN
            SELECT silt.tax_amount, tr.name
            FROM public.sales_invoice_line_taxes silt
            JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
            JOIN public.sales_invoice_lines sil ON silt.invoice_line_id = sil.id
            WHERE sil.invoice_id = NEW.id
        LOOP
            v_tax_payable_acct_id :=
                CASE
                    WHEN v_tax_line.name ILIKE 'IGST%' THEN public.get_system_account_id(NEW.company_id, 'IgstPayable')
                    WHEN v_tax_line.name ILIKE 'CGST%' THEN public.get_system_account_id(NEW.company_id, 'CgstPayable')
                    WHEN v_tax_line.name ILIKE 'SGST%' THEN public.get_system_account_id(NEW.company_id, 'SgstPayable')
                    ELSE NULL
                END;
            IF v_tax_payable_acct_id IS NOT NULL THEN
                INSERT INTO public.journal_lines (journal_entry_id, account_id, credit)
                VALUES (v_revenue_journal_entry_id, v_tax_payable_acct_id, v_tax_line.tax_amount);
            END IF;
        END LOOP;

        -- 3. *** NEW: UPDATE INVENTORY AND CREATE COGS ENTRY ***
        FOR v_line IN
            SELECT sil.product_id, sil.quantity, p.average_cost
            FROM public.sales_invoice_lines sil
            JOIN public.products p ON sil.product_id = p.id
            WHERE sil.invoice_id = NEW.id AND p.type = 'GOOD'
        LOOP
            v_total_cogs := v_total_cogs + (v_line.quantity * COALESCE(v_line.average_cost, 0));

            -- Log the physical stock movement (stock decreases)
            PERFORM public.log_inventory_movement(
                NEW.company_id,
                v_line.product_id,
                v_warehouse_id,
                'SALE',
                -v_line.quantity, -- Negative quantity for sales
                COALESCE(v_line.average_cost, 0),
                NEW.id,
                'Sale via Invoice #' || NEW.invoice_number
            );

            -- Update product quantity on hand
            UPDATE public.products
            SET quantity_on_hand = quantity_on_hand - v_line.quantity
            WHERE id = v_line.product_id;
        END LOOP;

        -- Create the COGS journal entry only if there were goods sold.
        IF v_total_cogs > 0 THEN
            INSERT INTO public.journal_entries (company_id, entry_date, narration, source_document_id, source_document_type)
            VALUES (NEW.company_id, NEW.invoice_date, 'COGS for Invoice #' || NEW.invoice_number, NEW.id, 'sales_invoice_cogs')
            RETURNING id INTO v_cogs_journal_entry_id;

            -- Debit: Cost of Goods Sold (Expense increases).
            INSERT INTO public.journal_lines (journal_entry_id, account_id, debit)
            VALUES (v_cogs_journal_entry_id, v_cogs_acct_id, v_total_cogs);

            -- Credit: Inventory (Asset decreases).
            INSERT INTO public.journal_lines (journal_entry_id, account_id, credit)
            VALUES (v_cogs_journal_entry_id, v_inventory_acct_id, v_total_cogs);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: trigger_create_system_accounts_for_new_company(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_create_system_accounts_for_new_company() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM create_gold_standard_accounts_for_company(NEW.id);
    RETURN NEW;
END;
$$;


--
-- Name: update_companies_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_companies_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_journal_entries_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_journal_entries_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


--
-- Name: update_numbering_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_numbering_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_tax_groups_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tax_groups_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_user_claims(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_claims() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object(
      'app_role', NEW.role,
      'company_id', NEW.company_id
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: bank_reconciliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_reconciliations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    statement_date date NOT NULL,
    ending_balance numeric(12,2) NOT NULL,
    status public.reconciliation_status DEFAULT 'in_progress'::public.reconciliation_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bill_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bill_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_id uuid NOT NULL,
    payment_date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method DEFAULT 'bank_transfer'::public.payment_method NOT NULL,
    cash_bank_account_id uuid NOT NULL,
    reference_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bill_payments_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: business_proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    address_line_1 text NOT NULL,
    address_line_2 text,
    city text NOT NULL,
    state_province text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    company_name text NOT NULL,
    is_gst_registered boolean DEFAULT false NOT NULL,
    gstin text,
    document_urls text[] DEFAULT '{}'::text[],
    status public.proposal_status DEFAULT 'pending'::public.proposal_status NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gstin_required_when_registered CHECK (((is_gst_registered = false) OR ((is_gst_registered = true) AND (gstin IS NOT NULL)))),
    CONSTRAINT valid_email CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT valid_phone CHECK ((phone ~* '^[+]?[0-9\\s\\-\\(\\)]{10,15}$'::text))
);


--
-- Name: cash_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    chart_of_account_id uuid NOT NULL,
    account_name text NOT NULL,
    account_type text NOT NULL,
    account_details jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT cash_bank_accounts_account_type_check CHECK ((account_type = ANY (ARRAY['Bank'::text, 'Cash'::text])))
);


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    account_code text,
    account_name text NOT NULL,
    account_class public.account_class NOT NULL,
    account_type text,
    system_account_type text,
    parent_account_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    deleted_at timestamp with time zone,
    pnl_head text,
    bs_head text,
    cash_flow_head text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    state text,
    gstin text,
    address_line_1 text,
    address_line_2 text,
    city text,
    state_province text,
    postal_code text,
    country text DEFAULT 'India'::text,
    phone text,
    email text,
    website text,
    pan_number text,
    tan_number text,
    cin_number text,
    business_type text,
    logo_url text,
    bank_details jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    details jsonb,
    deleted_at timestamp with time zone,
    gstin text
);


--
-- Name: daily_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    log_type public.daily_log_type DEFAULT 'GENERAL_UPDATE'::public.daily_log_type NOT NULL,
    notes text NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    address_snapshot text,
    tags text[],
    customer_id uuid,
    supplier_id uuid,
    product_id uuid
);


--
-- Name: financial_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    retained_earnings numeric(15,2),
    closed_at timestamp with time zone,
    closed_by_user_id uuid,
    CONSTRAINT status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: fixed_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fixed_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    asset_name text NOT NULL,
    purchase_date date NOT NULL,
    purchase_price numeric(12,2) NOT NULL,
    asset_account_id uuid NOT NULL,
    accumulated_depreciation_account_id uuid NOT NULL
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    movement_date timestamp with time zone DEFAULT now() NOT NULL,
    quantity_change numeric(10,2) NOT NULL,
    reason text NOT NULL,
    source_document_id uuid,
    notes text,
    company_id uuid,
    movement_type public.inventory_movement_type,
    unit_cost numeric(12,2) DEFAULT 0.00,
    total_value_change numeric(12,2) GENERATED ALWAYS AS ((quantity_change * unit_cost)) STORED
);


--
-- Name: invoice_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    payment_date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method DEFAULT 'bank_transfer'::public.payment_method NOT NULL,
    cash_bank_account_id uuid NOT NULL,
    reference_number text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invoice_payments_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    entry_date date NOT NULL,
    narration text NOT NULL,
    source_document_id uuid,
    source_document_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_user_id uuid,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by_user_id uuid
);


--
-- Name: journal_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    debit numeric(12,2) DEFAULT 0.00 NOT NULL,
    credit numeric(12,2) DEFAULT 0.00 NOT NULL,
    reconciliation_id uuid,
    cash_bank_account_id uuid,
    customer_id uuid,
    supplier_id uuid,
    CONSTRAINT check_customer_or_supplier CHECK (((customer_id IS NULL) OR (supplier_id IS NULL))),
    CONSTRAINT debit_and_credit_cannot_coexist CHECK (((debit = (0)::numeric) OR (credit = (0)::numeric))),
    CONSTRAINT debit_or_credit_must_exist CHECK (((debit > (0)::numeric) OR (credit > (0)::numeric))),
    CONSTRAINT journal_lines_credit_check CHECK ((credit >= (0)::numeric)),
    CONSTRAINT journal_lines_debit_check CHECK ((debit >= (0)::numeric))
);


--
-- Name: journal_voucher_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_voucher_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    voucher_id uuid NOT NULL,
    account_id uuid NOT NULL,
    debit numeric(12,2) DEFAULT 0.00,
    credit numeric(12,2) DEFAULT 0.00,
    description text,
    cash_bank_account_id uuid
);


--
-- Name: journal_vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_vouchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    voucher_date date NOT NULL,
    voucher_number text,
    narration text NOT NULL,
    status public.document_status DEFAULT 'draft'::public.document_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: log_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.log_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    log_id uuid NOT NULL,
    storage_path text NOT NULL,
    file_name text,
    mime_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    file_size_bytes bigint
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    type public.product_type DEFAULT 'GOOD'::public.product_type NOT NULL,
    description text,
    sale_price numeric(12,2),
    average_cost numeric(12,2),
    cogs_account_id uuid,
    revenue_account_id uuid,
    inventory_asset_account_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    hsn_sac_code text,
    default_tax_group_id uuid,
    quantity_on_hand numeric(10,2) DEFAULT 0 NOT NULL
);


--
-- Name: profile_kyc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_kyc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status public.kyc_status DEFAULT 'not_submitted'::public.kyc_status NOT NULL,
    legal_full_name text,
    email text,
    phone_number text,
    pan_card_number text,
    aadhar_card_number text,
    address jsonb,
    rejection_reason text,
    pan_card_image_url text,
    aadhar_card_front_url text,
    aadhar_card_back_url text,
    profile_photo_url text
);


--
-- Name: profile_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_references (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kyc_id uuid NOT NULL,
    reference_type text NOT NULL,
    full_name text NOT NULL,
    relationship text,
    phone_number text NOT NULL,
    address jsonb
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    company_id uuid,
    CONSTRAINT role_company_check CHECK ((((role = 'manager'::public.app_role) AND (company_id IS NOT NULL)) OR ((role = ANY (ARRAY['admin'::public.app_role, 'user'::public.app_role])) AND (company_id IS NULL))))
);


--
-- Name: purchase_bill_line_taxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_bill_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_line_id uuid NOT NULL,
    tax_rate_id uuid NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0.00 NOT NULL
);


--
-- Name: purchase_bill_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_bill_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    hsn_sac_code text
);


--
-- Name: purchase_bills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    bill_number text,
    bill_date date NOT NULL,
    due_date date,
    subtotal numeric(12,2) NOT NULL,
    total_tax numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    status public.bill_status DEFAULT 'draft'::public.bill_status NOT NULL,
    place_of_supply text,
    is_reverse_charge_applicable boolean DEFAULT false NOT NULL
);


--
-- Name: purchase_debit_note_line_taxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_debit_note_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    debit_note_line_id uuid NOT NULL,
    tax_rate_id uuid NOT NULL,
    tax_amount numeric(12,2) NOT NULL
);


--
-- Name: purchase_debit_note_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_debit_note_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    debit_note_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    hsn_sac_code text
);


--
-- Name: purchase_debit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_debit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    original_bill_id uuid,
    note_number text NOT NULL,
    note_date date NOT NULL,
    reason text,
    subtotal numeric(12,2) NOT NULL,
    total_tax numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    status public.document_status DEFAULT 'draft'::public.document_status NOT NULL,
    reason_for_note text,
    amount_applied numeric(12,2) DEFAULT 0.00,
    place_of_supply text
);


--
-- Name: sales_credit_note_line_taxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_credit_note_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    credit_note_line_id uuid NOT NULL,
    tax_rate_id uuid NOT NULL,
    tax_amount numeric(12,2) NOT NULL
);


--
-- Name: sales_credit_note_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_credit_note_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    credit_note_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    hsn_sac_code text
);


--
-- Name: sales_credit_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_credit_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    original_invoice_id uuid,
    note_number text NOT NULL,
    note_date date NOT NULL,
    reason text,
    subtotal numeric(12,2) NOT NULL,
    total_tax numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    status public.document_status DEFAULT 'draft'::public.document_status NOT NULL,
    reason_for_note text,
    amount_applied numeric(12,2) DEFAULT 0.00,
    place_of_supply text
);


--
-- Name: sales_invoice_line_taxes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoice_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_line_id uuid NOT NULL,
    tax_rate_id uuid NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0.00 NOT NULL
);


--
-- Name: sales_invoice_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoice_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    hsn_sac_code text
);


--
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    invoice_number text NOT NULL,
    invoice_date date NOT NULL,
    due_date date,
    subtotal numeric(12,2) NOT NULL,
    total_tax numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    place_of_supply text,
    irn text,
    qr_code_url text,
    gstr1_invoice_type public.gstr1_b2b_invoice_type DEFAULT 'REGULAR'::public.gstr1_b2b_invoice_type
);


--
-- Name: sales_targets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_targets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    period public.target_period NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    metric public.target_metric NOT NULL,
    target_value numeric(15,2) NOT NULL,
    product_id uuid,
    created_by public.target_creator NOT NULL,
    status public.target_status DEFAULT 'ACTIVE'::public.target_status NOT NULL,
    notes text,
    manager_profile_id uuid
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    details jsonb,
    deleted_at timestamp with time zone,
    gstin text
);


--
-- Name: tax_group_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_group_rates (
    tax_group_id uuid NOT NULL,
    tax_rate_id uuid NOT NULL
);


--
-- Name: tax_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


--
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    rate numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT tax_rates_rate_check CHECK (((rate >= (0)::numeric) AND (rate <= (100)::numeric)))
);


--
-- Name: tds_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tds_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bill_payment_id uuid NOT NULL,
    tds_rate_id uuid NOT NULL,
    tds_amount numeric(12,2) NOT NULL,
    tds_deduction_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: tds_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tds_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section text NOT NULL,
    rate numeric(5,4) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    location text,
    is_active boolean DEFAULT true NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: chart_of_accounts account_name_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT account_name_unique_per_company UNIQUE (company_id, account_name);


--
-- Name: bank_reconciliations bank_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: bill_payments bill_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_payments
    ADD CONSTRAINT bill_payments_pkey PRIMARY KEY (id);


--
-- Name: business_proposals business_proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_proposals
    ADD CONSTRAINT business_proposals_pkey PRIMARY KEY (id);


--
-- Name: cash_bank_accounts cash_bank_account_name_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_bank_accounts
    ADD CONSTRAINT cash_bank_account_name_unique_per_company UNIQUE (company_id, account_name);


--
-- Name: cash_bank_accounts cash_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_bank_accounts
    ADD CONSTRAINT cash_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_logs daily_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT daily_logs_pkey PRIMARY KEY (id);


--
-- Name: financial_periods financial_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_pkey PRIMARY KEY (id);


--
-- Name: fixed_assets fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices invoice_number_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT invoice_number_unique_per_company UNIQUE (company_id, invoice_number);


--
-- Name: invoice_payments invoice_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_lines journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_pkey PRIMARY KEY (id);


--
-- Name: journal_voucher_lines journal_voucher_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_voucher_lines
    ADD CONSTRAINT journal_voucher_lines_pkey PRIMARY KEY (id);


--
-- Name: journal_vouchers journal_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_vouchers
    ADD CONSTRAINT journal_vouchers_pkey PRIMARY KEY (id);


--
-- Name: log_attachments log_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_attachments
    ADD CONSTRAINT log_attachments_pkey PRIMARY KEY (id);


--
-- Name: numbering_settings numbering_settings_company_id_document_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numbering_settings
    ADD CONSTRAINT numbering_settings_company_id_document_type_key UNIQUE (company_id, document_type);


--
-- Name: numbering_settings numbering_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numbering_settings
    ADD CONSTRAINT numbering_settings_pkey PRIMARY KEY (id);


--
-- Name: sales_targets performance_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT performance_targets_pkey PRIMARY KEY (id);


--
-- Name: products product_sku_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT product_sku_unique_per_company UNIQUE (company_id, sku);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profile_kyc profile_kyc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_kyc
    ADD CONSTRAINT profile_kyc_pkey PRIMARY KEY (id);


--
-- Name: profile_kyc profile_kyc_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_kyc
    ADD CONSTRAINT profile_kyc_profile_id_key UNIQUE (profile_id);


--
-- Name: profile_references profile_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_references
    ADD CONSTRAINT profile_references_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: purchase_bill_line_taxes purchase_bill_line_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_line_taxes
    ADD CONSTRAINT purchase_bill_line_taxes_pkey PRIMARY KEY (id);


--
-- Name: purchase_bill_lines purchase_bill_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_lines
    ADD CONSTRAINT purchase_bill_lines_pkey PRIMARY KEY (id);


--
-- Name: purchase_bills purchase_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bills
    ADD CONSTRAINT purchase_bills_pkey PRIMARY KEY (id);


--
-- Name: purchase_debit_note_line_taxes purchase_debit_note_line_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_line_taxes
    ADD CONSTRAINT purchase_debit_note_line_taxes_pkey PRIMARY KEY (id);


--
-- Name: purchase_debit_note_lines purchase_debit_note_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_lines
    ADD CONSTRAINT purchase_debit_note_lines_pkey PRIMARY KEY (id);


--
-- Name: purchase_debit_notes purchase_debit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_notes
    ADD CONSTRAINT purchase_debit_notes_pkey PRIMARY KEY (id);


--
-- Name: sales_credit_note_line_taxes sales_credit_note_line_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_line_taxes
    ADD CONSTRAINT sales_credit_note_line_taxes_pkey PRIMARY KEY (id);


--
-- Name: sales_credit_note_lines sales_credit_note_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_lines
    ADD CONSTRAINT sales_credit_note_lines_pkey PRIMARY KEY (id);


--
-- Name: sales_credit_notes sales_credit_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_notes
    ADD CONSTRAINT sales_credit_notes_pkey PRIMARY KEY (id);


--
-- Name: sales_invoice_line_taxes sales_invoice_line_taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_line_taxes
    ADD CONSTRAINT sales_invoice_line_taxes_pkey PRIMARY KEY (id);


--
-- Name: sales_invoice_lines sales_invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_lines
    ADD CONSTRAINT sales_invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: chart_of_accounts system_account_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT system_account_unique_per_company UNIQUE (company_id, system_account_type);


--
-- Name: tax_group_rates tax_group_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_group_rates
    ADD CONSTRAINT tax_group_rates_pkey PRIMARY KEY (tax_group_id, tax_rate_id);


--
-- Name: tax_groups tax_groups_name_unique_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_groups
    ADD CONSTRAINT tax_groups_name_unique_per_company UNIQUE (company_id, name);


--
-- Name: tax_groups tax_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_groups
    ADD CONSTRAINT tax_groups_pkey PRIMARY KEY (id);


--
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- Name: tds_payments tds_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_payments
    ADD CONSTRAINT tds_payments_pkey PRIMARY KEY (id);


--
-- Name: tds_rates tds_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_rates
    ADD CONSTRAINT tds_rates_pkey PRIMARY KEY (id);


--
-- Name: tds_rates tds_rates_section_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_rates
    ADD CONSTRAINT tds_rates_section_key UNIQUE (section);


--
-- Name: financial_periods unique_period_per_company; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT unique_period_per_company UNIQUE (company_id, start_date, end_date);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_bill_payments_bill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bill_payments_bill_id ON public.bill_payments USING btree (bill_id);


--
-- Name: idx_business_proposals_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_proposals_created_at ON public.business_proposals USING btree (created_at DESC);


--
-- Name: idx_business_proposals_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_proposals_profile_id ON public.business_proposals USING btree (profile_id);


--
-- Name: idx_business_proposals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_proposals_status ON public.business_proposals USING btree (status);


--
-- Name: idx_cash_bank_accounts_chart_of_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_bank_accounts_chart_of_account_id ON public.cash_bank_accounts USING btree (chart_of_account_id);


--
-- Name: idx_cash_bank_accounts_company_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_bank_accounts_company_type ON public.cash_bank_accounts USING btree (company_id, account_type) WHERE ((deleted_at IS NULL) AND (is_active = true));


--
-- Name: idx_chart_of_accounts_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chart_of_accounts_company_id ON public.chart_of_accounts USING btree (company_id);


--
-- Name: idx_coa_bs_head; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coa_bs_head ON public.chart_of_accounts USING btree (bs_head) WHERE (bs_head IS NOT NULL);


--
-- Name: idx_coa_pnl_head; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_coa_pnl_head ON public.chart_of_accounts USING btree (pnl_head) WHERE (pnl_head IS NOT NULL);


--
-- Name: idx_companies_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_deleted_at ON public.companies USING btree (deleted_at);


--
-- Name: idx_companies_gstin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_gstin ON public.companies USING btree (gstin) WHERE (gstin IS NOT NULL);


--
-- Name: idx_companies_pan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_companies_pan ON public.companies USING btree (pan_number) WHERE (pan_number IS NOT NULL);


--
-- Name: idx_customers_gstin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_gstin ON public.customers USING btree (gstin) WHERE (gstin IS NOT NULL);


--
-- Name: idx_daily_logs_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_logs_company_id ON public.daily_logs USING btree (company_id);


--
-- Name: idx_daily_logs_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_logs_tags ON public.daily_logs USING gin (tags);


--
-- Name: idx_inventory_movements_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_company_id ON public.inventory_movements USING btree (company_id);


--
-- Name: idx_inventory_movements_movement_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_movement_type ON public.inventory_movements USING btree (movement_type);


--
-- Name: idx_inventory_movements_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements USING btree (product_id);


--
-- Name: idx_invoice_payments_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments USING btree (invoice_id);


--
-- Name: idx_journal_entries_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_company_id ON public.journal_entries USING btree (company_id);


--
-- Name: idx_journal_lines_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_lines_account_id ON public.journal_lines USING btree (account_id);


--
-- Name: idx_journal_lines_cash_bank_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_lines_cash_bank_account_id ON public.journal_lines USING btree (cash_bank_account_id);


--
-- Name: idx_log_attachments_log_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_log_attachments_log_id ON public.log_attachments USING btree (log_id);


--
-- Name: idx_numbering_settings_company_document; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_numbering_settings_company_document ON public.numbering_settings USING btree (company_id, document_type);


--
-- Name: idx_numbering_settings_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_numbering_settings_company_id ON public.numbering_settings USING btree (company_id);


--
-- Name: idx_numbering_settings_document_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_numbering_settings_document_type ON public.numbering_settings USING btree (document_type);


--
-- Name: idx_products_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_company_id ON public.products USING btree (company_id);


--
-- Name: idx_profiles_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_company_id ON public.profiles USING btree (company_id);


--
-- Name: idx_purchase_bill_line_taxes_line_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_bill_line_taxes_line_id ON public.purchase_bill_line_taxes USING btree (bill_line_id);


--
-- Name: idx_purchase_debit_note_line_taxes_debit_note_line_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_debit_note_line_taxes_debit_note_line_id ON public.purchase_debit_note_line_taxes USING btree (debit_note_line_id);


--
-- Name: idx_purchase_debit_note_lines_debit_note_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_purchase_debit_note_lines_debit_note_id ON public.purchase_debit_note_lines USING btree (debit_note_id);


--
-- Name: idx_sales_credit_note_line_taxes_credit_note_line_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_credit_note_line_taxes_credit_note_line_id ON public.sales_credit_note_line_taxes USING btree (credit_note_line_id);


--
-- Name: idx_sales_credit_note_lines_credit_note_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_credit_note_lines_credit_note_id ON public.sales_credit_note_lines USING btree (credit_note_id);


--
-- Name: idx_sales_invoice_line_taxes_line_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoice_line_taxes_line_id ON public.sales_invoice_line_taxes USING btree (invoice_line_id);


--
-- Name: idx_sales_invoices_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_invoices_company_id ON public.sales_invoices USING btree (company_id);


--
-- Name: idx_sales_targets_manager_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_targets_manager_profile_id ON public.sales_targets USING btree (manager_profile_id);


--
-- Name: idx_suppliers_gstin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_gstin ON public.suppliers USING btree (gstin) WHERE (gstin IS NOT NULL);


--
-- Name: idx_tds_payments_bill_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tds_payments_bill_payment_id ON public.tds_payments USING btree (bill_payment_id);


--
-- Name: companies auto_create_system_accounts_on_company_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_create_system_accounts_on_company_insert AFTER INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.trigger_create_system_accounts_for_new_company();


--
-- Name: companies companies_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER companies_updated_at_trigger BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_companies_updated_at();


--
-- Name: journal_entries journal_entries_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER journal_entries_updated_at_trigger BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_journal_entries_updated_at();


--
-- Name: bill_payments journalize_bill_payment_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER journalize_bill_payment_on_insert AFTER INSERT ON public.bill_payments FOR EACH ROW EXECUTE FUNCTION public.tg_journalize_bill_payment();


--
-- Name: invoice_payments journalize_payment_on_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER journalize_payment_on_insert AFTER INSERT ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION public.tg_journalize_invoice_payment();


--
-- Name: journal_vouchers journalize_voucher_on_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER journalize_voucher_on_status_change AFTER UPDATE ON public.journal_vouchers FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.tg_journalize_journal_voucher();


--
-- Name: numbering_settings numbering_settings_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER numbering_settings_updated_at_trigger BEFORE UPDATE ON public.numbering_settings FOR EACH ROW EXECUTE FUNCTION public.update_numbering_settings_updated_at();


--
-- Name: profiles on_profile_change_update_claims; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_profile_change_update_claims AFTER INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_user_claims();


--
-- Name: purchase_bills purchase_bill_insert_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER purchase_bill_insert_trigger AFTER INSERT ON public.purchase_bills FOR EACH ROW WHEN ((new.status = ANY (ARRAY['submitted'::public.bill_status, 'paid'::public.bill_status, 'partially_paid'::public.bill_status]))) EXECUTE FUNCTION public.tg_journalize_purchase_bill();


--
-- Name: purchase_bills purchase_bill_status_change_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER purchase_bill_status_change_trigger AFTER UPDATE ON public.purchase_bills FOR EACH ROW EXECUTE FUNCTION public.tg_journalize_purchase_bill();


--
-- Name: purchase_debit_notes purchase_debit_note_status_change_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER purchase_debit_note_status_change_trigger AFTER UPDATE ON public.purchase_debit_notes FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.tg_impact_purchase_debit_note();


--
-- Name: sales_credit_notes sales_credit_note_status_change_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_credit_note_status_change_trigger AFTER UPDATE ON public.sales_credit_notes FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION public.tg_impact_sales_credit_note();


--
-- Name: sales_invoices sales_invoice_insert_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_invoice_insert_trigger AFTER INSERT ON public.sales_invoices FOR EACH ROW WHEN ((new.status = ANY (ARRAY['sent'::public.invoice_status, 'paid'::public.invoice_status, 'partially_paid'::public.invoice_status]))) EXECUTE FUNCTION public.tg_journalize_sales_invoice();


--
-- Name: sales_invoices sales_invoice_status_change_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sales_invoice_status_change_trigger AFTER UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.tg_journalize_sales_invoice();


--
-- Name: tax_groups tax_groups_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tax_groups_updated_at_trigger BEFORE UPDATE ON public.tax_groups FOR EACH ROW EXECUTE FUNCTION public.update_tax_groups_updated_at();


--
-- Name: chart_of_accounts trigger_inherit_parent_heads; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_inherit_parent_heads BEFORE INSERT OR UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.inherit_parent_reporting_heads();


--
-- Name: journal_vouchers trigger_true_delete_journal_voucher; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_true_delete_journal_voucher BEFORE DELETE ON public.journal_vouchers FOR EACH ROW EXECUTE FUNCTION public.handle_true_journal_voucher_delete();


--
-- Name: purchase_bills trigger_true_delete_purchase_bill; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_true_delete_purchase_bill BEFORE DELETE ON public.purchase_bills FOR EACH ROW EXECUTE FUNCTION public.handle_true_purchase_bill_delete();


--
-- Name: purchase_debit_notes trigger_true_delete_purchase_debit_note; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_true_delete_purchase_debit_note BEFORE DELETE ON public.purchase_debit_notes FOR EACH ROW EXECUTE FUNCTION public.handle_true_purchase_debit_note_delete();


--
-- Name: sales_credit_notes trigger_true_delete_sales_credit_note; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_true_delete_sales_credit_note BEFORE DELETE ON public.sales_credit_notes FOR EACH ROW EXECUTE FUNCTION public.handle_true_sales_credit_note_delete();


--
-- Name: sales_invoices trigger_true_delete_sales_invoice; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_true_delete_sales_invoice BEFORE DELETE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_true_sales_invoice_delete();


--
-- Name: bank_reconciliations bank_reconciliations_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_reconciliations
    ADD CONSTRAINT bank_reconciliations_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: bill_payments bill_payments_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_payments
    ADD CONSTRAINT bill_payments_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.purchase_bills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bill_payments bill_payments_cash_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bill_payments
    ADD CONSTRAINT bill_payments_cash_bank_account_id_fkey FOREIGN KEY (cash_bank_account_id) REFERENCES public.cash_bank_accounts(id);


--
-- Name: business_proposals business_proposals_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_proposals
    ADD CONSTRAINT business_proposals_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: business_proposals business_proposals_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_proposals
    ADD CONSTRAINT business_proposals_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);


--
-- Name: cash_bank_accounts cash_bank_accounts_chart_of_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_bank_accounts
    ADD CONSTRAINT cash_bank_accounts_chart_of_account_id_fkey FOREIGN KEY (chart_of_account_id) REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT;


--
-- Name: cash_bank_accounts cash_bank_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_bank_accounts
    ADD CONSTRAINT cash_bank_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: chart_of_accounts chart_of_accounts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: chart_of_accounts chart_of_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;


--
-- Name: customers customers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: daily_logs daily_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT daily_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: daily_logs daily_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT daily_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: financial_periods financial_periods_closed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_closed_by_user_id_fkey FOREIGN KEY (closed_by_user_id) REFERENCES public.profiles(id);


--
-- Name: financial_periods financial_periods_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_periods
    ADD CONSTRAINT financial_periods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: fixed_assets fixed_assets_accumulated_depreciation_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_accumulated_depreciation_account_id_fkey FOREIGN KEY (accumulated_depreciation_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: fixed_assets fixed_assets_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_asset_account_id_fkey FOREIGN KEY (asset_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: fixed_assets fixed_assets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: daily_logs fk_daily_logs_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT fk_daily_logs_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: daily_logs fk_daily_logs_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT fk_daily_logs_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: daily_logs fk_daily_logs_supplier; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_logs
    ADD CONSTRAINT fk_daily_logs_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: journal_lines fk_journal_lines_cash_bank_account; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT fk_journal_lines_cash_bank_account FOREIGN KEY (cash_bank_account_id) REFERENCES public.cash_bank_accounts(id) ON DELETE SET NULL;


--
-- Name: journal_lines fk_journal_lines_customer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT fk_journal_lines_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: journal_lines fk_journal_lines_supplier; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT fk_journal_lines_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements inventory_movements_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;


--
-- Name: invoice_payments invoice_payments_cash_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_cash_bank_account_id_fkey FOREIGN KEY (cash_bank_account_id) REFERENCES public.cash_bank_accounts(id);


--
-- Name: invoice_payments invoice_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_payments
    ADD CONSTRAINT invoice_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.profiles(id);


--
-- Name: journal_entries journal_entries_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES public.profiles(id);


--
-- Name: journal_lines journal_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id) ON DELETE RESTRICT;


--
-- Name: journal_lines journal_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journal_voucher_lines journal_voucher_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_voucher_lines
    ADD CONSTRAINT journal_voucher_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: journal_voucher_lines journal_voucher_lines_voucher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_voucher_lines
    ADD CONSTRAINT journal_voucher_lines_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.journal_vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: journal_vouchers journal_vouchers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_vouchers
    ADD CONSTRAINT journal_vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: journal_vouchers journal_vouchers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_vouchers
    ADD CONSTRAINT journal_vouchers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: log_attachments log_attachments_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_attachments
    ADD CONSTRAINT log_attachments_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.daily_logs(id) ON DELETE CASCADE;


--
-- Name: numbering_settings numbering_settings_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numbering_settings
    ADD CONSTRAINT numbering_settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: sales_targets performance_targets_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT performance_targets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: sales_targets performance_targets_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT performance_targets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_cogs_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_cogs_account_id_fkey FOREIGN KEY (cogs_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: products products_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: products products_default_tax_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_default_tax_group_id_fkey FOREIGN KEY (default_tax_group_id) REFERENCES public.tax_groups(id) ON DELETE SET NULL;


--
-- Name: products products_inventory_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_inventory_asset_account_id_fkey FOREIGN KEY (inventory_asset_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: products products_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_revenue_account_id_fkey FOREIGN KEY (revenue_account_id) REFERENCES public.chart_of_accounts(id);


--
-- Name: profile_kyc profile_kyc_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_kyc
    ADD CONSTRAINT profile_kyc_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_references profile_references_kyc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_references
    ADD CONSTRAINT profile_references_kyc_id_fkey FOREIGN KEY (kyc_id) REFERENCES public.profile_kyc(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: purchase_bill_line_taxes purchase_bill_line_taxes_bill_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_line_taxes
    ADD CONSTRAINT purchase_bill_line_taxes_bill_line_id_fkey FOREIGN KEY (bill_line_id) REFERENCES public.purchase_bill_lines(id) ON DELETE CASCADE;


--
-- Name: purchase_bill_line_taxes purchase_bill_line_taxes_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_line_taxes
    ADD CONSTRAINT purchase_bill_line_taxes_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE RESTRICT;


--
-- Name: purchase_bill_lines purchase_bill_lines_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_lines
    ADD CONSTRAINT purchase_bill_lines_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.purchase_bills(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: purchase_bill_lines purchase_bill_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bill_lines
    ADD CONSTRAINT purchase_bill_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_bills purchase_bills_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bills
    ADD CONSTRAINT purchase_bills_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: purchase_bills purchase_bills_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_bills
    ADD CONSTRAINT purchase_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;


--
-- Name: purchase_debit_note_line_taxes purchase_debit_note_line_taxes_debit_note_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_line_taxes
    ADD CONSTRAINT purchase_debit_note_line_taxes_debit_note_line_id_fkey FOREIGN KEY (debit_note_line_id) REFERENCES public.purchase_debit_note_lines(id) ON DELETE CASCADE;


--
-- Name: purchase_debit_note_line_taxes purchase_debit_note_line_taxes_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_line_taxes
    ADD CONSTRAINT purchase_debit_note_line_taxes_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id);


--
-- Name: purchase_debit_note_lines purchase_debit_note_lines_debit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_lines
    ADD CONSTRAINT purchase_debit_note_lines_debit_note_id_fkey FOREIGN KEY (debit_note_id) REFERENCES public.purchase_debit_notes(id) ON DELETE CASCADE;


--
-- Name: purchase_debit_note_lines purchase_debit_note_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_note_lines
    ADD CONSTRAINT purchase_debit_note_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: purchase_debit_notes purchase_debit_notes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_notes
    ADD CONSTRAINT purchase_debit_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: purchase_debit_notes purchase_debit_notes_original_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_notes
    ADD CONSTRAINT purchase_debit_notes_original_bill_id_fkey FOREIGN KEY (original_bill_id) REFERENCES public.purchase_bills(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: purchase_debit_notes purchase_debit_notes_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_debit_notes
    ADD CONSTRAINT purchase_debit_notes_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: sales_credit_note_line_taxes sales_credit_note_line_taxes_credit_note_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_line_taxes
    ADD CONSTRAINT sales_credit_note_line_taxes_credit_note_line_id_fkey FOREIGN KEY (credit_note_line_id) REFERENCES public.sales_credit_note_lines(id) ON DELETE CASCADE;


--
-- Name: sales_credit_note_line_taxes sales_credit_note_line_taxes_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_line_taxes
    ADD CONSTRAINT sales_credit_note_line_taxes_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id);


--
-- Name: sales_credit_note_lines sales_credit_note_lines_credit_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_lines
    ADD CONSTRAINT sales_credit_note_lines_credit_note_id_fkey FOREIGN KEY (credit_note_id) REFERENCES public.sales_credit_notes(id) ON DELETE CASCADE;


--
-- Name: sales_credit_note_lines sales_credit_note_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_note_lines
    ADD CONSTRAINT sales_credit_note_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_credit_notes sales_credit_notes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_notes
    ADD CONSTRAINT sales_credit_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: sales_credit_notes sales_credit_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_notes
    ADD CONSTRAINT sales_credit_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales_credit_notes sales_credit_notes_original_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_credit_notes
    ADD CONSTRAINT sales_credit_notes_original_invoice_id_fkey FOREIGN KEY (original_invoice_id) REFERENCES public.sales_invoices(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales_invoice_line_taxes sales_invoice_line_taxes_invoice_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_line_taxes
    ADD CONSTRAINT sales_invoice_line_taxes_invoice_line_id_fkey FOREIGN KEY (invoice_line_id) REFERENCES public.sales_invoice_lines(id) ON DELETE CASCADE;


--
-- Name: sales_invoice_line_taxes sales_invoice_line_taxes_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_line_taxes
    ADD CONSTRAINT sales_invoice_line_taxes_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE RESTRICT;


--
-- Name: sales_invoice_lines sales_invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_lines
    ADD CONSTRAINT sales_invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_invoice_lines sales_invoice_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoice_lines
    ADD CONSTRAINT sales_invoice_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_invoices sales_invoices_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: sales_targets sales_targets_manager_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_targets
    ADD CONSTRAINT sales_targets_manager_profile_id_fkey FOREIGN KEY (manager_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: suppliers suppliers_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: tax_group_rates tax_group_rates_tax_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_group_rates
    ADD CONSTRAINT tax_group_rates_tax_group_id_fkey FOREIGN KEY (tax_group_id) REFERENCES public.tax_groups(id) ON DELETE CASCADE;


--
-- Name: tax_group_rates tax_group_rates_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_group_rates
    ADD CONSTRAINT tax_group_rates_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE CASCADE;


--
-- Name: tax_groups tax_groups_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_groups
    ADD CONSTRAINT tax_groups_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: tax_rates tax_rates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: tds_payments tds_payments_bill_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_payments
    ADD CONSTRAINT tds_payments_bill_payment_id_fkey FOREIGN KEY (bill_payment_id) REFERENCES public.bill_payments(id) ON DELETE CASCADE;


--
-- Name: tds_payments tds_payments_tds_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tds_payments
    ADD CONSTRAINT tds_payments_tds_rate_id_fkey FOREIGN KEY (tds_rate_id) REFERENCES public.tds_rates(id);


--
-- Name: warehouses warehouses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: bank_reconciliations Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.bank_reconciliations USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.chart_of_accounts coa
  WHERE ((coa.id = bank_reconciliations.account_id) AND (coa.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: bill_payments Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.bill_payments USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.purchase_bills pb
  WHERE ((pb.id = bill_payments.bill_id) AND (pb.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: cash_bank_accounts Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.cash_bank_accounts USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: chart_of_accounts Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.chart_of_accounts USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: companies Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.companies USING (
CASE
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) THEN true
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'manager'::text) THEN (id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)
    ELSE false
END);


--
-- Name: customers Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.customers USING (
CASE
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) THEN true
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'manager'::text) THEN (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)
    ELSE false
END);


--
-- Name: daily_logs Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.daily_logs USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: financial_periods Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.financial_periods USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: fixed_assets Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.fixed_assets USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: inventory_movements Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.inventory_movements USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: invoice_payments Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.invoice_payments USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.sales_invoices si
  WHERE ((si.id = invoice_payments.invoice_id) AND (si.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: journal_entries Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.journal_entries USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: journal_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.journal_lines USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.journal_entries je
  WHERE ((je.id = journal_lines.journal_entry_id) AND (je.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))));


--
-- Name: journal_voucher_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.journal_voucher_lines USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.journal_vouchers jv
  WHERE ((jv.id = journal_voucher_lines.voucher_id) AND (jv.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: journal_vouchers Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.journal_vouchers USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: log_attachments Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.log_attachments USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.daily_logs dl
  WHERE ((dl.id = log_attachments.log_id) AND (dl.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: numbering_settings Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.numbering_settings USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: products Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.products USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: purchase_bill_line_taxes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_bill_line_taxes USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.purchase_bill_lines pbl
     JOIN public.purchase_bills pb ON ((pbl.bill_id = pb.id)))
  WHERE ((pbl.id = purchase_bill_line_taxes.bill_line_id) AND (pb.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: purchase_bill_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_bill_lines USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.purchase_bills pb
  WHERE ((pb.id = purchase_bill_lines.bill_id) AND (pb.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: purchase_bills Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_bills USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: purchase_debit_note_line_taxes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_debit_note_line_taxes USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.purchase_debit_note_lines pdnl
     JOIN public.purchase_debit_notes pdn ON ((pdnl.debit_note_id = pdn.id)))
  WHERE ((pdnl.id = purchase_debit_note_line_taxes.debit_note_line_id) AND (pdn.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: purchase_debit_note_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_debit_note_lines USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.purchase_debit_notes pdn
  WHERE ((pdn.id = purchase_debit_note_lines.debit_note_id) AND (pdn.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: purchase_debit_notes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_debit_notes USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: sales_credit_note_line_taxes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_credit_note_line_taxes USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.sales_credit_note_lines scnl
     JOIN public.sales_credit_notes scn ON ((scnl.credit_note_id = scn.id)))
  WHERE ((scnl.id = sales_credit_note_line_taxes.credit_note_line_id) AND (scn.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: sales_credit_note_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_credit_note_lines USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.sales_credit_notes scn
  WHERE ((scn.id = sales_credit_note_lines.credit_note_id) AND (scn.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: sales_credit_notes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_credit_notes USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: sales_invoice_line_taxes Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_invoice_line_taxes USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.sales_invoice_lines sil
     JOIN public.sales_invoices si ON ((sil.invoice_id = si.id)))
  WHERE ((sil.id = sales_invoice_line_taxes.invoice_line_id) AND (si.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))));


--
-- Name: sales_invoice_lines Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_invoice_lines USING (
CASE
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) THEN true
    WHEN (( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'manager'::text) THEN (EXISTS ( SELECT 1
       FROM public.sales_invoices si
      WHERE ((si.id = sales_invoice_lines.invoice_id) AND (si.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))
    ELSE false
END);


--
-- Name: sales_invoices Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_invoices USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: sales_targets Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.sales_targets USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: suppliers Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.suppliers USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: tax_group_rates Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.tax_group_rates USING (((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.tax_groups tg
  WHERE ((tg.id = tax_group_rates.tax_group_id) AND (tg.company_id = (((auth.jwt() -> 'app_metadata'::text) ->> 'company_id'::text))::uuid))))));


--
-- Name: tax_groups Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.tax_groups USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: tax_rates Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.tax_rates USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: tds_payments Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.tds_payments USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM (public.bill_payments bp
     JOIN public.purchase_bills pb ON ((bp.bill_id = pb.id)))
  WHERE ((bp.id = tds_payments.bill_payment_id) AND (pb.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))));


--
-- Name: warehouses Admin and Manager Access Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin and Manager Access Policy" ON public.warehouses USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: profile_kyc Admin, Manager, or Owner Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin, Manager, or Owner Access" ON public.profile_kyc USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (profile_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = profile_kyc.profile_id) AND (p.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))));


--
-- Name: profile_references Admin, Manager, or Owner Access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin, Manager, or Owner Access" ON public.profile_references USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (EXISTS ( SELECT 1
   FROM public.profile_kyc kyc
  WHERE ((kyc.id = profile_references.kyc_id) AND (kyc.profile_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM (public.profile_kyc kyc
     JOIN public.profiles p ON ((kyc.profile_id = p.id)))
  WHERE ((kyc.id = profile_references.kyc_id) AND (p.company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid))))));


--
-- Name: profiles Admins can delete any profile; managers can delete from their c; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete any profile; managers can delete from their c" ON public.profiles FOR DELETE USING (((public.get_current_claim('app_role'::text) = 'admin'::text) OR ((public.get_current_claim('app_role'::text) = 'manager'::text) AND ((company_id)::text = public.get_current_claim('company_id'::text)))));


--
-- Name: tds_rates Admins can manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage" ON public.tds_rates USING ((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text));


--
-- Name: business_proposals Admins can update all proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all proposals" ON public.business_proposals FOR UPDATE USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text));


--
-- Name: business_proposals Admins can view all proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all proposals" ON public.business_proposals FOR SELECT USING ((((auth.jwt() -> 'app_metadata'::text) ->> 'app_role'::text) = 'admin'::text));


--
-- Name: customers Admins see all, managers see their own company's data.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins see all, managers see their own company's data." ON public.customers USING (((public.get_current_claim('app_role'::text) = 'admin'::text) OR ((company_id)::text = public.get_current_claim('company_id'::text)))) WITH CHECK (((public.get_current_claim('app_role'::text) = 'admin'::text) OR ((company_id)::text = public.get_current_claim('company_id'::text))));


--
-- Name: tds_rates Authenticated users can view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view" ON public.tds_rates FOR SELECT USING ((( SELECT auth.role() AS role) = 'authenticated'::text));


--
-- Name: profiles Profiles are viewable by admins, or owners, or managers of the ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by admins, or owners, or managers of the " ON public.profiles FOR SELECT USING (((public.get_current_claim('app_role'::text) = 'admin'::text) OR (id = auth.uid()) OR ((public.get_current_claim('app_role'::text) = 'manager'::text) AND ((company_id)::text = public.get_current_claim('company_id'::text)))));


--
-- Name: profiles RLS Policy for Profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "RLS Policy for Profiles" ON public.profiles USING (((( SELECT public.get_jwt_claim('app_role'::text) AS get_jwt_claim) = 'admin'::text) OR (id = ( SELECT auth.uid() AS uid)) OR (company_id = (( SELECT public.get_jwt_claim('company_id'::text) AS get_jwt_claim))::uuid)));


--
-- Name: business_proposals Users can insert own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own proposals" ON public.business_proposals FOR INSERT WITH CHECK ((profile_id = auth.uid()));


--
-- Name: business_proposals Users can update own pending proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pending proposals" ON public.business_proposals FOR UPDATE USING (((profile_id = auth.uid()) AND (status = 'pending'::public.proposal_status)));


--
-- Name: profiles Users can update their own profile; managers/admins can update ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile; managers/admins can update " ON public.profiles FOR UPDATE USING (((public.get_current_claim('app_role'::text) = 'admin'::text) OR (id = auth.uid()) OR ((public.get_current_claim('app_role'::text) = 'manager'::text) AND ((company_id)::text = public.get_current_claim('company_id'::text))))) WITH CHECK (((public.get_current_claim('app_role'::text) = 'admin'::text) OR (id = auth.uid()) OR ((public.get_current_claim('app_role'::text) = 'manager'::text) AND ((company_id)::text = public.get_current_claim('company_id'::text)))));


--
-- Name: business_proposals Users can view own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own proposals" ON public.business_proposals FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: bank_reconciliations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

--
-- Name: bill_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: business_proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: cash_bank_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cash_bank_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: chart_of_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: financial_periods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

--
-- Name: fixed_assets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_voucher_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_voucher_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: journal_vouchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.journal_vouchers ENABLE ROW LEVEL SECURITY;

--
-- Name: log_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.log_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: numbering_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.numbering_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_kyc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_kyc ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_references; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_references ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_bill_line_taxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_bill_line_taxes ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_bill_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_bill_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_bills; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_bills ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_debit_note_line_taxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_debit_note_line_taxes ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_debit_note_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_debit_note_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: purchase_debit_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.purchase_debit_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_credit_note_line_taxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_credit_note_line_taxes ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_credit_note_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_credit_note_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_credit_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_credit_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_invoice_line_taxes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_invoice_line_taxes ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_invoice_lines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_invoice_lines ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_targets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_group_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_group_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: tax_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: tds_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tds_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: tds_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tds_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: warehouses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

