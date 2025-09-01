import { supabase } from '@/integrations/supabase/client';
import type { ChartOfAccount, AccountClass } from '@/integrations/supabase/manager-types';

class AccountService {
  // Get all accounts for a company
  async getAccounts(companyId: string): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('account_code');

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data || [];
  }

  // Get accounts by class (REVENUE, EXPENSE, ASSET, etc.)
  async getAccountsByClass(
    companyId: string,
    accountClass: AccountClass
  ): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_class', accountClass)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('account_code');

    if (error) {
      throw new Error(`Failed to fetch ${accountClass} accounts: ${error.message}`);
    }

    return data || [];
  }

  // Get revenue accounts (for product revenue account dropdown)
  async getRevenueAccounts(companyId: string): Promise<ChartOfAccount[]> {
    return this.getAccountsByClass(companyId, 'REVENUE');
  }

  // Get expense accounts (for COGS account dropdown)
  async getExpenseAccounts(companyId: string): Promise<ChartOfAccount[]> {
    return this.getAccountsByClass(companyId, 'EXPENSE');
  }

  // Get asset accounts (for inventory asset account dropdown)
  async getAssetAccounts(companyId: string): Promise<ChartOfAccount[]> {
    return this.getAccountsByClass(companyId, 'ASSET');
  }

  // Get account by ID
  async getAccount(accountId: string, companyId: string): Promise<ChartOfAccount | null> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Account not found
      }
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return data;
  }

  // Search accounts by name or code
  async searchAccounts(
    companyId: string,
    searchTerm: string
  ): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`account_name.ilike.%${searchTerm}%,account_code.ilike.%${searchTerm}%`)
      .order('account_code');

    if (error) {
      throw new Error(`Failed to search accounts: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const accountService = new AccountService();
export type { ChartOfAccount, AccountClass };