import { supabase } from '@/integrations/supabase/client';
import {
  CashBankAccount,
  CashBankAccountWithBalance,
  BankTransaction,
  CreateCashBankAccountRequest,
  UpdateCashBankAccountRequest,
} from '@/types/cashBankAccount';

export class CashBankAccountService {
  /**
   * Get all active cash/bank accounts for a company
   */
  static async getAccounts(companyId: string): Promise<CashBankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('cash_bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('account_name');

      if (error) throw error;

      // Transform the data to ensure account_details is properly typed
      const transformedData = (data || []).map((account: any) => ({
        ...account,
        account_details: account.account_details as Record<string, any> || {},
      }));

      return transformedData;
    } catch (error) {
      throw new Error(`Failed to fetch cash/bank accounts: ${error}`);
    }
  }

  /**
   * Get a single cash/bank account by ID
   */
  static async getAccountById(accountId: string): Promise<CashBankAccount | null> {
    try {
      const { data, error } = await supabase
        .from('cash_bank_accounts')
        .select('*')
        .eq('id', accountId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      // Transform the data to ensure account_details is properly typed
      return {
        ...data,
        account_details: data.account_details as Record<string, any> || {},
      };
    } catch (error) {
      throw new Error(`Failed to fetch cash/bank account: ${error}`);
    }
  }

  /**
   * Create a new cash/bank account
   */
  static async createAccount(request: CreateCashBankAccountRequest): Promise<CashBankAccount> {
    try {
      // Convert BankDetails to Json if needed
      const accountDetails = request.account_details as any;

      const { data, error } = await supabase
        .from('cash_bank_accounts')
        .insert({
          company_id: request.company_id,
          chart_of_account_id: request.chart_of_account_id,
          account_name: request.account_name,
          account_type: request.account_type,
          account_details: accountDetails,
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the data to ensure account_details is properly typed
      return {
        ...data,
        account_details: data.account_details as Record<string, any> || {},
      };
    } catch (error) {
      throw new Error(`Failed to create cash/bank account: ${error}`);
    }
  }

  /**
   * Update an existing cash/bank account
   */
  static async updateAccount(
    accountId: string,
    request: UpdateCashBankAccountRequest
  ): Promise<CashBankAccount> {
    try {
      const updateData: Record<string, any> = {};

      if (request.account_name !== undefined) {
        updateData.account_name = request.account_name;
      }
      if (request.account_type !== undefined) {
        updateData.account_type = request.account_type;
      }
      if (request.account_details !== undefined) {
        updateData.account_details = request.account_details as any;
      }
      if (request.is_active !== undefined) {
        updateData.is_active = request.is_active;
      }

      const { data, error } = await supabase
        .from('cash_bank_accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      // Transform the data to ensure account_details is properly typed
      return {
        ...data,
        account_details: data.account_details as Record<string, any> || {},
      };
    } catch (error) {
      throw new Error(`Failed to update cash/bank account: ${error}`);
    }
  }

  /**
   * Soft delete a cash/bank account
   */
  static async deleteAccount(accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cash_bank_accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', accountId);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete cash/bank account: ${error}`);
    }
  }

  /**
   * Get transactions for a cash/bank account
   */
  static async getAccountTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BankTransaction[]> {
    try {
      // Get the chart_of_account_id for this cash/bank account
      const { data: accountData, error: accountError } = await supabase
        .from('cash_bank_accounts')
        .select('chart_of_account_id')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      const chartAccountId = accountData.chart_of_account_id;

      // Use default date range if not provided (last 3 months)
      const defaultEndDate = new Date();
      const defaultStartDate = new Date(
        defaultEndDate.getFullYear(),
        defaultEndDate.getMonth() - 3,
        1
      );

      const effectiveStartDate = startDate || defaultStartDate;
      const effectiveEndDate = endDate || defaultEndDate;

      // Get all journal lines for this account with journal entry details
      // First get journal lines, then fetch journal entries separately to avoid complex type inference
      const { data: journalLines, error } = await supabase
        .from('journal_lines')
        .select('id, debit, credit, journal_entry_id')
        .eq('account_id', chartAccountId);

      if (error) throw error;

      // Get journal entries for the found journal lines
      const journalEntryIds = (journalLines || []).map(line => line.journal_entry_id).filter(Boolean);

      if (journalEntryIds.length === 0) {
        return [];
      }

      const { data: journalEntries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, entry_date, narration, source_document_type, source_document_id')
        .in('id', journalEntryIds)
        .gte('entry_date', effectiveStartDate.toISOString().split('T')[0])
        .lte('entry_date', effectiveEndDate.toISOString().split('T')[0]);

      if (entriesError) throw entriesError;

      // Create a map for quick lookup
      const entriesMap = new Map(
        (journalEntries || []).map(entry => [entry.id, entry])
      );

      // Define types for intermediate data structures
      interface JournalLineWithEntry {
        id: string;
        debit: number | null;
        credit: number | null;
        journal_entry_id: string;
        journal_entries: {
          id: string;
          entry_date: string;
          narration: string;
          source_document_type: string | null;
          source_document_id: string | null;
        };
      }

      // Combine journal lines with their journal entries
      const combinedData: JournalLineWithEntry[] = [];

      for (const line of journalLines || []) {
        const journalEntry = entriesMap.get(line.journal_entry_id);
        if (journalEntry) {
          combinedData.push({
            ...line,
            journal_entries: journalEntry
          });
        }
      }

      // Sort by date (oldest first for balance calculation)
      const validItems = combinedData.sort((a, b) => {
        const dateA = new Date(a.journal_entries.entry_date);
        const dateB = new Date(b.journal_entries.entry_date);
        return dateA.getTime() - dateB.getTime();
      });

      // Transform the data to calculate running balance
      const transactions: BankTransaction[] = [];
      let runningBalance = 0;

      for (const item of validItems) {
        const journalEntry = item.journal_entries;
        const debit = item.debit ? parseFloat(item.debit.toString()) : 0;
        const credit = item.credit ? parseFloat(item.credit.toString()) : 0;

        // For asset accounts (cash/bank), debits increase balance, credits decrease
        runningBalance += debit - credit;

        const transaction = {
          id: item.id,
          account_id: accountId,
          transaction_date: journalEntry.entry_date,
          particular: journalEntry.narration,
          debit_amount: debit > 0 ? debit : undefined,
          credit_amount: credit > 0 ? credit : undefined,
          running_balance: runningBalance,
          source_document_type: journalEntry.source_document_type,
          source_document_id: journalEntry.source_document_id,
        };

        transactions.push(transaction);
      }

      // Reverse to show most recent transactions first
      return transactions.reverse();
    } catch (error) {
      throw new Error(`Failed to fetch account transactions: ${error}`);
    }
  }

  /**
   * Get account balance using SQL function
   */
  static async getAccountBalance(
    accountId: string,
    asOfDate?: Date
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc(
        'get_cash_bank_balance',
        {
          p_cash_bank_account_id: accountId,
          p_as_of_date: (asOfDate || new Date()).toISOString().split('T')[0],
        }
      );

      if (error) throw error;

      return (data as number) || 0;
    } catch (error) {
      // Fallback to legacy method if RPC fails
      return this.getAccountBalanceLegacy(accountId);
    }
  }

  /**
   * Get account balance (legacy method for backward compatibility)
   */
  static async getAccountBalanceLegacy(accountId: string): Promise<number> {
    try {
      const transactions = await this.getAccountTransactions(accountId);
      if (transactions.length === 0) return 0;

      return transactions[0].running_balance;
    } catch (error) {
      throw new Error(`Failed to fetch account balance: ${error}`);
    }
  }

  /**
   * Get cash/bank accounts for a specific ledger account
   */
  static async getAccountsForLedger(ledgerAccountId: string): Promise<CashBankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('cash_bank_accounts')
        .select('*')
        .eq('chart_of_account_id', ledgerAccountId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('account_name');

      if (error) throw error;

      // Transform the data to ensure account_details is properly typed
      const transformedData = (data || []).map((account: any) => ({
        ...account,
        account_details: account.account_details as Record<string, any> || {},
      }));

      return transformedData;
    } catch (error) {
      throw new Error(`Failed to fetch accounts for ledger: ${error}`);
    }
  }

  /**
   * Get accounts with their current balances
   */
  static async getAccountsWithBalances(companyId: string): Promise<CashBankAccountWithBalance[]> {
    try {
      const accounts = await this.getAccounts(companyId);
      
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
          try {
            const balance = await this.getAccountBalance(account.id);
            return {
              ...account,
              balance,
            };
          } catch (error) {
            console.error(`Error fetching balance for account ${account.id}:`, error);
            return {
              ...account,
              balance: 0,
            };
          }
        })
      );

      return accountsWithBalances;
    } catch (error) {
      throw new Error(`Failed to fetch accounts with balances: ${error}`);
    }
  }
}
