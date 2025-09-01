export interface InvoiceLine {
    id: string;
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    hsn_sac_code: string;
    line_total: number;
    igst_rate: number;
    igst_amount: number;
    cgst_rate: number;
    cgst_amount: number;
    sgst_rate: number;
    sgst_amount: number;
    total_tax_amount: number;
}

export interface InvoiceData {
    customer_id: string;
    invoice_date: string;
    due_date: string;
    place_of_supply: string;
    company_state: string;
    notes?: string;
    gstr1_invoice_type?: string;
    lines: InvoiceLine[];
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
}
