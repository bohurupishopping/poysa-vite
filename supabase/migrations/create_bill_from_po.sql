CREATE OR REPLACE FUNCTION public.create_bill_from_po(p_po_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_po RECORD;
    v_new_bill_id UUID;
    v_line RECORD;
    v_tax RECORD;
    v_new_line_id UUID;
    v_bill_number TEXT;
BEGIN
    -- Step 1: Lock the purchase order row and validate its status
    SELECT * INTO v_po
    FROM public.purchase_orders
    WHERE id = p_po_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase Order with ID % not found.', p_po_id;
    END IF;

    IF v_po.status NOT IN ('sent', 'approved') THEN
        RAISE EXCEPTION 'Cannot create a bill from a purchase order with status: %', v_po.status;
    END IF;

    -- Step 2: Generate a new, unique bill number
    v_bill_number := public.generate_next_document_number(v_po.company_id, 'PURCHASE_BILL', v_po.order_date);

    -- Step 3: Create the Purchase Bill header with 'draft' status
    INSERT INTO public.purchase_bills (
        company_id,
        supplier_id,
        bill_number,
        bill_date,
        due_date,
        subtotal,
        total_tax,
        total_amount,
        status,
        place_of_supply, -- <<<< FIX IS HERE
        source_po_id
    ) VALUES (
        v_po.company_id,
        v_po.supplier_id,
        v_bill_number,
        v_po.order_date,
        v_po.order_date + INTERVAL '30 days',
        v_po.subtotal,
        v_po.total_tax,
        v_po.total_amount,
        'draft',
        -- THE FIX: Use COALESCE to check for 'place_of_supply' first, then fall back to 'state'
        (SELECT COALESCE(details->>'place_of_supply', details->>'state') FROM public.suppliers WHERE id = v_po.supplier_id),
        p_po_id
    ) RETURNING id INTO v_new_bill_id;

    -- Step 4: Loop through each PO line and its taxes
    FOR v_line IN
        SELECT * FROM public.purchase_order_lines WHERE po_id = p_po_id
    LOOP
        INSERT INTO public.purchase_bill_lines (
            bill_id, product_id, description, quantity, unit_price, line_total, hsn_sac_code
        ) VALUES (
            v_new_bill_id, v_line.product_id, v_line.description, v_line.quantity, v_line.unit_price, v_line.line_total, v_line.hsn_sac_code
        ) RETURNING id INTO v_new_line_id;

        FOR v_tax IN
            SELECT * FROM public.purchase_order_line_taxes WHERE po_line_id = v_line.id
        LOOP
            INSERT INTO public.purchase_bill_line_taxes (
                bill_line_id, tax_rate_id, tax_amount
            ) VALUES (
                v_new_line_id, v_tax.tax_rate_id, v_tax.tax_amount
            );
        END LOOP;
    END LOOP;

    -- Step 5: Update the source purchase order's status to 'closed'
    UPDATE public.purchase_orders
    SET status = 'closed', updated_at = NOW()
    WHERE id = p_po_id;

    -- Step 6: Finalize the bill by changing its status to 'submitted'
    UPDATE public.purchase_bills
    SET status = 'submitted'
    WHERE id = v_new_bill_id;

    -- Step 7: Return the ID of the newly created bill
    RETURN json_build_object('bill_id', v_new_bill_id);
END;
$$;