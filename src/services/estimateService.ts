import { supabase } from "@/integrations/supabase/client";
import { EstimateWithDetails, EstimateStatus, CreateEstimateRequest } from "@/components/create-estimate/types";

export interface EstimateWithTaxes {
  estimate_id: string;
  company_id: string;
  customer_id: string;
  estimate_number: string;
  estimate_date: string;
  expiry_date: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  status: EstimateStatus;
  customer_name: string;
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

export class EstimateService {
  private static instance: EstimateService;

  public static getInstance(): EstimateService {
    if (!EstimateService.instance) {
      EstimateService.instance = new EstimateService();
    }
    return EstimateService.instance;
  }

  /**
   * Get all estimates for a company
   */
  async getEstimates(companyId: string): Promise<EstimateWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          customers(name),
          estimate_lines(
            *,
            products(name),
            estimate_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformEstimateData(data || []);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      throw new Error('Failed to fetch estimates');
    }
  }

  /**
   * Get estimates with pagination
   */
  async getEstimatesPaginated(
    companyId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<EstimateWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          customers(name),
          estimate_lines(
            *,
            products(name),
            estimate_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return this.transformEstimateData(data || []);
    } catch (error) {
      console.error('Error fetching estimates with pagination:', error);
      throw new Error('Failed to fetch estimates');
    }
  }

  /**
   * Get a single estimate by ID
   */
  async getEstimateById(estimateId: string): Promise<EstimateWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          *,
          customers(name),
          estimate_lines(
            *,
            products(name),
            estimate_line_taxes(
              *,
              tax_rates(name, rate)
            )
          )
        `)
        .eq('id', estimateId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      const transformed = this.transformEstimateData([data]);
      return transformed[0] || null;
    } catch (error) {
      console.error('Error fetching estimate by ID:', error);
      return null;
    }
  }

  /**
   * Create a new estimate
   */
  async createEstimate(request: CreateEstimateRequest): Promise<string> {
    try {
      // Create the estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('estimates')
        .insert({
          company_id: request.company_id,
          customer_id: request.customer_id,
          estimate_number: request.estimate_number,
          estimate_date: request.estimate_date,
          expiry_date: request.expiry_date,
          status: request.status as any,
          subtotal: request.subtotal,
          total_tax: request.total_tax,
          total_amount: request.total_amount,
          notes: request.notes,
          terms_and_conditions: request.terms_and_conditions,
        })
        .select('id')
        .single();

      if (estimateError) throw estimateError;

      const estimateId = estimate.id;

      // Create estimate lines
      for (const line of request.lines) {
        const { data: estimateLine, error: lineError } = await supabase
          .from('estimate_lines')
          .insert({
            estimate_id: estimateId,
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

        const lineId = estimateLine.id;

        // Create line taxes
        if (line.line_taxes.length > 0) {
          const taxData = line.line_taxes.map(tax => ({
            estimate_line_id: lineId,
            tax_rate_id: tax.tax_rate_id,
            tax_amount: tax.tax_amount,
          }));

          const { error: taxError } = await supabase
            .from('estimate_line_taxes')
            .insert(taxData);

          if (taxError) throw taxError;
        }
      }

      return estimateId;
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw new Error('Failed to create estimate');
    }
  }

  /**
   * Update an existing estimate
   */
  async updateEstimate(estimateId: string, request: Omit<CreateEstimateRequest, 'company_id'>): Promise<void> {
    try {
      // Update the estimate
      const { error: estimateError } = await supabase
        .from('estimates')
        .update({
          customer_id: request.customer_id,
          estimate_number: request.estimate_number,
          estimate_date: request.estimate_date,
          expiry_date: request.expiry_date,
          status: request.status as any,
          subtotal: request.subtotal,
          total_tax: request.total_tax,
          total_amount: request.total_amount,
          notes: request.notes,
          terms_and_conditions: request.terms_and_conditions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId);

      if (estimateError) throw estimateError;

      // Delete existing lines and taxes
      const { data: existingLines, error: linesError } = await supabase
        .from('estimate_lines')
        .select('id')
        .eq('estimate_id', estimateId);

      if (linesError) throw linesError;

      if (existingLines && existingLines.length > 0) {
        const lineIds = existingLines.map(line => line.id);
        
        // Delete line taxes first
        const { error: taxDeleteError } = await supabase
          .from('estimate_line_taxes')
          .delete()
          .in('estimate_line_id', lineIds);

        if (taxDeleteError) throw taxDeleteError;

        // Delete lines
        const { error: lineDeleteError } = await supabase
          .from('estimate_lines')
          .delete()
          .eq('estimate_id', estimateId);

        if (lineDeleteError) throw lineDeleteError;
      }

      // Create new lines
      for (const line of request.lines) {
        const { data: estimateLine, error: lineError } = await supabase
          .from('estimate_lines')
          .insert({
            estimate_id: estimateId,
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

        const lineId = estimateLine.id;

        // Create line taxes
        if (line.line_taxes.length > 0) {
          const taxData = line.line_taxes.map(tax => ({
            estimate_line_id: lineId,
            tax_rate_id: tax.tax_rate_id,
            tax_amount: tax.tax_amount,
          }));

          const { error: taxError } = await supabase
            .from('estimate_line_taxes')
            .insert(taxData);

          if (taxError) throw taxError;
        }
      }
    } catch (error) {
      console.error('Error updating estimate:', error);
      throw new Error('Failed to update estimate');
    }
  }

  /**
   * Delete an estimate
   */
  async deleteEstimate(estimateId: string): Promise<void> {
    try {
      // Get line IDs first
      const { data: lines, error: linesError } = await supabase
        .from('estimate_lines')
        .select('id')
        .eq('estimate_id', estimateId);

      if (linesError) throw linesError;

      if (lines && lines.length > 0) {
        const lineIds = lines.map(line => line.id);
        
        // Delete line taxes first
        const { error: taxDeleteError } = await supabase
          .from('estimate_line_taxes')
          .delete()
          .in('estimate_line_id', lineIds);

        if (taxDeleteError) throw taxDeleteError;
      }

      // Delete lines
      const { error: lineDeleteError } = await supabase
        .from('estimate_lines')
        .delete()
        .eq('estimate_id', estimateId);

      if (lineDeleteError) throw lineDeleteError;

      // Delete the estimate
      const { error: estimateDeleteError } = await supabase
        .from('estimates')
        .delete()
        .eq('id', estimateId);

      if (estimateDeleteError) throw estimateDeleteError;
    } catch (error) {
      console.error('Error deleting estimate:', error);
      throw new Error('Failed to delete estimate');
    }
  }

  /**
   * Update estimate status
   */
  async updateEstimateStatus(estimateId: string, status: EstimateStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('estimates')
        .update({
          status: status as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating estimate status:', error);
      throw new Error('Failed to update estimate status');
    }
  }

  /**
   * Generate next estimate number
   */
  async generateEstimateNumber(companyId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generate_next_document_number', {
          p_company_id: companyId,
          p_document_type: 'ESTIMATE',
          p_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error generating estimate number:', error);
        // Fallback to timestamp format
        return `EST-${Date.now()}`;
      }

      return data;
    } catch (error) {
      console.error('Error calling generate_next_document_number:', error);
      // Fallback to timestamp format
      return `EST-${Date.now()}`;
    }
  }

  /**
   * Convert estimate to invoice
   */
  async convertToInvoice(estimateId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_invoice_from_estimate' as any, {
          p_estimate_id: estimateId
        });

      if (error) throw error;

      if (!data || !(data as any).invoice_id) {
        throw new Error('Failed to create invoice from estimate');
      }

      return (data as any).invoice_id;
    } catch (error) {
      console.error('Error converting estimate to invoice:', error);
      throw new Error('Failed to convert estimate to invoice');
    }
  }

  /**
   * Transform raw estimate data to EstimateWithDetails format
   */
  private transformEstimateData(rawData: any[]): EstimateWithDetails[] {
    return rawData.map(estimate => {
      const lines = (estimate.estimate_lines || []).map((line: any) => {
        const taxes = (line.estimate_line_taxes || []).map((tax: any) => ({
          id: tax.id,
          estimate_line_id: tax.estimate_line_id,
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
        id: estimate.id,
        company_id: estimate.company_id,
        customer_id: estimate.customer_id,
        estimate_number: estimate.estimate_number,
        estimate_date: estimate.estimate_date,
        expiry_date: estimate.expiry_date,
        place_of_supply: estimate.place_of_supply,
        status: estimate.status,
        subtotal: estimate.subtotal,
        total_igst,
        total_cgst,
        total_sgst,
        total_tax: estimate.total_tax,
        total_amount: estimate.total_amount,
        notes: estimate.notes,
        terms_and_conditions: estimate.terms_and_conditions,
        created_at: estimate.created_at,
        updated_at: estimate.updated_at,
        customer_name: estimate.customers?.name || 'Unknown Customer',
        lines,
      };
    });
  }
}
