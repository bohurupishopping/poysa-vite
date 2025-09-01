export interface EstimateLine {
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

export interface EstimateData {
    customer_id: string;
    estimate_date: string;
    expiry_date?: string;
    place_of_supply: string;
    company_state: string;
    notes?: string;
    terms_and_conditions?: string;
    lines: EstimateLine[];
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
}

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced' | 'expired';

export interface EstimateWithDetails {
    id: string;
    company_id: string;
    customer_id: string;
    estimate_number: string;
    estimate_date: string;
    expiry_date?: string;
    place_of_supply?: string;
    status: EstimateStatus;
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
    notes?: string;
    terms_and_conditions?: string;
    created_at: string;
    updated_at: string;
    customer_name?: string;
    lines: EstimateLine[];
}

export interface EstimateLineTax {
    id: string;
    estimate_line_id: string;
    tax_rate_id: string;
    tax_amount: number;
}

export interface CreateEstimateRequest {
    company_id: string;
    customer_id: string;
    estimate_number: string;
    estimate_date: string;
    expiry_date?: string;
    status: EstimateStatus;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    notes?: string;
    terms_and_conditions?: string;
    lines: {
        product_id?: string;
        description: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        hsn_sac_code?: string;
        line_taxes: {
            tax_rate_id: string;
            tax_amount: number;
        }[];
    }[];
}
