CREATE OR REPLACE FUNCTION public.create_invoice_from_estimate(p_estimate_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_estimate RECORD;
    v_new_invoice_id UUID;
    v_line RECORD;
    v_tax RECORD;
    v_new_line_id UUID;
    v_invoice_number TEXT;
BEGIN
    -- Step 1: Lock the estimate row and validate its status
    SELECT * INTO v_estimate
    FROM public.estimates
    WHERE id = p_estimate_id
    FOR UPDATE; -- Lock the row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estimate with ID % not found.', p_estimate_id;
    END IF;

    -- Using your stricter business rule for status validation
    IF v_estimate.status NOT IN ('accepted') THEN
        RAISE EXCEPTION 'Cannot create an invoice from an estimate with status: %', v_estimate.status;
    END IF;

    -- Step 2: Generate a new, unique invoice number
    v_invoice_number := public.generate_next_document_number(v_estimate.company_id, 'SALES_INVOICE', v_estimate.estimate_date);

    -- Step 3: Create the Sales Invoice header with 'draft' status
    INSERT INTO public.sales_invoices (
        company_id,
        customer_id,
        invoice_number,
        invoice_date,
        due_date,
        subtotal,
        total_tax,
        total_amount,
        status,
        place_of_supply, -- <<<< THIS IS THE ONLY MODIFIED LINE
        source_estimate_id
    ) VALUES (
        v_estimate.company_id,
        v_estimate.customer_id,
        v_invoice_number,
        v_estimate.estimate_date,
        v_estimate.estimate_date + INTERVAL '30 days',
        v_estimate.subtotal,
        v_estimate.total_tax,
        v_estimate.total_amount,
        'draft',
        -- THE FIX: Use COALESCE to check for 'place_of_supply' first, then fall back to 'state'
        (SELECT COALESCE(details->>'place_of_supply', details->>'state') FROM public.customers WHERE id = v_estimate.customer_id),
        p_estimate_id
    ) RETURNING id INTO v_new_invoice_id;

    -- Step 4: Loop through each estimate line and its taxes, and copy them to the new invoice
    FOR v_line IN
        SELECT * FROM public.estimate_lines WHERE estimate_id = p_estimate_id
    LOOP
        INSERT INTO public.sales_invoice_lines (
            invoice_id,
            product_id,
            description,
            quantity,
            unit_price,
            line_total,
            hsn_sac_code
        ) VALUES (
            v_new_invoice_id,
            v_line.product_id,
            v_line.description,
            v_line.quantity,
            v_line.unit_price,
            v_line.line_total,
            v_line.hsn_sac_code
        ) RETURNING id INTO v_new_line_id;

        -- Copy taxes for this line
        FOR v_tax IN
            SELECT * FROM public.estimate_line_taxes WHERE estimate_line_id = v_line.id
        LOOP
            INSERT INTO public.sales_invoice_line_taxes (
                invoice_line_id,
                tax_rate_id,
                tax_amount
            ) VALUES (
                v_new_line_id,
                v_tax.tax_rate_id,
                v_tax.tax_amount
            );
        END LOOP;
    END LOOP;

    -- Step 5: Update the source estimate's status to 'invoiced'
    UPDATE public.estimates
    SET status = 'invoiced', updated_at = NOW()
    WHERE id = p_estimate_id;

    -- Step 6: Finalize the invoice by changing its status to 'sent'
    -- This will trigger any existing invoice triggers for journal entries
    UPDATE public.sales_invoices
    SET status = 'sent'
    WHERE id = v_new_invoice_id;

    -- Step 7: Return the ID of the newly created invoice
    RETURN json_build_object('invoice_id', v_new_invoice_id);
END;
$$;