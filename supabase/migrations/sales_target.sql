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