import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BillData, BillLine } from '@/components/create-bill/types';

export interface PurchaseBill {
  id: string;
  companyId: string;
  supplierId: string;
  billNumber: string | null;
  billDate: string;
  dueDate: string | null;
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  amountPaid: number;
  status: 'draft' | 'submitted' | 'partially_paid' | 'paid';
  placeOfSupply: string | null;
  lines: PurchaseBillLine[];
  supplierName?: string;
}

export interface PurchaseBillLine {
  id: string;
  billId: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  hsnSacCode: string | null;
  lineTaxes: LineTaxDetail[];
  productName?: string;
}

export interface LineTaxDetail {
  id: string;
  lineId: string;
  taxRateId: string;
  taxName?: string;
  taxRate?: number;
  taxAmount: number;
  createdAt?: string;
}

export interface BillPayment {
  id: string;
  billId: string;
  paymentDate: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'other';
  cashBankAccountId: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
}

export interface BillStatusUpdate {
  billId: string;
  status: 'draft' | 'submitted' | 'partially_paid' | 'paid';
}

export interface PaymentRecordData {
  billId: string;
  paymentDate: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'cheque' | 'upi' | 'other';
  cashBankAccountId: string;
  referenceNumber?: string;
  notes?: string;
}

// Simple cache invalidation utility
const invalidateDashboardCache = (companyId: string) => {
  // This would typically interact with a cache manager
  // For now, we'll just log the invalidation
  console.log(`Dashboard cache invalidated for purchase transaction in company: ${companyId}`);
};

export const purchaseBillService = {
  // Get all purchase bills for a company
  async getBills(companyId: string): Promise<PurchaseBill[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_bills')
        .select(`
          *,
          suppliers!inner(name),
          purchase_bill_lines(*,
            products(name),
            purchase_bill_line_taxes(
              tax_rate_id,
              tax_amount,
              tax_rates(name, rate)
            )
          ),
          bill_payments(*)
        `)
        .eq('company_id', companyId)
        .order('bill_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(bill => this.transformBillData(bill));
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw new Error('Failed to fetch purchase bills');
    }
  },

  // Get bills with pagination using PostgreSQL function
  async getBillsPaginated(companyId: string, limit = 25, offset = 0): Promise<PurchaseBill[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_company_purchase_bills_paginated', {
          p_company_id: companyId,
          p_limit: limit,
          p_offset: offset
        });

      if (error) throw error;

      // Transform the flattened data structure to our nested format
      return this.transformPaginatedBillData(data || []);
    } catch (error) {
      console.error('Error fetching paginated bills:', error);
      throw new Error('Failed to fetch purchase bills');
    }
  },

  // Get a single purchase bill by ID
  async getBillById(billId: string): Promise<PurchaseBill | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_bills')
        .select(`
          *,
          suppliers!inner(name),
          purchase_bill_lines(*,
            products(name),
            purchase_bill_line_taxes(
              tax_rate_id,
              tax_amount,
              tax_rates(name, rate)
            )
          ),
          bill_payments(*)
        `)
        .eq('id', billId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return this.transformBillData(data);
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw new Error('Failed to fetch purchase bill');
    }
  },

  // Get purchase bill with details using RPC function
  async getPurchaseBillWithDetails(billId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_bill_with_details', {
          p_bill_id: billId
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching bill with details:', error);
      throw new Error('Failed to fetch purchase bill details');
    }
  },

  // Transform paginated bill data from PostgreSQL function to nested format
  transformPaginatedBillData(paginatedData: any[]): PurchaseBill[] {
    const billsMap = new Map<string, PurchaseBill>();
    
    paginatedData.forEach(row => {
      const billId = row.bill_id;
      
      if (!billsMap.has(billId)) {
        billsMap.set(billId, {
          id: billId,
          companyId: row.company_id,
          supplierId: row.supplier_id,
          billNumber: row.bill_number,
          billDate: row.bill_date,
          dueDate: row.due_date,
          subtotal: row.subtotal,
          totalTax: row.total_tax,
          totalAmount: row.total_amount,
          amountPaid: row.amount_paid,
          status: row.status,
          placeOfSupply: row.place_of_supply,
          lines: [],
          supplierName: row.supplier_name
        });
      }
      
      const bill = billsMap.get(billId)!;
      
      // Add line item if it exists
      if (row.line_id && !bill.lines.some(line => line.id === row.line_id)) {
        const line: PurchaseBillLine = {
          id: row.line_id,
          billId: billId,
          productId: row.product_id,
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          lineTotal: row.line_total,
          hsnSacCode: row.hsn_sac_code,
          lineTaxes: [],
          productName: row.product_name
        };
        
        bill.lines.push(line);
      }
      
      // Add tax to the corresponding line
      if (row.tax_id && row.line_id) {
        const line = bill.lines.find(l => l.id === row.line_id);
        if (line && !line.lineTaxes.some(tax => tax.id === row.tax_id)) {
          line.lineTaxes.push({
            id: row.tax_id,
            lineId: row.line_id,
            taxRateId: row.tax_rate_id,
            taxName: row.tax_name,
            taxRate: row.tax_rate,
            taxAmount: row.tax_amount,
            createdAt: undefined
          });
        }
      }
      
      // Add payment if it exists
      // Note: Payments would need to be handled separately as they don't fit the current structure
    });
    
    return Array.from(billsMap.values());
  },

  // Transform raw bill data to typed format
  transformBillData(billData: any): PurchaseBill {
    const lines = (billData.purchase_bill_lines || []).map((line: any) => ({
      id: line.id,
      billId: line.bill_id,
      productId: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unit_price,
      lineTotal: line.line_total,
      hsnSacCode: line.hsn_sac_code,
      lineTaxes: (line.purchase_bill_line_taxes || []).map((tax: any) => ({
        id: tax.id,
        lineId: tax.bill_line_id,
        taxRateId: tax.tax_rate_id,
        taxName: tax.tax_rates?.name,
        taxRate: tax.tax_rates?.rate,
        taxAmount: tax.tax_amount,
        createdAt: tax.created_at
      })),
      productName: line.products?.name
    }));

    const payments = (billData.bill_payments || []).map((payment: any) => ({
      id: payment.id,
      billId: payment.bill_id,
      paymentDate: payment.payment_date,
      amount: payment.amount,
      method: payment.method,
      cashBankAccountId: payment.cash_bank_account_id,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      createdAt: payment.created_at
    }));

    return {
      id: billData.id,
      companyId: billData.company_id,
      supplierId: billData.supplier_id,
      billNumber: billData.bill_number,
      billDate: billData.bill_date,
      dueDate: billData.due_date,
      subtotal: billData.subtotal,
      totalTax: billData.total_tax || 0,
      totalAmount: billData.total_amount,
      amountPaid: billData.amount_paid || 0,
      status: billData.status,
      placeOfSupply: billData.place_of_supply,
      lines,
      supplierName: billData.suppliers?.name
    };
  },

  // Save bill as draft (two-step process)
  async saveBillAsDraft(billData: BillData, companyId: string): Promise<PurchaseBill> {
    try {
      // First try to use the RPC function
      try {
        const linesData = billData.lines.map(line => {
          const lineTaxes = [];

          if (line.igst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.igst_amount
            });
          }

          if (line.cgst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.cgst_amount
            });
          }

          if (line.sgst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.sgst_amount
            });
          }

          return {
            product_id: line.product_id || null,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total,
            hsn_sac_code: line.hsn_sac_code || null,
            line_taxes: lineTaxes
          };
        });

        const { data, error } = await supabase.rpc('submit_purchase_bill', {
          p_company_id: companyId,
          p_supplier_id: billData.supplier_id,
          p_bill_date: billData.bill_date,
          p_lines: linesData,
          p_bill_number: billData.bill_number,
          p_due_date: billData.due_date,
          p_place_of_supply: billData.place_of_supply
        });

        if (error) throw error;

        // Fetch the saved bill (RPC returns string directly, not object with bill_id)
        const savedBill = await this.getBillById(data);
        if (!savedBill) throw new Error('Failed to fetch saved bill');

        // Invalidate dashboard cache for purchase transaction
        invalidateDashboardCache(companyId);

        return savedBill;
      } catch (rpcError) {
        console.warn('RPC function failed, falling back to manual save:', rpcError);
        return await this.saveBillFallback(billData, companyId, 'draft');
      }
    } catch (error) {
      console.error('Error saving bill as draft:', error);
      throw new Error('Failed to save bill as draft');
    }
  },

  // Submit bill (two-step process with fallback)
  async submitBill(billData: BillData, companyId: string): Promise<PurchaseBill> {
    try {
      // First try to use the RPC function
      try {
        const linesData = billData.lines.map(line => {
          const lineTaxes = [];

          if (line.igst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.igst_amount
            });
          }

          if (line.cgst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.cgst_amount
            });
          }

          if (line.sgst_amount > 0) {
            lineTaxes.push({
              tax_rate_id: '', // Will be populated by tax rate service
              tax_amount: line.sgst_amount
            });
          }

          return {
            product_id: line.product_id || null,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_total: line.line_total,
            hsn_sac_code: line.hsn_sac_code || null,
            line_taxes: lineTaxes
          };
        });

        const { data, error } = await supabase.rpc('submit_purchase_bill', {
          p_company_id: companyId,
          p_supplier_id: billData.supplier_id,
          p_bill_date: billData.bill_date,
          p_lines: linesData,
          p_bill_number: billData.bill_number,
          p_due_date: billData.due_date,
          p_place_of_supply: billData.place_of_supply
        });

        if (error) throw error;

        // Fetch the submitted bill (RPC returns string directly, not object with bill_id)
        const submittedBill = await this.getBillById(data);
        if (!submittedBill) throw new Error('Failed to fetch submitted bill');

        return submittedBill;
      } catch (rpcError) {
        console.warn('RPC function failed, falling back to manual submission:', rpcError);
        return await this.submitBillFallback(billData, companyId);
      }
    } catch (error) {
      console.error('Error submitting bill:', error);
      throw new Error('Failed to submit bill');
    }
  },

  // Fallback method for saving bill without RPC
  async saveBillFallback(billData: BillData, companyId: string, status: 'draft' | 'submitted'): Promise<PurchaseBill> {
    try {
      // Calculate totals
      const subtotal = billData.lines.reduce((sum, line) => sum + line.line_total, 0);
      const totalTax = billData.lines.reduce((sum, line) => sum + line.total_tax_amount, 0);
      const totalAmount = subtotal + totalTax;

      const billPayload = {
        company_id: companyId,
        supplier_id: billData.supplier_id,
        bill_number: billData.bill_number,
        bill_date: billData.bill_date,
        due_date: billData.due_date,
        subtotal,
        total_tax: totalTax,
        total_amount: totalAmount,
        status,
        place_of_supply: billData.place_of_supply
      };

      // Insert bill
      const { data: billResponse, error: billError } = await supabase
        .from('purchase_bills')
        .insert(billPayload)
        .select()
        .single();

      if (billError) throw billError;

      const billId = billResponse.id;

      // Insert line items
      if (billData.lines.length > 0) {
        const lineData = billData.lines.map(line => ({
          bill_id: billId,
          product_id: line.product_id || null,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unit_price,
          line_total: line.line_total,
          hsn_sac_code: line.hsn_sac_code || null
        }));

        const { data: insertedLines, error: linesError } = await supabase
          .from('purchase_bill_lines')
          .insert(lineData)
          .select();

        if (linesError) throw linesError;

        // TODO: Insert line taxes (would need tax rate IDs)
      }

      // Fetch the complete bill
      const savedBill = await this.getBillById(billId);
      if (!savedBill) throw new Error('Failed to fetch saved bill');

      return savedBill;
    } catch (error) {
      console.error('Error in saveBillFallback:', error);
      throw new Error('Failed to save bill using fallback method');
    }
  },

  // Fallback method for submitting bill without RPC
  async submitBillFallback(billData: BillData, companyId: string): Promise<PurchaseBill> {
    try {
      // First save as draft
      const draftBill = await this.saveBillFallback(billData, companyId, 'draft');

      // Then update status to submitted
      const { error: updateError } = await supabase
        .from('purchase_bills')
        .update({ status: 'submitted' })
        .eq('id', draftBill.id);

      if (updateError) throw updateError;

      // Fetch the updated bill
      const submittedBill = await this.getBillById(draftBill.id);
      if (!submittedBill) throw new Error('Failed to fetch submitted bill');

      return submittedBill;
    } catch (error) {
      console.error('Error in submitBillFallback:', error);
      throw new Error('Failed to submit bill using fallback method');
    }
  },

  // Record a payment against a bill
  async recordPayment(paymentData: PaymentRecordData): Promise<void> {
    try {
      // Convert 'upi' method to 'other' to match database enum
      const method = paymentData.method === 'upi' ? 'other' : paymentData.method;
      
      const { error } = await supabase
        .from('bill_payments')
        .insert({
          bill_id: paymentData.billId,
          payment_date: paymentData.paymentDate,
          amount: paymentData.amount,
          method: method,
          cash_bank_account_id: paymentData.cashBankAccountId,
          reference_number: paymentData.referenceNumber,
          notes: paymentData.notes
        });

      if (error) throw error;

      // Update bill payment status
      await this.updateBillPaymentStatus(paymentData.billId);
    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error('Failed to record payment');
    }
  },

  // Update bill payment status based on payments
  async updateBillPaymentStatus(billId: string): Promise<void> {
    try {
      // Get current bill total
      const { data: billData, error: billError } = await supabase
        .from('purchase_bills')
        .select('total_amount')
        .eq('id', billId)
        .single();

      if (billError) throw billError;

      // Get total payments
      const { data: payments, error: paymentsError } = await supabase
        .from('bill_payments')
        .select('amount')
        .eq('bill_id', billId);

      if (paymentsError) throw paymentsError;

      const totalAmount = billData.total_amount;
      const totalPaid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);

      // Determine status
      let status: 'submitted' | 'partially_paid' | 'paid';
      if (totalPaid >= totalAmount) {
        status = 'paid';
      } else if (totalPaid > 0) {
        status = 'partially_paid';
      } else {
        status = 'submitted';
      }

      // Update bill
      const { error: updateError } = await supabase
        .from('purchase_bills')
        .update({ 
          amount_paid: totalPaid, 
          status 
        })
        .eq('id', billId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }
  },

  // Generate next bill number
  async generateBillNumber(companyId: string): Promise<string> {
    try {
      // Try to use custom numbering if available
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.rpc('generate_next_document_number', {
          p_company_id: companyId,
          p_document_type: 'purchase_bill',
          p_date: today
        });

        if (!error && data) {
          return data;
        }
      } catch (rpcError) {
        console.warn('Bill number generation RPC failed:', rpcError);
      }

      // Fallback to simple timestamp-based number
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const fallbackNumber = now.getTime().toString().slice(-6);
      return `BILL/${dateStr}/${fallbackNumber}`;
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Ultimate fallback
      return `BILL/${Date.now()}`;
    }
  }
};
