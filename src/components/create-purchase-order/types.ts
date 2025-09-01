export interface PurchaseOrderLine {
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

export interface PurchaseOrderData {
    supplier_id: string;
    order_date: string;
    expected_delivery_date?: string;
    shipping_address?: string;
    delivery_address?: string;
    company_state?: string;
    supplier_state?: string;
    notes?: string;
    terms_and_conditions?: string;
    lines: PurchaseOrderLine[];
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'approved' | 'closed' | 'cancelled';

export interface PurchaseOrderWithDetails {
    id: string;
    company_id: string;
    supplier_id: string;
    po_number: string;
    order_date: string;
    expected_delivery_date?: string;
    status: PurchaseOrderStatus;
    subtotal: number;
    total_igst: number;
    total_cgst: number;
    total_sgst: number;
    total_tax: number;
    total_amount: number;
    shipping_address?: string;
    delivery_address?: string;
    company_state?: string;
    notes?: string;
    terms_and_conditions?: string;
    created_at: string;
    updated_at: string;
    supplier_name?: string;
    lines: PurchaseOrderLine[];
}

export interface PurchaseOrderLineTax {
    id: string;
    po_line_id: string;
    tax_rate_id: string;
    tax_amount: number;
}

export interface CreatePurchaseOrderRequest {
    company_id: string;
    supplier_id: string;
    po_number: string;
    order_date: string;
    expected_delivery_date?: string;
    status: PurchaseOrderStatus;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    shipping_address?: string;
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

export interface UpdatePurchaseOrderRequest extends Partial<CreatePurchaseOrderRequest> {
    id: string;
}

export interface ConvertToBillRequest {
    po_id: string;
}

export interface ConvertToBillResponse {
    bill_id: string;
}
