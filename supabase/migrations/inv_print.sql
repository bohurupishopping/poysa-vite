CREATE OR REPLACE FUNCTION public.get_invoice_print_details(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT
        jsonb_build_object(
            'id', si.id,
            'invoice_number', si.invoice_number,
            'invoice_date', si.invoice_date,
            'due_date', si.due_date,
            'subtotal', si.subtotal,
            'total_tax', si.total_tax,
            'total_amount', si.total_amount,
            'amount_paid', si.amount_paid,
            'status', si.status,
            'place_of_supply', si.place_of_supply,
            
            -- Company (Seller) Details
            'company', jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'address_line_1', c.address_line_1,
                'city', c.city,
                'state_province', c.state_province,
                'postal_code', c.postal_code,
                'gstin', c.gstin,
                'pan_number', c.pan_number,
                'phone', c.phone,
                'email', c.email,
                'website', c.website
            ),
            
            -- Customer (Buyer) Details - Unpacks the JSONB correctly
            'customer', jsonb_build_object(
                'id', cust.id,
                'name', cust.name,
                'details', cust.details -- Pass the full JSONB details object
            ),
            
            -- Line Items with nested Taxes
            'lines', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', sil.id,
                        'description', sil.description,
                        'quantity', sil.quantity,
                        'unit_price', sil.unit_price,
                        'line_total', sil.line_total,
                        'hsn_sac_code', sil.hsn_sac_code, -- Key field for HSN
                        'product', jsonb_build_object(
                            'name', p.name,
                            'type', p.type
                        ),
                        'taxes', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'tax_amount', silt.tax_amount,
                                    'tax_rate', jsonb_build_object(
                                        'name', tr.name,
                                        'rate', tr.rate
                                    )
                                )
                            )
                            FROM public.sales_invoice_line_taxes silt
                            JOIN public.tax_rates tr ON silt.tax_rate_id = tr.id
                            WHERE silt.invoice_line_id = sil.id
                        )
                    )
                )
                FROM public.sales_invoice_lines sil
                LEFT JOIN public.products p ON sil.product_id = p.id
                WHERE sil.invoice_id = si.id
            ),

            -- Payments
            'payments', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'payment_date', ip.payment_date,
                        'amount', ip.amount,
                        'method', ip.method
                    )
                )
                FROM public.invoice_payments ip
                WHERE ip.invoice_id = si.id
            )
        )
    INTO
        v_result
    FROM
        public.sales_invoices si
    JOIN
        public.companies c ON si.company_id = c.id
    JOIN
        public.customers cust ON si.customer_id = cust.id
    WHERE
        si.id = p_invoice_id;

    RETURN v_result;
END;
$$;