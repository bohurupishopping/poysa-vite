export interface BillLine {
    id: string;
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number; // This will be the cost from the supplier's bill
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

export interface BillData {
    supplier_id: string;
    bill_number: string;
    bill_date: string;
    due_date: string;
    place_of_supply: string;
    company_state: string; // Assuming the company's state is needed for tax calculation context
    notes?: string;
    lines: BillLine[];
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
    status: 'draft' | 'submitted'; // To handle draft and submitted states
}
