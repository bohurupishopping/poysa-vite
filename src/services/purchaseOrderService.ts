import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrderWithDetails, PurchaseOrderStatus, CreatePurchaseOrderRequest, ConvertToBillResponse } from "@/components/create-purchase-order/types";

export interface PurchaseOrderWithTaxes {
  po_id: string;
  company_id: string;
  supplier_id: string;
  po_number: string;
  order_date: string;
  expected_delivery_date: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  status: PurchaseOrderStatus;
  supplier_name: string;
  line_id: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  tax_id: string;
  tax_rate_id: string;
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
}

export class PurchaseOrderService {
  private static instance: PurchaseOrderService;

  public static getInstance(): PurchaseOrderService {
    if (!PurchaseOrderService.instance) {
      PurchaseOrderService.instance = new PurchaseOrderService();
    }
    return PurchaseOrderService.instance;
  }

  /**
   * Get all purchase orders for a company
   */
  async getPurchaseOrders(companyId: string): Promise<PurchaseOrderWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_lines(
            *,
            products(name),
            purchase_order_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformPurchaseOrderData(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw new Error('Failed to fetch purchase orders');
    }
  }

  /**
   * Get purchase orders with pagination
   */
  async getPurchaseOrdersPaginated(
    companyId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<PurchaseOrderWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_lines(
            *,
            products(name),
            purchase_order_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return this.transformPurchaseOrderData(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders with pagination:', error);
      throw new Error('Failed to fetch purchase orders');
    }
  }

  /**
   * Get a single purchase order by ID
   */
  async getPurchaseOrderById(poId: string): Promise<PurchaseOrderWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name),
          purchase_order_lines(
            *,
            products(name),
            purchase_order_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('id', poId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      const transformed = this.transformPurchaseOrderData([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error fetching purchase order by ID:', error);
      return null;
    }
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(request: CreatePurchaseOrderRequest): Promise<string> {
    try {
      // Create the purchase order
      const { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          company_id: request.company_id,
          supplier_id: request.supplier_id,
          po_number: request.po_number,
          order_date: request.order_date,
          expected_delivery_date: request.expected_delivery_date,
          status: request.status,
          subtotal: request.subtotal,
          total_tax: request.total_tax,
          total_amount: request.total_amount,
          shipping_address: request.shipping_address,
          notes: request.notes,
          terms_and_conditions: request.terms_and_conditions,
        })
        .select('id')
        .single();

      if (poError) throw poError;

      const poId = purchaseOrder.id;

      // Create purchase order lines
      for (const line of request.lines) {
        const { data: poLine, error: lineError } = await supabase
          .from('purchase_order_lines')
          .insert({
            po_id: poId,
            product_id: line.product_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total,
            hsn_sac_code: line.hsn_sac_code,
          })
          .select('id')
          .single();

        if (lineError) throw lineError;

        const lineId = poLine.id;

        // Create line taxes
        if (line.line_taxes.length > 0) {
          const taxData = line.line_taxes.map(tax => ({
            po_line_id: lineId,
            tax_rate_id: tax.tax_rate_id,
            tax_amount: tax.tax_amount,
          }));

          const { error: taxError } = await supabase
            .from('purchase_order_line_taxes')
            .insert(taxData);

          if (taxError) throw taxError;
        }
      }

      return poId;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw new Error('Failed to create purchase order');
    }
  }

  /**
   * Update an existing purchase order
   */
  async updatePurchaseOrder(poId: string, request: Omit<CreatePurchaseOrderRequest, 'company_id'>): Promise<void> {
    try {
      // Update the purchase order
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({
          supplier_id: request.supplier_id,
          po_number: request.po_number,
          order_date: request.order_date,
          expected_delivery_date: request.expected_delivery_date,
          status: request.status,
          subtotal: request.subtotal,
          total_tax: request.total_tax,
          total_amount: request.total_amount,
          shipping_address: request.shipping_address,
          notes: request.notes,
          terms_and_conditions: request.terms_and_conditions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId);

      if (poError) throw poError;

      // Delete existing lines and taxes
      const { data: existingLines, error: linesError } = await supabase
        .from('purchase_order_lines')
        .select('id')
        .eq('po_id', poId);

      if (linesError) throw linesError;

      if (existingLines && existingLines.length > 0) {
        const lineIds = existingLines.map(line => line.id);
        
        // Delete line taxes first
        const { error: taxDeleteError } = await supabase
          .from('purchase_order_line_taxes')
          .delete()
          .in('po_line_id', lineIds);

        if (taxDeleteError) throw taxDeleteError;

        // Delete lines
        const { error: lineDeleteError } = await supabase
          .from('purchase_order_lines')
          .delete()
          .eq('po_id', poId);

        if (lineDeleteError) throw lineDeleteError;
      }

      // Create new lines
      for (const line of request.lines) {
        const { data: poLine, error: lineError } = await supabase
          .from('purchase_order_lines')
          .insert({
            po_id: poId,
            product_id: line.product_id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total,
            hsn_sac_code: line.hsn_sac_code,
          })
          .select('id')
          .single();

        if (lineError) throw lineError;

        const lineId = poLine.id;

        // Create line taxes
        if (line.line_taxes.length > 0) {
          const taxData = line.line_taxes.map(tax => ({
            po_line_id: lineId,
            tax_rate_id: tax.tax_rate_id,
            tax_amount: tax.tax_amount,
          }));

          const { error: taxError } = await supabase
            .from('purchase_order_line_taxes')
            .insert(taxData);

          if (taxError) throw taxError;
        }
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw new Error('Failed to update purchase order');
    }
  }

  /**
   * Delete a purchase order
   */
  async deletePurchaseOrder(poId: string): Promise<void> {
    try {
      // Get line IDs first
      const { data: lines, error: linesError } = await supabase
        .from('purchase_order_lines')
        .select('id')
        .eq('po_id', poId);

      if (linesError) throw linesError;

      if (lines && lines.length > 0) {
        const lineIds = lines.map(line => line.id);
        
        // Delete line taxes first
        const { error: taxDeleteError } = await supabase
          .from('purchase_order_line_taxes')
          .delete()
          .in('po_line_id', lineIds);

        if (taxDeleteError) throw taxDeleteError;
      }

      // Delete lines
      const { error: lineDeleteError } = await supabase
        .from('purchase_order_lines')
        .delete()
        .eq('po_id', poId);

      if (lineDeleteError) throw lineDeleteError;

      // Delete the purchase order
      const { error: poDeleteError } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (poDeleteError) throw poDeleteError;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw new Error('Failed to delete purchase order');
    }
  }

  /**
   * Update purchase order status
   */
  async updatePurchaseOrderStatus(poId: string, status: PurchaseOrderStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', poId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw new Error('Failed to update purchase order status');
    }
  }

  /**
   * Generate next purchase order number
   */
  async generatePurchaseOrderNumber(companyId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generate_next_document_number', {
          p_company_id: companyId,
          p_document_type: 'PURCHASE_ORDER',
          p_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error generating purchase order number:', error);
        // Fallback to timestamp format
        return `PO-${Date.now()}`;
      }

      return data;
    } catch (error) {
      console.error('Error calling generate_next_document_number:', error);
      // Fallback to timestamp format
      return `PO-${Date.now()}`;
    }
  }

  /**
   * Convert purchase order to bill
   */
  async convertToBill(poId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_bill_from_po' as any, {
          p_po_id: poId
        });

      if (error) throw error;

      if (!data || !(data as any).bill_id) {
        throw new Error('Failed to create bill from purchase order');
      }

      return (data as any).bill_id;
    } catch (error) {
      console.error('Error converting purchase order to bill:', error);
      throw new Error('Failed to convert purchase order to bill');
    }
  }

  /**
   * Transform raw purchase order data to PurchaseOrderWithDetails format
   */
  private transformPurchaseOrderData(rawData: any[]): PurchaseOrderWithDetails[] {
    return rawData.map(po => {
      const lines = (po.purchase_order_lines || []).map((line: any) => {
        const taxes = (line.purchase_order_line_taxes || []).map((tax: any) => ({
          id: tax.id,
          po_line_id: tax.po_line_id,
          tax_rate_id: tax.tax_rate_id,
          tax_amount: tax.tax_amount,
        }));

        // Calculate tax amounts for the line
        let igst_amount = 0;
        let cgst_amount = 0;
        let sgst_amount = 0;
        let total_tax_amount = 0;

        taxes.forEach((tax: any) => {
          const taxRate = tax.tax_rate?.rate || 0;
          const taxAmount = tax.tax_amount || 0;
          total_tax_amount += taxAmount;

          // Simple tax classification - in real implementation, 
          // you'd need to determine IGST vs CGST/SGST based on state
          if (taxRate >= 18) {
            igst_amount += taxAmount;
          } else {
            cgst_amount += taxAmount / 2;
            sgst_amount += taxAmount / 2;
          }
        });

        return {
          id: line.id,
          product_id: line.product_id || '',
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          hsn_sac_code: line.hsn_sac_code || '',
          line_total: line.line_total,
          igst_rate: igst_amount > 0 ? 18 : 0, // Simplified
          igst_amount,
          cgst_rate: cgst_amount > 0 ? 9 : 0, // Simplified
          cgst_amount,
          sgst_rate: sgst_amount > 0 ? 9 : 0, // Simplified
          sgst_amount,
          total_tax_amount,
        };
      });

      // Calculate total tax components from lines
      const total_igst = lines.reduce((sum, line) => sum + line.igst_amount, 0);
      const total_cgst = lines.reduce((sum, line) => sum + line.cgst_amount, 0);
      const total_sgst = lines.reduce((sum, line) => sum + line.sgst_amount, 0);

      return {
        id: po.id,
        company_id: po.company_id,
        supplier_id: po.supplier_id,
        po_number: po.po_number,
        order_date: po.order_date,
        expected_delivery_date: po.expected_delivery_date,
        status: po.status,
        subtotal: po.subtotal,
        total_igst,
        total_cgst,
        total_sgst,
        total_tax: po.total_tax,
        total_amount: po.total_amount,
        shipping_address: po.shipping_address,
        delivery_address: po.delivery_address,
        company_state: po.company_state,
        notes: po.notes,
        terms_and_conditions: po.terms_and_conditions,
        created_at: po.created_at,
        updated_at: po.updated_at,
        supplier_name: po.suppliers?.name || 'Unknown Supplier',
        lines,
      };
    });
  }
}
