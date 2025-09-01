import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessProposal } from '@/types/business-proposal';
import { toast } from 'sonner';

export const useAdminProposals = () => {
  const [proposals, setProposals] = useState<BusinessProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('business_proposals')
        .select(`
          *,
          profiles!business_proposals_profile_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProposals(data || []);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to fetch proposals');
      toast.error('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const updateProposalStatus = async (proposalId: string, status: 'pending' | 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('business_proposals')
        .update(updateData)
        .eq('id', proposalId);

      if (error) throw error;

      // Update local state
      setProposals(prev =>
        prev.map(proposal =>
          proposal.id === proposalId
            ? { ...proposal, status, admin_notes: adminNotes || proposal.admin_notes }
            : proposal
        )
      );

      toast.success(`Proposal ${status} successfully`);
      return true;
    } catch (err) {
      console.error('Error updating proposal status:', err);
      toast.error('Failed to update proposal status');
      return false;
    }
  };

  const deleteProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('business_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      // Update local state
      setProposals(prev => prev.filter(proposal => proposal.id !== proposalId));

      toast.success('Proposal deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting proposal:', err);
      toast.error('Failed to delete proposal');
      return false;
    }
  };

  const getProposalById = async (proposalId: string): Promise<BusinessProposal | null> => {
    try {
      const { data, error } = await supabase
        .from('business_proposals')
        .select(`
          *,
          profiles!business_proposals_profile_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error fetching proposal:', err);
      toast.error('Failed to fetch proposal details');
      return null;
    }
  };

  const getProposalStats = () => {
    const total = proposals.length;
    const pending = proposals.filter(p => p.status === 'pending').length;
    const approved = proposals.filter(p => p.status === 'approved').length;
    const rejected = proposals.filter(p => p.status === 'rejected').length;

    return {
      total,
      pending,
      approved,
      rejected
    };
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    updateProposalStatus,
    deleteProposal,
    getProposalById,
    getProposalStats
  };
};