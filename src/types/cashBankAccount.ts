export interface CashBankAccount {
  id: string;
  company_id: string;
  chart_of_account_id: string;
  account_name: string;
  account_type: 'Bank' | 'Cash';
  account_details?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  deleted_at?: string;
}

export interface CashBankAccountWithBalance extends CashBankAccount {
  balance: number;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  transaction_date: string;
  particular: string;
  debit_amount?: number;
  credit_amount?: number;
  running_balance: number;
  source_document_type?: string;
  source_document_id?: string;
}

export interface CreateCashBankAccountRequest {
  company_id: string;
  chart_of_account_id: string;
  account_name: string;
  account_type: 'Bank' | 'Cash';
  account_details?: Record<string, any>;
}

export interface UpdateCashBankAccountRequest {
  account_name?: string;
  account_type?: 'Bank' | 'Cash';
  account_details?: Record<string, any>;
  is_active?: boolean;
}