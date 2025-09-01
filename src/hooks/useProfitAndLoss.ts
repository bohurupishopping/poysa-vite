import { useState, useEffect } from 'react';
import { accountingService, DateRange } from '@/services/accountingService';
import { useAuth } from '@/hooks/useAuth';
import { ProfitAndLossData } from '@/integrations/supabase/manager-types';

export function useProfitAndLoss() {
    const { profile } = useAuth();
    const [data, setData] = useState<ProfitAndLossData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Default to current financial year (April to March)
    const getCurrentFinancialYear = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-based

        // If current month is Jan, Feb, or Mar, financial year started previous year
        const financialYearStart = currentMonth < 3
            ? new Date(currentYear - 1, 3, 1) // April 1st of previous year
            : new Date(currentYear, 3, 1); // April 1st of current year

        return {
            startDate: financialYearStart.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        };
    };

    const [dateRange, setDateRange] = useState<DateRange>(getCurrentFinancialYear());

    const fetchData = async () => {
        if (!profile?.company_id) {
            setError('Company ID not found');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await accountingService.fetchProfitAndLoss(
                profile.company_id,
                dateRange
            );

            setData(result);
        } catch (err) {
            console.error('Error fetching P&L data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch profit & loss data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profile?.company_id, dateRange]);

    const refetch = () => {
        fetchData();
    };

    return {
        data,
        isLoading,
        error,
        dateRange,
        setDateRange,
        refetch
    };
}