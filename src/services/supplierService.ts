import { supabase } from '@/integrations/supabase/client';
import { 
  Supplier, 
  SupplierDetails, 
  CreateSupplierForm, 
  CreateSupplierRequest 
} from '@/integrations/supabase/manager-types';

export class SupplierService {
  private static readonly TABLE_NAME = 'suppliers';

  /**
   * Get all suppliers for a company
   */
  static async getSuppliers(companyId: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch suppliers: ${error}`);
    }
  }

  /**
   * Search suppliers by name
   */
  static async searchSuppliers(companyId: string, query: string): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
        .ilike('name', `%${query}%`)
        .is('deleted_at', null)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to search suppliers: ${error}`);
    }
  }

  /**
   * Get a single supplier by ID
   */
  static async getSupplier(supplierId: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', supplierId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch supplier: ${error}`);
    }
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(request: CreateSupplierRequest): Promise<Supplier> {
    try {
      // Check if supplier name is unique within the company
      const { data: existing } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .eq('company_id', request.company_id)
        .eq('name', request.name)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        throw new Error('Supplier name already exists');
      }

      const supplierData = {
        company_id: request.company_id,
        name: request.name,
        details: request.details || null,
      };

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(supplierData)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create supplier: ${error}`);
    }
  }

  /**
   * Update an existing supplier
   */
  static async updateSupplier(
    supplierId: string,
    companyId: string,
    request: Partial<CreateSupplierRequest>
  ): Promise<Supplier> {
    try {
      // Check if supplier name is unique within the company (excluding current supplier)
      if (request.name) {
        const { data: existing } = await supabase
          .from(this.TABLE_NAME)
          .select('id')
          .eq('company_id', companyId)
          .eq('name', request.name)
          .neq('id', supplierId)
          .is('deleted_at', null)
          .maybeSingle();

        if (existing) {
          throw new Error('Supplier name already exists');
        }
      }

      const updateData: Partial<Supplier> = {};
      if (request.name) updateData.name = request.name;
      if (request.details !== undefined) updateData.details = request.details;

      // Handle gstin separately - it should be stored in details
      if (request.gstin !== undefined) {
        const currentDetails = request.details || {};
        updateData.details = {
          ...currentDetails,
          gstin: request.gstin,
        };
      }

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(updateData)
        .eq('id', supplierId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update supplier: ${error}`);
    }
  }

  /**
   * Soft delete a supplier
   */
  static async deleteSupplier(supplierId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', supplierId);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete supplier: ${error}`);
    }
  }

  /**
   * Get supplier statistics
   */
  static async getSupplierStats(companyId: string): Promise<{ totalSuppliers: number }> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .eq('company_id', companyId)
        .is('deleted_at', null);

      if (error) throw error;
      return { totalSuppliers: data?.length || 0 };
    } catch (error) {
      throw new Error(`Failed to fetch supplier statistics: ${error}`);
    }
  }

  /**
   * Validate supplier details
   */
  static validateSupplierDetails(details: SupplierDetails): string | null {
    // Email validation
    if (details.email && details.email.trim()) {
      const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(details.email)) {
        return 'Invalid email format';
      }
    }

    // Phone validation (basic)
    if (details.phone && details.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{1,14}$/;
      const cleanPhone = details.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return 'Invalid phone number format';
      }
    }

    // GSTIN validation
    if (details.gstin && details.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(details.gstin)) {
        return 'Please enter a valid 15-digit GSTIN';
      }
    }

    return null; // No validation errors
  }

  /**
   * Convert form data to supplier details
   */
  static formToSupplierDetails(form: CreateSupplierForm): SupplierDetails {
    return {
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      state: form.state?.trim() || null,
      country: form.country?.trim() || null,
      postalCode: form.postalCode?.trim() || null,
      taxNumber: form.taxNumber?.trim() || null,
      gstin: form.gstin?.trim() || null,
      contactPerson: form.contactPerson?.trim() || null,
      paymentTerms: form.paymentTerms?.trim() || null,
      notes: form.notes?.trim() || null,
    };
  }

  /**
   * Convert supplier details to form data
   */
  static supplierDetailsToForm(details: SupplierDetails | null): Partial<CreateSupplierForm> {
    if (!details) return {};
    
    return {
      email: details.email || '',
      phone: details.phone || '',
      address: details.address || '',
      city: details.city || '',
      state: details.state || '',
      country: details.country || '',
      postalCode: details.postalCode || '',
      taxNumber: details.taxNumber || '',
      gstin: details.gstin || '',
      contactPerson: details.contactPerson || '',
      paymentTerms: details.paymentTerms || '',
      notes: details.notes || '',
    };
  }

  /**
   * Get suppliers with payment terms
   */
  static async getSuppliersWithPaymentTerms(companyId: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.getSuppliers(companyId);
      return suppliers.filter(supplier => {
        const details = supplier.details as SupplierDetails | null;
        return details?.paymentTerms && details.paymentTerms.trim();
      });
    } catch (error) {
      throw new Error(`Failed to fetch suppliers with payment terms: ${error}`);
    }
  }

  /**
   * Get suppliers by contact person
   */
  static async getSuppliersByContactPerson(companyId: string, contactPerson: string): Promise<Supplier[]> {
    try {
      const suppliers = await this.getSuppliers(companyId);
      return suppliers.filter(supplier => {
        const details = supplier.details as SupplierDetails | null;
        return details?.contactPerson && 
               details.contactPerson.toLowerCase().includes(contactPerson.toLowerCase());
      });
    } catch (error) {
      throw new Error(`Failed to fetch suppliers by contact person: ${error}`);
    }
  }

  /**
   * Get supplier transactions using the get_supplier_statement SQL function
   */
  static async getSupplierTransactions(
    supplierId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        page = 1,
        limit = 20
      } = options;

      // Format dates for SQL function (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Call the get_supplier_statement SQL function via RPC
      const { data: response, error } = await supabase.rpc(
        'get_supplier_statement',
        {
          p_supplier_id: supplierId,
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        }
      );

      if (error) throw error;

      // Transform the response to match the expected format
      const transactions: any[] = [];

      if (response && Array.isArray(response)) {
        for (let i = 0; i < response.length; i++) {
          const row = response[i] as any;
          const debit = row.debit ? parseFloat(row.debit.toString()) : null;
          const credit = row.credit ? parseFloat(row.credit.toString()) : null;
          const runningBalance = parseFloat(row.running_balance.toString());

          transactions.push({
            id: `${supplierId}_${row.transaction_date}_${i}`,
            supplier_id: supplierId,
            transaction_date: row.transaction_date,
            narration: row.narration,
            debit,
            credit,
            running_balance: runningBalance,
            source_document_type: 'statement',
            source_document_id: null,
          });
        }
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      if (startIndex >= transactions.length) {
        return [];
      }
      
      return transactions.slice(startIndex, endIndex);
    } catch (error) {
      throw new Error(`Failed to fetch supplier transactions: ${error}`);
    }
  }

  /**
   * Get supplier balance using the get_supplier_statement SQL function
   */
  static async getSupplierBalance(supplierId: string): Promise<number> {
    try {
      // Get the current date for the statement
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // Call the get_supplier_statement SQL function to get the latest balance
      let { data: response, error } = await supabase.rpc(
        'get_supplier_statement',
        {
          p_supplier_id: supplierId,
          p_start_date: dateStr,
          p_end_date: dateStr,
        }
      );

      if (error) throw error;

      if (!response || !Array.isArray(response) || response.length === 0) {
        // If no transactions today, get the balance from a wider range
        const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Last year
        const startDateStr = startDate.toISOString().split('T')[0];
        
        const { data: widerResponse, error: widerError } = await supabase.rpc(
          'get_supplier_statement',
          {
            p_supplier_id: supplierId,
            p_start_date: startDateStr,
            p_end_date: dateStr,
          }
        );
        
        if (widerError) throw widerError;
        
        if (!widerResponse || !Array.isArray(widerResponse) || widerResponse.length === 0) {
          return 0.0;
        }
        
        // Get the last transaction's running balance
        const lastTransaction = widerResponse[widerResponse.length - 1] as any;
        return parseFloat(lastTransaction.running_balance.toString());
      }

      // Get the last transaction's running balance
      const lastTransaction = response[response.length - 1] as any;
      return parseFloat(lastTransaction.running_balance.toString());
    } catch (error) {
      throw new Error(`Failed to fetch supplier balance: ${error}`);
    }
  }
}
