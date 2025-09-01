import { useState, useEffect } from 'react';
import { accountingService } from '@/services/accountingService';
import { useAuth } from '@/hooks/useAuth';
import { BalanceSheetData } from '@/integrations/supabase/manager-types';

export function useBalanceSheet() {
    const { profile } = useAuth();
    const [data, setData] = useState<BalanceSheetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Default to current date
    const [asOfDate, setAsOfDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    const fetchData = async () => {
        if (!profile?.company_id) {
            setError('Company ID not found');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await accountingService.fetchBalanceSheet(
                profile.company_id,
                asOfDate
            );

            setData(result);
        } catch (err) {
            console.error('Error fetching Balance Sheet data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch balance sheet data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profile?.company_id, asOfDate]);

    const refetch = () => {
        fetchData();
    };

    return {
        data,
        isLoading,
        error,
        asOfDate,
        setAsOfDate,
        refetch
    };
}