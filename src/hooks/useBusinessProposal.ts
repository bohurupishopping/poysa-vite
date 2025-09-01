import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessProposal, ProposalFormData } from '@/types/business-proposal';
import { useAuth } from './useAuth';

export const useBusinessProposal = () => {
  const { user } = useAuth();
  const [proposal, setProposal] = useState<BusinessProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposal = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_proposals')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const submitProposal = async (formData: ProposalFormData, documentUrls: string[]) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('business_proposals')
      .insert({
        profile_id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2 || null,
        city: formData.city,
        state_province: formData.state_province,
        postal_code: formData.postal_code,
        country: formData.country,
        company_name: formData.company_name,
        is_gst_registered: formData.is_gst_registered,
        gstin: formData.is_gst_registered ? formData.gstin : null,
        document_urls: documentUrls,
      })
      .select()
      .single();

    if (error) throw error;
    
    setProposal(data);
    return data;
  };

  useEffect(() => {
    fetchProposal();
  }, [user?.id]);

  return {
    proposal,
    loading,
    error,
    submitProposal,
    refetch: fetchProposal,
  };
};