import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface SalesInvoiceLine {
  id: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  hsn_sac_code?: string | null;
  igst_rate: number;
  igst_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  total_tax_amount: number;
}

export interface SalesInvoiceData {
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  place_of_supply?: string;
  notes?: string;
  gstr1_invoice_type?: string;
  lines: SalesInvoiceLine[];
  subtotal: number;
  total_igst: number;
  total_cgst: number;
  total_sgst: number;
  total_tax: number;
  total_amount: number;
}

export interface SalesInvoiceWithTaxes {
  invoice_id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  total_tax: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  customer_name: string;
  line_id: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  hsn_sac_code?: string;
  tax_id: string;
  tax_rate_id: string;
  tax_name: string;
  tax_rate: number;
  tax_amount: number;
  payment_id: string;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  reference_number: string;
  payment_notes: string;
}

export interface PaginatedInvoicesResult {
  invoices: SalesInvoiceWithTaxes[];
  totalCount: number;
  hasMore: boolean;
}

export class SalesInvoiceService {
  private static instance: SalesInvoiceService;

  public static getInstance(): SalesInvoiceService {
    if (!SalesInvoiceService.instance) {
      SalesInvoiceService.instance = new SalesInvoiceService();
    }
    return SalesInvoiceService.instance;
  }

  /**
   * Submit a sales invoice using RPC function with fallback
   */
  async submitInvoice(
    companyId: string,
    customerId: string,
    invoiceNumber: string,
    invoiceDate: string,
    lines: any[],
    existingInvoiceId?: string,
    dueDate?: string,
    placeOfSupply?: string,
    status: 'draft' | 'sent' = 'sent'
  ) {
    try {
      // Use RPC function for atomic transaction
      const { data, error } = await supabase.rpc('submit_sales_invoice', {
        p_company_id: companyId,
        p_customer_id: customerId,
        p_invoice_number: invoiceNumber,
        p_invoice_date: invoiceDate,
        p_lines: lines,
        p_existing_invoice_id: existingInvoiceId,
        p_due_date: dueDate,
        p_place_of_supply: placeOfSupply
      });

      if (error) throw error;

      // Handle JSON response
      const result = data as { invoice_id: string };
      
      // Invalidate dashboard cache for sales transaction
      this.invalidateDashboardCache(companyId);
      
      return result.invoice_id;

    } catch (error) {
      console.error('Error submitting invoice via RPC:', error);
      
      // Fallback to manual implementation if RPC function doesn't exist
      if (error instanceof Error && 
          (error.message.includes('function submit_sales_invoice') || 
           error.message.includes('does not exist'))) {
        return await this.submitInvoiceFallback(
          companyId,
          customerId,
          invoiceNumber,
          invoiceDate,
          lines,
          existingInvoiceId,
          dueDate,
          placeOfSupply,
          status
        );
      }
      
      throw error;
    }
  }

  /**
   * Invalidate dashboard cache for sales transactions
   */
  private invalidateDashboardCache(companyId: string) {
    // This would typically call a cache manager service
    console.log(`Dashboard cache invalidated for sales transaction in company: ${companyId}`);
    // In a real implementation, you would call something like:
    // EnhancedDashboardCacheManager.invalidateOnTransaction('sales', companyId);
  }

  /**
   * Fallback implementation for submitting invoice without RPC
   */
  private async submitInvoiceFallback(
    companyId: string,
    customerId: string,
    invoiceNumber: string,
    invoiceDate: string,
    lines: any[],
    existingInvoiceId?: string,
    dueDate?: string,
    placeOfSupply?: string,
    status: 'draft' | 'sent' = 'sent'
  ): Promise<string> {
    try {
      // Calculate totals
      const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
      const totalTax = lines.reduce((sum, line) => {
        return sum + (line.line_taxes?.reduce((taxSum, tax) => taxSum + tax.tax_amount, 0) || 0);
      }, 0);
      const totalAmount = subtotal + totalTax;

      let invoiceId: string;

      if (existingInvoiceId) {
        // Update existing invoice as draft
        const { error: updateError } = await supabase
          .from('sales_invoices')
          .update({
            customer_id: customerId,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate,
            due_date: dueDate,
            subtotal: subtotal,
            total_tax: totalTax,
            total_amount: totalAmount,
            status: 'draft',
            place_of_supply: placeOfSupply,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvoiceId)
          .eq('company_id', companyId);

        if (updateError) throw updateError;
        invoiceId = existingInvoiceId;

        // Delete existing lines
        await supabase
          .from('sales_invoice_lines')
          .delete()
          .eq('invoice_id', invoiceId);

      } else {
        // Create new invoice as draft
        const { data: invoiceResult, error: insertError } = await supabase
          .from('sales_invoices')
          .insert({
            company_id: companyId,
            customer_id: customerId,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate,
            due_date: dueDate,
            subtotal: subtotal,
            total_tax: totalTax,
            total_amount: totalAmount,
            status: 'draft',
            place_of_supply: placeOfSupply
          })
          .select()
          .single();

        if (insertError) throw insertError;
        invoiceId = invoiceResult.id;
      }

      // Insert line items
      if (lines.length > 0) {
        const lineInsertData = lines.map(line => ({
          invoice_id: invoiceId,
          product_id: line.product_id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          line_total: line.line_total,
          hsn_sac_code: line.hsn_sac_code,
        }));

        const { data: insertedLines, error: linesError } = await supabase
          .from('sales_invoice_lines')
          .insert(lineInsertData)
          .select();

        if (linesError) throw linesError;

        // Insert line taxes
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const insertedLineId = insertedLines[i].id;

          if (line.line_taxes && line.line_taxes.length > 0) {
            const taxInsertData = line.line_taxes.map((tax: any) => ({
              invoice_line_id: insertedLineId,
              tax_rate_id: tax.tax_rate_id,
              tax_amount: tax.tax_amount,
            }));

            // Use raw SQL for inserting into sales_invoice_line_taxes since it's not in TypeScript types
            const { error: taxError } = await supabase
              .from('sales_invoice_line_taxes' as any)
              .insert(taxInsertData);

            if (taxError) throw taxError;
          }
        }
      }

      // Update status to 'sent' to trigger accounting & inventory
      const { error: statusError } = await supabase
        .from('sales_invoices')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (statusError) throw statusError;

      return invoiceId;

    } catch (error) {
      console.error('Error in invoice fallback:', error);
      throw new Error('Failed to submit invoice using fallback method');
    }
  }

  /**
   * Generate next invoice number
   */
  async generateInvoiceNumber(companyId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('generate_next_document_number', {
          p_company_id: companyId,
          p_document_type: 'SALES_INVOICE',
          p_date: new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to timestamp format
        return `INV-${Date.now()}`;
      }

      return data;

    } catch (error) {
      console.error('Error calling generate_next_document_number:', error);
      // Fallback to timestamp format
      return `INV-${Date.now()}`;
    }
  }

  /**
   * Get tax rates for a company
   */
  async getTaxRates(companyId: string) {
    try {
      const { data: existingRates, error } = await supabase
        .from('tax_rates')
        .select('id, name, rate')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .in('name', ['IGST', 'CGST', 'SGST']);

      if (error) throw error;

      const rates = {
        igst_18: null as string | null,
        cgst_9: null as string | null,
        sgst_9: null as string | null
      };

      existingRates?.forEach(rate => {
        if (rate.name === 'IGST' && rate.rate === 18) {
          rates.igst_18 = rate.id;
        } else if (rate.name === 'CGST' && rate.rate === 9) {
          rates.cgst_9 = rate.id;
        } else if (rate.name === 'SGST' && rate.rate === 9) {
          rates.sgst_9 = rate.id;
        }
      });

      return rates;
    } catch (error) {
      console.error('Error getting tax rates:', error);
      return {
        igst_18: null,
        cgst_9: null,
        sgst_9: null
      };
    }
  }

  /**
   * Get paginated sales invoices with taxes using RPC function
   */
  async getCompanySalesInvoicesWithTaxesPaginated(
    companyId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<PaginatedInvoicesResult> {
    try {
      const { data, error } = await (supabase as any).rpc(
        'get_company_sales_invoices_with_taxes_paginated',
        {
          p_company_id: companyId,
          p_limit: limit,
          p_offset: offset
        }
      );

      if (error) {
        console.error('Error fetching paginated invoices:', error);
        throw error;
      }

      // Get total count for pagination
      const { count: totalCount } = await supabase
        .from('sales_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      const invoices = (data as unknown) as SalesInvoiceWithTaxes[];
      
      return {
        invoices,
        totalCount: totalCount || 0,
        hasMore: totalCount ? offset + limit < totalCount : false
      };

    } catch (error) {
      console.error('Error in getCompanySalesInvoicesWithTaxesPaginated:', error);
      
      // Fallback to manual implementation if RPC function doesn't exist
      if (error instanceof Error && 
          (error.message.includes('function get_company_sales_invoices_with_taxes_paginated') || 
           error.message.includes('does not exist'))) {
        return await this.getInvoicesWithTaxesFallback(companyId, limit, offset);
      }
      
      throw error;
    }
  }

  /**
   * Get a single sales invoice with all details using RPC function
   */
  async getSalesInvoiceWithTaxes(invoiceId: string): Promise<SalesInvoiceWithTaxes[]> {
    try {
      const { data, error } = await (supabase as any).rpc(
        'get_sales_invoice_with_taxes',
        {
          p_invoice_id: invoiceId
        }
      );

      if (error) {
        console.error('Error fetching invoice with taxes:', error);
        throw error;
      }

      return data as SalesInvoiceWithTaxes[];

    } catch (error) {
      console.error('Error in getSalesInvoiceWithTaxes:', error);
      
      // Fallback to manual implementation if RPC function doesn't exist
      if (error instanceof Error && 
          (error.message.includes('function get_sales_invoice_with_taxes') || 
           error.message.includes('does not exist'))) {
        return await this.getSalesInvoiceWithTaxesFallback(invoiceId);
      }
      
      throw error;
    }
  }

  /**
   * Get invoice print details using the new RPC function
   * Returns data in the format expected by PDF generator
   */
  async getInvoicePrintDetails(invoiceId: string): Promise<any> {
    try {
      const { data, error } = await (supabase as any).rpc(
        'get_invoice_print_details',
        {
          p_invoice_id: invoiceId
        }
      );

      if (error) {
        console.error('Error fetching invoice print details:', error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Error in getInvoicePrintDetails:', error);
      
      // Fallback to existing method if new RPC function doesn't exist
      if (error instanceof Error && 
          (error.message.includes('function get_invoice_print_details') || 
           error.message.includes('does not exist'))) {
        console.log('Falling back to getSalesInvoiceWithTaxes');
        const oldData = await this.getSalesInvoiceWithTaxes(invoiceId);
        // Transform old data to match new format (this would need to be implemented)
        return this.transformToPrintFormat(oldData);
      }
      
      throw error;
    }
  }

  /**
   * Transform old invoice data format to new print format
   * This is a fallback if the new RPC function is not available
   */
  private transformToPrintFormat(oldData: SalesInvoiceWithTaxes[]): any {
    if (!oldData || oldData.length === 0) return null;

    const firstRecord = oldData[0];
    
    // Basic transformation - this would need to be more comprehensive
    // to match the exact structure returned by get_invoice_print_details
    return {
      id: firstRecord.invoice_id,
      invoice_number: firstRecord.invoice_number,
      invoice_date: firstRecord.invoice_date,
      due_date: firstRecord.due_date,
      subtotal: firstRecord.subtotal,
      total_tax: firstRecord.total_tax,
      total_amount: firstRecord.total_amount,
      amount_paid: firstRecord.amount_paid,
      status: firstRecord.status,
      place_of_supply: '', // Not available in old format
      company: {
        id: firstRecord.company_id,
        name: '', // Would need to be fetched separately
        address_line_1: '',
        city: '',
        state_province: '',
        postal_code: '',
        gstin: '',
        pan_number: '',
        phone: '',
        email: '',
        website: ''
      },
      customer: {
        id: firstRecord.customer_id,
        name: firstRecord.customer_name,
        details: {}
      },
      lines: [],
      payments: []
    };
  }

  /**
   * Fallback implementation for fetching a single invoice with taxes without RPC
   */
  private async getSalesInvoiceWithTaxesFallback(invoiceId: string): Promise<SalesInvoiceWithTaxes[]> {
    try {
      // First, fetch invoice with basic info and customer details
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      if (!invoice) {
        return [];
      }

      // Fetch line items for the invoice
      const { data: lines, error: linesError } = await supabase
        .from('sales_invoice_lines')
        .select(`
          *,
          product:products(name)
        `)
        .eq('invoice_id', invoiceId);

      if (linesError) throw linesError;

      // Fetch taxes for all line items
      const lineIds = lines?.map(line => line.id) || [];
      const { data: taxes, error: taxesError } = await (supabase as any)
        .from('sales_invoice_line_taxes')
        .select(`
          *,
          tax_rate:tax_rates(name, rate)
        `)
        .in('invoice_line_id', lineIds);

      if (taxesError) throw taxesError;

      // Fetch payments for the invoice
      const { data: payments, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (paymentsError) throw paymentsError;

      // Transform data to match the RPC function structure
      const transformedData: SalesInvoiceWithTaxes[] = [];

      // Add line items with taxes
      lines?.forEach(line => {
        const lineTaxes = taxes?.filter(tax => tax.invoice_line_id === line.id) || [];
        
        // If no taxes for this line, create at least one entry
        if (lineTaxes.length === 0) {
          transformedData.push({
            invoice_id: invoice.id,
            company_id: invoice.company_id,
            customer_id: invoice.customer_id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date || '',
            subtotal: invoice.subtotal,
            total_tax: invoice.total_tax,
            total_amount: invoice.total_amount,
            amount_paid: invoice.amount_paid,
            status: invoice.status,
            customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
            line_id: line.id,
            product_id: line.product_id || '',
            product_name: (line.product as any)?.name || 'Unknown Product',
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total,
            tax_id: '',
            tax_rate_id: '',
            tax_name: '',
            tax_rate: 0,
            tax_amount: 0,
            payment_id: '',
            payment_date: '',
            payment_amount: 0,
            payment_method: '',
            reference_number: '',
            payment_notes: ''
          });
        } else {
          // Create entries for each tax on this line
          lineTaxes.forEach(tax => {
            transformedData.push({
              invoice_id: invoice.id,
              company_id: invoice.company_id,
              customer_id: invoice.customer_id,
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date || '',
              subtotal: invoice.subtotal,
              total_tax: invoice.total_tax,
              total_amount: invoice.total_amount,
              amount_paid: invoice.amount_paid,
              status: invoice.status,
              customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
              line_id: line.id,
              product_id: line.product_id || '',
              product_name: (line.product as any)?.name || 'Unknown Product',
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_total: line.line_total,
              tax_id: tax.id,
              tax_rate_id: tax.tax_rate_id,
              tax_name: (tax.tax_rate as any)?.name || 'Unknown Tax',
              tax_rate: (tax.tax_rate as any)?.rate || 0,
              tax_amount: tax.tax_amount,
              payment_id: '',
              payment_date: '',
              payment_amount: 0,
              payment_method: '',
              reference_number: '',
              payment_notes: ''
            });
          });
        }
      });

      // Add payment entries if any
      payments?.forEach(payment => {
        transformedData.push({
          invoice_id: invoice.id,
          company_id: invoice.company_id,
          customer_id: invoice.customer_id,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date || '',
          subtotal: invoice.subtotal,
          total_tax: invoice.total_tax,
          total_amount: invoice.total_amount,
          amount_paid: invoice.amount_paid,
          status: invoice.status,
          customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
          line_id: '',
          product_id: '',
          product_name: '',
          description: '',
          quantity: 0,
          unit_price: 0,
          line_total: 0,
          tax_id: '',
          tax_rate_id: '',
          tax_name: '',
          tax_rate: 0,
          tax_amount: 0,
          payment_id: payment.id,
          payment_date: payment.payment_date,
          payment_amount: payment.amount,
          payment_method: payment.method,
          reference_number: payment.reference_number || '',
          payment_notes: payment.notes || ''
        });
      });

      return transformedData;

    } catch (error) {
      console.error('Error in getSalesInvoiceWithTaxesFallback:', error);
      return [];
    }
  }

  /**
   * Fallback implementation for fetching invoices with taxes without RPC
   */
  private async getInvoicesWithTaxesFallback(
    companyId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<PaginatedInvoicesResult> {
    try {
      // First, fetch invoices with basic info and customer details
      const { data: invoices, error: invoicesError, count } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customer:customers(name)
        `, { count: 'exact' })
        .eq('company_id', companyId)
        .order('invoice_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (invoicesError) throw invoicesError;

      if (!invoices || invoices.length === 0) {
        return {
          invoices: [],
          totalCount: 0,
          hasMore: false
        };
      }

      // Fetch line items for all invoices
      const { data: lines, error: linesError } = await supabase
        .from('sales_invoice_lines')
        .select(`
          *,
          product:products(name)
        `)
        .in('invoice_id', invoices.map(inv => inv.id));

      if (linesError) throw linesError;

      // Fetch taxes for all line items
      const { data: taxes, error: taxesError } = await (supabase as any)
        .from('sales_invoice_line_taxes')
        .select(`
          *,
          tax_rate:tax_rates(name, rate)
        `)
        .in('invoice_line_id', lines?.map(line => line.id) || []);

      if (taxesError) throw taxesError;

      // Fetch payments for all invoices
      const { data: payments, error: paymentsError } = await supabase
        .from('invoice_payments')
        .select('*')
        .in('invoice_id', invoices.map(inv => inv.id));

      if (paymentsError) throw paymentsError;

      // Transform data to match the RPC function structure
      const transformedInvoices: SalesInvoiceWithTaxes[] = [];

      invoices.forEach(invoice => {
        const invoiceLines = lines?.filter(line => line.invoice_id === invoice.id) || [];
        
        invoiceLines.forEach(line => {
          const lineTaxes = taxes?.filter(tax => tax.invoice_line_id === line.id) || [];
          
          // If no taxes for this line, create at least one entry
          if (lineTaxes.length === 0) {
            transformedInvoices.push({
              invoice_id: invoice.id,
              company_id: invoice.company_id,
              customer_id: invoice.customer_id,
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date || '',
              subtotal: invoice.subtotal,
              total_tax: invoice.total_tax,
              total_amount: invoice.total_amount,
              amount_paid: invoice.amount_paid,
              status: invoice.status,
              customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
              line_id: line.id,
              product_id: line.product_id || '',
              product_name: (line.product as any)?.name || 'Unknown Product',
              description: line.description,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_total: line.line_total,
              tax_id: '',
              tax_rate_id: '',
              tax_name: '',
              tax_rate: 0,
              tax_amount: 0,
              payment_id: '',
              payment_date: '',
              payment_amount: 0,
              payment_method: '',
              reference_number: '',
              payment_notes: ''
            });
          } else {
            // Create entries for each tax on this line
            lineTaxes.forEach(tax => {
              transformedInvoices.push({
                invoice_id: invoice.id,
                company_id: invoice.company_id,
                customer_id: invoice.customer_id,
                invoice_number: invoice.invoice_number,
                invoice_date: invoice.invoice_date,
                due_date: invoice.due_date || '',
                subtotal: invoice.subtotal,
                total_tax: invoice.total_tax,
                total_amount: invoice.total_amount,
                amount_paid: invoice.amount_paid,
                status: invoice.status,
                customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
                line_id: line.id,
                product_id: line.product_id || '',
                product_name: (line.product as any)?.name || 'Unknown Product',
                description: line.description,
                quantity: line.quantity,
                unit_price: line.unit_price,
                line_total: line.line_total,
                tax_id: tax.id,
                tax_rate_id: tax.tax_rate_id,
                tax_name: (tax.tax_rate as any)?.name || 'Unknown Tax',
                tax_rate: (tax.tax_rate as any)?.rate || 0,
                tax_amount: tax.tax_amount,
                payment_id: '',
                payment_date: '',
                payment_amount: 0,
                payment_method: '',
                reference_number: '',
                payment_notes: ''
              });
            });
          }
        });

        // Add payment entries if any
        const invoicePayments = payments?.filter(payment => payment.invoice_id === invoice.id) || [];
        invoicePayments.forEach(payment => {
          transformedInvoices.push({
            invoice_id: invoice.id,
            company_id: invoice.company_id,
            customer_id: invoice.customer_id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date || '',
            subtotal: invoice.subtotal,
            total_tax: invoice.total_tax,
            total_amount: invoice.total_amount,
            amount_paid: invoice.amount_paid,
            status: invoice.status,
            customer_name: (invoice.customer as any)?.name || 'Unknown Customer',
            line_id: '',
            product_id: '',
            product_name: '',
            description: '',
            quantity: 0,
            unit_price: 0,
            line_total: 0,
            tax_id: '',
            tax_rate_id: '',
            tax_name: '',
            tax_rate: 0,
            tax_amount: 0,
            payment_id: payment.id,
            payment_date: payment.payment_date,
            payment_amount: payment.amount,
            payment_method: payment.method,
            reference_number: payment.reference_number || '',
            payment_notes: payment.notes || ''
          });
        });
      });

      return {
        invoices: transformedInvoices,
        totalCount: count || 0,
        hasMore: count ? offset + limit < count : false
      };

    } catch (error) {
      console.error('Error in getInvoicesWithTaxesFallback:', error);
      return {
        invoices: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }
}
