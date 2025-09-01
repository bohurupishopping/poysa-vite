-- Statuses for the customer-facing sales process (Estimates)
CREATE TYPE public.estimate_status AS ENUM (
    'draft',          -- Still being prepared, not sent to the customer.
    'sent',           -- Sent to the customer, awaiting response.
    'accepted',       -- Customer has approved the estimate.
    'declined',       -- Customer has rejected the estimate.
    'invoiced',       -- An invoice has been generated from this estimate.
    'expired'         -- The estimate has passed its expiry date.
);

-- Statuses for the supplier-facing procurement process (Purchase Orders)
CREATE TYPE public.po_status AS ENUM (
    'draft',          -- Still being prepared, not sent to the supplier.
    'sent',           -- Sent to the supplier, awaiting confirmation.
    'approved',       -- PO is approved internally and ready for action.
    'closed',         -- The order is complete (fully received and billed).
    'cancelled'       -- The order has been cancelled.
);

-- The Estimates (or Quotations) Table
CREATE TABLE public.estimates (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    estimate_number text NOT NULL,
    estimate_date date NOT NULL DEFAULT CURRENT_DATE,
    expiry_date date,
    status public.estimate_status DEFAULT 'draft'::public.estimate_status NOT NULL,
    subtotal numeric(12, 2) NOT NULL,
    total_tax numeric(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    notes text,
    terms_and_conditions text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT estimate_number_unique_per_company UNIQUE (company_id, estimate_number),
    CONSTRAINT estimate_amounts_check CHECK (total_amount = subtotal + total_tax AND subtotal >= 0)
);

-- The Purchase Orders Table
CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    po_number text NOT NULL,
    order_date date NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date date,
    status public.po_status DEFAULT 'draft'::public.po_status NOT NULL,
    subtotal numeric(12, 2) NOT NULL,
    total_tax numeric(12, 2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    shipping_address text,
    notes text,
    terms_and_conditions text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT po_number_unique_per_company UNIQUE (company_id, po_number),
    CONSTRAINT po_amounts_check CHECK (total_amount = subtotal + total_tax AND subtotal >= 0)
);

-- Lines for Estimates
CREATE TABLE public.estimate_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
    description text NOT NULL,
    quantity numeric(10, 2) NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    line_total numeric(12, 2) NOT NULL,
    hsn_sac_code text
);

-- Taxes for Estimate Lines
CREATE TABLE public.estimate_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    estimate_line_id uuid NOT NULL REFERENCES public.estimate_lines(id) ON DELETE CASCADE,
    tax_rate_id uuid NOT NULL REFERENCES public.tax_rates(id) ON DELETE RESTRICT,
    tax_amount numeric(12, 2) DEFAULT 0.00 NOT NULL
);

-- Lines for Purchase Orders
CREATE TABLE public.purchase_order_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
    description text NOT NULL,
    quantity numeric(10, 2) NOT NULL,
    unit_price numeric(12, 2) NOT NULL,
    line_total numeric(12, 2) NOT NULL,
    hsn_sac_code text
);

-- Taxes for Purchase Order Lines
CREATE TABLE public.purchase_order_line_taxes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    po_line_id uuid NOT NULL REFERENCES public.purchase_order_lines(id) ON DELETE CASCADE,
    tax_rate_id uuid NOT NULL REFERENCES public.tax_rates(id) ON DELETE RESTRICT,
    tax_amount numeric(12, 2) DEFAULT 0.00 NOT NULL
);

-- Add a link from the sales invoice back to its source estimate
ALTER TABLE public.sales_invoices
ADD COLUMN source_estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL;

-- Add a link from the purchase bill back to its source purchase order
ALTER TABLE public.purchase_bills
ADD COLUMN source_po_id uuid REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- NOTE: In PostgreSQL, you cannot add to an ENUM within a transaction.
-- This command should be run separately.
ALTER TYPE public.document_type ADD VALUE 'ESTIMATE';
ALTER TYPE public.document_type ADD VALUE 'PURCHASE_ORDER';

-- Step 6: Implement Row-Level Security (RLS) -- CORRECTED VERSION

-- Enable RLS on all new tables
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_line_taxes ENABLE ROW LEVEL SECURITY;

-- Create policies for header tables
CREATE POLICY "Admin and Manager Access Policy" ON public.estimates FOR ALL
USING ((( SELECT get_jwt_claim('app_role')) = 'admin' ) OR ( company_id = ((SELECT get_jwt_claim('company_id')))::uuid ));

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_orders FOR ALL
USING ((( SELECT get_jwt_claim('app_role')) = 'admin' ) OR ( company_id = ((SELECT get_jwt_claim('company_id')))::uuid ));

-- Create policies for line item tables (access is derived from the header)
CREATE POLICY "Admin and Manager Access Policy" ON public.estimate_lines FOR ALL
USING (
  ( (SELECT get_jwt_claim('app_role')) = 'admin' ) OR
  ( EXISTS (
      SELECT 1 FROM public.estimates e
      WHERE e.id = estimate_lines.estimate_id
      AND e.company_id = ((SELECT get_jwt_claim('company_id')))::uuid
  ))
);

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_order_lines FOR ALL
USING (
  ( (SELECT get_jwt_claim('app_role')) = 'admin' ) OR
  ( EXISTS (
      SELECT 1 FROM public.purchase_orders po
      WHERE po.id = purchase_order_lines.po_id
      AND po.company_id = ((SELECT get_jwt_claim('company_id')))::uuid
  ))
);

-- Policies for tax line tables are two levels deep, but follow the same pattern
CREATE POLICY "Admin and Manager Access Policy" ON public.estimate_line_taxes FOR ALL
USING (
  ( (SELECT get_jwt_claim('app_role')) = 'admin' ) OR
  ( EXISTS (
      SELECT 1 FROM public.estimate_lines el
      JOIN public.estimates e ON el.estimate_id = e.id
      WHERE el.id = estimate_line_taxes.estimate_line_id
      AND e.company_id = ((SELECT get_jwt_claim('company_id')))::uuid
  ))
);

CREATE POLICY "Admin and Manager Access Policy" ON public.purchase_order_line_taxes FOR ALL
USING (
  ( (SELECT get_jwt_claim('app_role')) = 'admin' ) OR
  ( EXISTS (
      SELECT 1 FROM public.purchase_order_lines pol
      JOIN public.purchase_orders po ON pol.po_id = po.id
      WHERE pol.id = purchase_order_line_taxes.po_line_id
      AND po.company_id = ((SELECT get_jwt_claim('company_id')))::uuid
  ))
);