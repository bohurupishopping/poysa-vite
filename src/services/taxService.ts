import { supabase } from '@/integrations/supabase/client';
import { TaxRate, TaxGroup } from '@/integrations/supabase/manager-types';

export class TaxService {
  private static instance: TaxService;

  static getInstance(): TaxService {
    if (!TaxService.instance) {
      TaxService.instance = new TaxService();
    }
    return TaxService.instance;
  }

  /**
   * Get all tax groups for a company
   */
  async getTaxGroups(companyId: string): Promise<TaxGroup[]> {
    const { data, error } = await (supabase as any)
      .from('tax_groups')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) {
      console.error('Error fetching tax groups:', error);
      throw new Error(`Failed to fetch tax groups: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all tax groups with their associated tax rates
   */
  async getTaxGroupsWithRates(companyId: string): Promise<TaxGroup[]> {
    const { data: taxGroups, error: groupsError } = await (supabase as any)
      .from('tax_groups')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (groupsError) {
      console.error('Error fetching tax groups:', groupsError);
      throw new Error(`Failed to fetch tax groups: ${groupsError.message}`);
    }

    if (!taxGroups) return [];

    // Fetch tax rates for each group
    const groupsWithRates: TaxGroup[] = [];
    for (const group of taxGroups) {
      const { data: ratesData, error: ratesError } = await (supabase as any)
        .from('tax_group_rates')
        .select(`
          tax_rates (
            id,
            company_id,
            name,
            rate,
            is_active
          )
        `)
        .eq('tax_group_id', group.id);

      if (ratesError) {
        console.error(`Error fetching tax rates for group ${group.id}:`, ratesError);
        throw new Error(`Failed to fetch tax rates for group ${group.id}: ${ratesError.message}`);
      }

      const taxRates = (ratesData || []).map((item: any) => item.tax_rates);
      groupsWithRates.push({ ...group, taxRates });
    }

    return groupsWithRates;
  }

  /**
   * Get all active tax rates for a company
   */
  async getTaxRates(companyId: string): Promise<TaxRate[]> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching tax rates:', error);
      throw new Error(`Failed to fetch tax rates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tax rates by specific names (e.g., IGST, CGST, SGST)
   */
  async getTaxRatesByNames(companyId: string, names: string[]): Promise<TaxRate[]> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('name', names)
      .order('name');

    if (error) {
      console.error('Error fetching tax rates by names:', error);
      throw new Error(`Failed to fetch tax rates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific tax rate by ID
   */
  async getTaxRate(taxRateId: string): Promise<TaxRate | null> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('id', taxRateId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No tax rate found
      }
      console.error('Error fetching tax rate:', error);
      throw new Error(`Failed to fetch tax rate: ${error.message}`);
    }

    return data;
  }

  /**
   * Create or get standard tax rates (IGST 18%, CGST 9%, SGST 9%)
   */
  async getOrCreateStandardTaxRates(companyId: string): Promise<{
    igst_18: string | null;
    cgst_9: string | null;
    sgst_9: string | null;
  }> {
    try {
      // First, try to get existing tax rates
      const { data: existingRates, error: fetchError } = await supabase
        .from('tax_rates')
        .select('id, name, rate')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .in('name', ['IGST', 'CGST', 'SGST']);

      if (fetchError) throw fetchError;

      const rates = {
        igst_18: null as string | null,
        cgst_9: null as string | null,
        sgst_9: null as string | null
      };

      // Check existing rates
      existingRates?.forEach(rate => {
        if (rate.name === 'IGST' && rate.rate === 18) {
          rates.igst_18 = rate.id;
        } else if (rate.name === 'CGST' && rate.rate === 9) {
          rates.cgst_9 = rate.id;
        } else if (rate.name === 'SGST' && rate.rate === 9) {
          rates.sgst_9 = rate.id;
        }
      });

      // Create missing tax rates
      const ratesToCreate = [];
      if (!rates.igst_18) {
        ratesToCreate.push({ company_id: companyId, name: 'IGST', rate: 18 });
      }
      if (!rates.cgst_9) {
        ratesToCreate.push({ company_id: companyId, name: 'CGST', rate: 9 });
      }
      if (!rates.sgst_9) {
        ratesToCreate.push({ company_id: companyId, name: 'SGST', rate: 9 });
      }

      if (ratesToCreate.length > 0) {
        const { data: newRates, error: createError } = await supabase
          .from('tax_rates')
          .insert(ratesToCreate)
          .select('id, name, rate');

        if (createError) throw createError;

        // Update rates object with newly created rates
        newRates?.forEach(rate => {
          if (rate.name === 'IGST' && rate.rate === 18) {
            rates.igst_18 = rate.id;
          } else if (rate.name === 'CGST' && rate.rate === 9) {
            rates.cgst_9 = rate.id;
          } else if (rate.name === 'SGST' && rate.rate === 9) {
            rates.sgst_9 = rate.id;
          }
        });
      }

      return rates;
    } catch (error) {
      console.error('Error getting or creating standard tax rates:', error);
      throw new Error('Failed to get or create standard tax rates');
    }
  }

  /**
   * Search tax rates by name
   */
  async searchTaxRates(companyId: string, searchTerm: string): Promise<TaxRate[]> {
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) {
      console.error('Error searching tax rates:', error);
      throw new Error(`Failed to search tax rates: ${error.message}`);
    }

    return data || [];
  }
}

export const taxService = TaxService.getInstance();
