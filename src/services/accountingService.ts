import { supabase } from '@/integrations/supabase/client';

export interface TrialBalanceRow {
    account_id: string;
    account_code: string;
    account_name: string;
    closing_debit: number;
    closing_credit: number;
}

export interface AccountLedgerRow {
    entry_date: string;
    narration: string;
    debit: number | null;
    credit: number | null;
    running_balance: number;
}

export interface DateRange {
    startDate: string;
    endDate: string;
}

export const accountingService = {
    async fetchTrialBalance(companyId: string, asOfDate: string): Promise<TrialBalanceRow[]> {
        try {
            const { data, error } = await (supabase as any).rpc('generate_trial_balance', {
                p_company_id: companyId,
                p_as_of_date: asOfDate
            });

            if (error) {
                console.error('Error fetching trial balance:', error);
                throw new Error(`Failed to fetch trial balance: ${error.message}`);
            }

            return (data as TrialBalanceRow[]) || [];
        } catch (err) {
            console.error('Error in fetchTrialBalance:', err);
            throw new Error('Failed to fetch trial balance data');
        }
    },

    async fetchAccountLedger(
        accountId: string,
        dateRange: DateRange
    ): Promise<AccountLedgerRow[]> {
        try {
            const { data, error } = await (supabase as any).rpc('get_account_ledger', {
                p_account_id: accountId,
                p_start_date: dateRange.startDate,
                p_end_date: dateRange.endDate
            });

            if (error) {
                console.error('Error fetching account ledger:', error);
                throw new Error(`Failed to fetch account ledger: ${error.message}`);
            }

            return (data as AccountLedgerRow[]) || [];
        } catch (err) {
            console.error('Error in fetchAccountLedger:', err);
            throw new Error('Failed to fetch account ledger data');
        }
    },

    async fetchProfitAndLoss(companyId: string, dateRange: DateRange): Promise<any> {
        try {
            const { data, error } = await (supabase as any).rpc('generate_detailed_trading_and_pl_statement', {
                p_company_id: companyId,
                p_start_date: dateRange.startDate,
                p_end_date: dateRange.endDate
            });

            if (error) {
                console.error('Error fetching P&L statement:', error);
                throw new Error(`Failed to fetch P&L statement: ${error.message}`);
            }

            return data || null;
        } catch (err) {
            console.error('Error in fetchProfitAndLoss:', err);
            throw new Error('Failed to fetch profit & loss data');
        }
    },

    async fetchBalanceSheet(companyId: string, asOfDate: string): Promise<any> {
        try {
            const { data, error } = await (supabase as any).rpc('generate_detailed_balance_sheet_statement', {
                p_company_id: companyId,
                p_as_of_date: asOfDate
            });

            if (error) {
                console.error('Error fetching Balance Sheet:', error);
                throw new Error(`Failed to fetch Balance Sheet: ${error.message}`);
            }

            return data || null;
        } catch (err) {
            console.error('Error in fetchBalanceSheet:', err);
            throw new Error('Failed to fetch balance sheet data');
        }
    }
};