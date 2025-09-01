import { supabase } from '@/integrations/supabase/client';
import { PerformanceTargetWithProgress } from '@/integrations/supabase/manager-types';
import { Database } from '@/integrations/supabase/types';

export interface SalesTargetPerformance {
  targetId: string;
  targetName: string;
  primaryMetric: string;
  targetValue: number;
  primaryActualValue: number;
  achievementPercentage: number;
  status: string;
  period: {
    start: string;
    end: string;
  };
  performance_summary: {
    accrualRevenue: {
      gross: number;
      returns: number;
      net: number;
    };
    netCashCollected: {
      cashIn: number;
      cashOutRefunds: number;
      net: number;
    };
    netQuantitySold: {
      isApplicable: boolean;
      sold: number;
      returned: number;
      net: number;
    };
  };
}

export class SalesTargetService {
  /**
   * Fetch all sales targets for a company
   */
  static async fetchSalesTargets(companyId: string): Promise<PerformanceTargetWithProgress[]> {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .select(`
          *,
          product:products(*)
        `)
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Get performance data for each target
      const targetsWithProgress = await Promise.all(
        (data || []).map(async (target) => {
          const performance = await this.getSalesTargetPerformance(target.id);
          
          return {
            ...target,
            current_value: performance?.primaryActualValue || 0,
            progress_percentage: performance?.achievementPercentage || 0,
            status: this.mapPerformanceStatusToTargetStatus(performance?.status || 'On Track'),
            performance_data: performance
          } as PerformanceTargetWithProgress;
        })
      );

      return targetsWithProgress;
    } catch (error) {
      console.error('Error fetching sales targets:', error);
      throw error;
    }
  }

  /**
   * Get sales target performance using the database function
   */
  static async getSalesTargetPerformance(targetId: string): Promise<SalesTargetPerformance | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_sales_target_performance', {
          p_target_id: targetId
        });

      if (error) {
        console.error('Error calling get_sales_target_performance:', error);
        return null;
      }

      // Check if the function returned an error
      if (data && typeof data === 'object' && 'error' in data) {
        console.error('Database function error:', data.error);
        return null;
      }

      // Cast the Json response to our expected type
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as unknown as SalesTargetPerformance;
      }
      return null;
    } catch (error) {
      console.error('Error getting sales target performance:', error);
      return null;
    }
  }

  /**
   * Create a new sales target
   */
  static async createSalesTarget(targetData: {
    name: string;
    company_id: string;
    metric: Database['public']['Enums']['target_metric'];
    target_value: number;
    period: Database['public']['Enums']['target_period'];
    start_date: string;
    end_date: string;
    product_id?: string;
    description?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .insert({
          ...targetData,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sales target:', error);
      throw error;
    }
  }

  /**
   * Update an existing sales target
   */
  static async updateSalesTarget(targetId: string, updates: Partial<{
    name: string;
    metric: Database['public']['Enums']['target_metric'];
    target_value: number;
    period: Database['public']['Enums']['target_period'];
    start_date: string;
    end_date: string;
    product_id?: string;
    description?: string;
    status: Database['public']['Enums']['target_status'];
  }>) {
    try {
      const { data, error } = await supabase
        .from('sales_targets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating sales target:', error);
      throw error;
    }
  }

  /**
   * Delete a sales target
   */
  static async deleteSalesTarget(targetId: string) {
    try {
      const { error } = await supabase
        .from('sales_targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting sales target:', error);
      throw error;
    }
  }

  /**
   * Map performance status from database function to target status enum
   */
  private static mapPerformanceStatusToTargetStatus(performanceStatus: string): 'ACTIVE' | 'ACHIEVED' | 'MISSED' {
    switch (performanceStatus) {
      case 'Achieved':
        return 'ACHIEVED';
      case 'Missed':
        return 'MISSED';
      case 'On Track':
      default:
        return 'ACTIVE';
    }
  }

  /**
   * Get summary statistics for all targets
   */
  static async getTargetsSummary(companyId: string) {
    try {
      const targets = await this.fetchSalesTargets(companyId);
      
      const summary = {
        total: targets.length,
        active: targets.filter(t => t.status === 'ACTIVE').length,
        achieved: targets.filter(t => t.status === 'ACHIEVED').length,
        missed: targets.filter(t => t.status === 'MISSED').length,
        successRate: targets.length > 0 
          ? Math.round((targets.filter(t => t.status === 'ACHIEVED').length / targets.length) * 100)
          : 0
      };

      return summary;
    } catch (error) {
      console.error('Error getting targets summary:', error);
      throw error;
    }
  }
}
