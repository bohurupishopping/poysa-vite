import { useState, useEffect, useMemo } from 'react';
import { accountingService, TrialBalanceRow } from '@/services/accountingService';
import { useAuth } from '@/hooks/useAuth';

export const useTrialBalance = () => {
    const { profile } = useAuth();
    const [data, setData] = useState<TrialBalanceRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const companyId = profile?.company_id;

    const fetchTrialBalance = async () => {
        if (!companyId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await accountingService.fetchTrialBalance(companyId, date);
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trial balance';
            setError(errorMessage);
            console.error('Trial balance fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrialBalance();
    }, [companyId, date]);

    const totals = useMemo(() => {
        const totalDebits = data.reduce((sum, row) => sum + row.closing_debit, 0);
        const totalCredits = data.reduce((sum, row) => sum + row.closing_credit, 0);
        const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Account for floating point precision

        return {
            totalDebits,
            totalCredits,
            isBalanced,
            difference: totalDebits - totalCredits
        };
    }, [data]);

    return {
        data,
        isLoading,
        error,
        date,
        setDate,
        totals,
        refetch: fetchTrialBalance
    };
};