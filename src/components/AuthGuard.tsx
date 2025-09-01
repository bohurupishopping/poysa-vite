import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKycStatus } from '@/hooks/useKycStatus';
import { supabase } from '@/integrations/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { kycStatus, kycLoading } = useKycStatus(user?.id, profile?.role);
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  // KYC status is now handled by useKycStatus hook

  // Check business proposal status for users
  useEffect(() => {
    const checkProposalStatus = async () => {
      if (profile?.role === 'user' && user?.id) {
        setProposalLoading(true);
        try {
          const { data: proposalData } = await supabase
            .from('business_proposals')
            .select('status')
            .eq('profile_id', user.id)
            .single();

          setProposalStatus(proposalData?.status || 'not_submitted');
        } catch (error) {
          console.error('Error checking proposal status:', error);
          setProposalStatus('not_submitted');
        } finally {
          setProposalLoading(false);
        }
      }
    };

    if (!loading && profile?.role === 'user') {
      checkProposalStatus();
    }
  }, [user, profile, loading]);

  useEffect(() => {
    if (!loading && !kycLoading && !proposalLoading) {
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      if (user && profile) {
        const currentPath = window.location.pathname;

        // Handle different roles
        if (profile.role === 'admin' && currentPath === '/') {
          navigate('/admin/dashboard', { replace: true });
        } else if (profile.role === 'manager') {
          // Manager KYC flow
          if (kycStatus === 'not_submitted' && !currentPath.startsWith('/manager/kyc')) {
            navigate('/manager/kyc', { replace: true });
          } else if (kycStatus === 'pending_review' && !currentPath.startsWith('/manager/kyc-pending')) {
            navigate('/manager/kyc-pending', { replace: true });
          } else if (kycStatus === 'rejected' && !currentPath.startsWith('/manager/kyc-rejected')) {
            navigate('/manager/kyc-rejected', { replace: true });
          } else if (kycStatus === 'approved' && currentPath === '/') {
            navigate('/manager/dashboard', { replace: true });
          }
        } else if (profile.role === 'user') {
          // User business proposal flow
          if (proposalStatus === 'not_submitted' && !currentPath.startsWith('/business-proposal')) {
            navigate('/business-proposal', { replace: true });
          } else if ((proposalStatus === 'pending' || proposalStatus === 'approved' || proposalStatus === 'rejected') &&
            (currentPath === '/' || currentPath.startsWith('/admin') || currentPath.startsWith('/manager') || currentPath.startsWith('/business-proposal'))) {
            navigate('/pending-assignment', { replace: true });
          }
        }
      }
    }
  }, [user, profile, loading, kycLoading, proposalLoading, kycStatus, proposalStatus, navigate]);

  if (loading || kycLoading || proposalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Don't render anything while navigation is happening
  if (!user) {
    return null;
  }

  return <>{children}</>;
};