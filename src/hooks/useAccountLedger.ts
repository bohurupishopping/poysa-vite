import { useState, useEffect } from 'react';
import { accountingService, AccountLedgerRow, DateRange } from '@/services/accountingService';

export const useAccountLedger = (accountId: string | null, dateRange: DateRange) => {
    const [data, setData] = useState<AccountLedgerRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAccountLedger = async () => {
        if (!accountId) {
            setData([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await accountingService.fetchAccountLedger(accountId, dateRange);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch account ledger';
            setError(errorMessage);
            console.error('Account ledger fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccountLedger();
    }, [accountId, dateRange.startDate, dateRange.endDate]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchAccountLedger
    };
};