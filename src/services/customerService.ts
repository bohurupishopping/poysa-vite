import { supabase } from '@/integrations/supabase/client';
import { CreateCustomerRequest, CustomerDetails, CreateCustomerForm } from '@/integrations/supabase/manager-types';

export class CustomerService {
  private static readonly TABLE_NAME = 'customers';

  /**
   * Create a new customer
   */
  static async createCustomer(
    companyId: string,
    formData: CreateCustomerForm
  ): Promise<any> {
    try {
      // Check if customer name is unique within the company
      const { data: existing } = await supabase
        .from(CustomerService.TABLE_NAME)
        .select('id')
        .eq('company_id', companyId)
        .eq('name', formData.name.trim())
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        throw new Error('Customer name already exists');
      }

      // Prepare customer details
      const details: CustomerDetails = {
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || null,
        postalCode: formData.postalCode?.trim() || null,
        taxNumber: formData.taxNumber?.trim() || null,
        gstin: formData.gstin?.trim() || null,
      };

      // Remove null/empty values from details
      const cleanDetails = Object.fromEntries(
        Object.entries(details).filter(([_, value]) => value !== null && value !== '')
      );

      const customerData: CreateCustomerRequest = {
        company_id: companyId,
        name: formData.name.trim(),
        details: Object.keys(cleanDetails).length > 0 ? cleanDetails : null,
      };

      const { data, error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .insert(customerData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(
    customerId: string,
    companyId: string,
    formData: CreateCustomerForm
  ): Promise<any> {
    try {
      // Check if customer name is unique within the company (excluding current customer)
      const { data: existing } = await supabase
        .from(CustomerService.TABLE_NAME)
        .select('id')
        .eq('company_id', companyId)
        .eq('name', formData.name.trim())
        .neq('id', customerId)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        throw new Error('Customer name already exists');
      }

      // Prepare customer details
      const details: CustomerDetails = {
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || null,
        postalCode: formData.postalCode?.trim() || null,
        taxNumber: formData.taxNumber?.trim() || null,
        gstin: formData.gstin?.trim() || null,
      };

      // Remove null/empty values from details
      const cleanDetails = Object.fromEntries(
        Object.entries(details).filter(([_, value]) => value !== null && value !== '')
      );

      const customerData = {
        name: formData.name.trim(),
        details: Object.keys(cleanDetails).length > 0 ? cleanDetails : null,
      };

      const { data, error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .update(customerData)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  /**
   * Soft delete a customer
   */
  static async deleteCustomer(customerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', customerId);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  /**
   * Get all customers for a company
   */
  static async getCustomers(companyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Search customers by name
   */
  static async searchCustomers(
    companyId: string,
    query: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .select('*')
        .eq('company_id', companyId)
        .ilike('name', `%${query}%`)
        .is('deleted_at', null)
        .order('name')
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error: any) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }
  }

  /**
   * Get a single customer by ID
   */
  static async getCustomer(customerId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from(CustomerService.TABLE_NAME)
        .select('*')
        .eq('id', customerId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  /**
   * Get customer transactions using the get_customer_statement SQL function
   */
  static async getCustomerTransactions(
    customerId: string,
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

      // Call the get_customer_statement SQL function via RPC
      const { data: response, error } = await supabase.rpc(
        'get_customer_statement',
        {
          p_customer_id: customerId,
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
            id: `${customerId}_${row.transaction_date}_${i}`,
            customer_id: customerId,
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
    } catch (error: any) {
      throw new Error(`Failed to fetch customer transactions: ${error.message}`);
    }
  }

  /**
   * Get customer balance using the get_customer_statement SQL function
   */
  static async getCustomerBalance(customerId: string): Promise<number> {
    try {
      // Get the current date for the statement
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // Call the get_customer_statement SQL function to get the latest balance
      let { data: response, error } = await supabase.rpc(
        'get_customer_statement',
        {
          p_customer_id: customerId,
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
          'get_customer_statement',
          {
            p_customer_id: customerId,
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
    } catch (error: any) {
      throw new Error(`Failed to fetch customer balance: ${error.message}`);
    }
  }
}
