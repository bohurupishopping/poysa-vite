import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface KycStatusCache {
  status: string;
  userId: string;
  timestamp: number;
}

const KYC_CACHE_KEY = 'kyc_status_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useKycStatus = (userId: string | undefined, userRole: string | undefined) => {
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

  // Get cached KYC status from localStorage
  const getCachedKycStatus = useCallback((currentUserId: string): string | null => {
    try {
      const cached = localStorage.getItem(KYC_CACHE_KEY);
      if (!cached) return null;

      const cacheData: KycStatusCache = JSON.parse(cached);
      
      // Check if cache is for the same user and not expired
      if (
        cacheData.userId === currentUserId &&
        cacheData.status === 'approved' &&
        Date.now() - cacheData.timestamp < CACHE_DURATION
      ) {
        return cacheData.status;
      }
      
      // Clear invalid or expired cache
      localStorage.removeItem(KYC_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading KYC cache:', error);
      localStorage.removeItem(KYC_CACHE_KEY);
      return null;
    }
  }, []);

  // Set KYC status in cache (only for approved status)
  const setCachedKycStatus = useCallback((status: string, currentUserId: string) => {
    if (status === 'approved') {
      try {
        const cacheData: KycStatusCache = {
          status,
          userId: currentUserId,
          timestamp: Date.now()
        };
        localStorage.setItem(KYC_CACHE_KEY, JSON.stringify(cacheData));
      } catch (error) {
        console.error('Error setting KYC cache:', error);
      }
    }
  }, []);

  // Clear KYC cache
  const clearKycCache = useCallback(() => {
    try {
      localStorage.removeItem(KYC_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing KYC cache:', error);
    }
  }, []);

  // Fetch KYC status from API
  const fetchKycStatus = useCallback(async (currentUserId: string) => {
    setKycLoading(true);
    try {
      const { data: kycData } = await supabase
        .from('profile_kyc')
        .select('status')
        .eq('profile_id', currentUserId)
        .single();

      const status = kycData?.status || 'not_submitted';
      setKycStatus(status);
      
      // Cache only if approved
      setCachedKycStatus(status, currentUserId);
      
      return status;
    } catch (error) {
      console.error('Error checking KYC status:', error);
      const fallbackStatus = 'not_submitted';
      setKycStatus(fallbackStatus);
      return fallbackStatus;
    } finally {
      setKycLoading(false);
    }
  }, [setCachedKycStatus]);

  // Main effect to handle KYC status checking
  useEffect(() => {
    if (!userId || userRole !== 'manager') {
      setKycStatus(null);
      setKycLoading(false);
      return;
    }

    // Check cache first
    const cachedStatus = getCachedKycStatus(userId);
    
    if (cachedStatus === 'approved') {
      // Use cached approved status
      setKycStatus(cachedStatus);
      setKycLoading(false);
    } else {
      // Fetch from API for non-approved or missing cache
      fetchKycStatus(userId);
    }
  }, [userId, userRole, getCachedKycStatus, fetchKycStatus]);

  // Clear cache when user changes
  useEffect(() => {
    return () => {
      // This cleanup will run when the component unmounts or userId changes
      const currentCache = localStorage.getItem(KYC_CACHE_KEY);
      if (currentCache) {
        try {
          const cacheData: KycStatusCache = JSON.parse(currentCache);
          if (cacheData.userId !== userId) {
            clearKycCache();
          }
        } catch (error) {
          clearKycCache();
        }
      }
    };
  }, [userId, clearKycCache]);

  // Refresh KYC status (force fetch from API)
  const refreshKycStatus = useCallback(() => {
    if (userId && userRole === 'manager') {
      clearKycCache();
      fetchKycStatus(userId);
    }
  }, [userId, userRole, clearKycCache, fetchKycStatus]);

  return {
    kycStatus,
    kycLoading,
    refreshKycStatus,
    clearKycCache
  };
};