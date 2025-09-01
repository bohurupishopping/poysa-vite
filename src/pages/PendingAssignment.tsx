import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, RefreshCw, CheckCircle, AlertCircle, FileText, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BusinessProposal } from '@/types/business-proposal';

const PendingAssignment = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [proposal, setProposal] = useState<BusinessProposal | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  const checkUserStatus = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking user status:', error);
        return;
      }

      setLastChecked(new Date());

      // If user has been assigned a role and company, redirect to appropriate dashboard
      if (data && data.role !== 'user' && data.company_id) {
        if (data.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (data.role === 'manager') {
          navigate('/manager/dashboard', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkProposalStatus = async () => {
    if (!user || profile?.role !== 'user') return;

    setProposalLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_proposals')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking proposal status:', error);
        return;
      }

      setProposal(data || null);
    } catch (error) {
      console.error('Error checking proposal status:', error);
    } finally {
      setProposalLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user && profile) {
      checkUserStatus();
      if (profile.role === 'user') {
        checkProposalStatus();
      }
    }
  }, [user, profile]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkUserStatus();
      if (profile?.role === 'user') {
        checkProposalStatus();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, profile]);

  // Manual refresh function
  const handleManualRefresh = () => {
    checkUserStatus();
    if (profile?.role === 'user') {
      checkProposalStatus();
    }
  };

  const getProposalStatusInfo = () => {
    if (!proposal) {
      return {
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        status: 'Not Submitted',
        description: 'Business proposal not yet submitted'
      };
    }

    switch (proposal.status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          status: 'Under Review',
          description: 'Your business proposal is being reviewed'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          status: 'Approved',
          description: 'Your business proposal has been approved'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          status: 'Rejected',
          description: 'Your business proposal needs revision'
        };
      default:
        return {
          icon: FileText,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          status: 'Unknown',
          description: 'Proposal status unknown'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shadow-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-inner">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Synergetics</h1>
            <p className="text-muted-foreground">Account Pending Assignment</p>
          </div>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6 shadow-md border border-amber-200/50">
              <Clock className="w-12 h-12 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-foreground">Welcome, {profile?.full_name || 'User'}!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              Your journey with Synergetics is about to begin
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <div className="text-center">
              <p className="text-foreground/80 text-lg leading-relaxed">
                Your account has been created successfully and is currently pending assignment by an administrator.
              </p>
            </div>

            {profile?.role === 'user' ? (
              // User role - show business proposal status
              <div className="space-y-6">
                <div className="bg-secondary/50 rounded-xl p-6 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Business Proposal Status
                  </h3>

                  {proposalLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${getProposalStatusInfo().bgColor} flex items-center justify-center`}>
                        {React.createElement(getProposalStatusInfo().icon, {
                          className: `w-6 h-6 ${getProposalStatusInfo().color}`
                        })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{getProposalStatusInfo().status}</h4>
                        <p className="text-sm text-muted-foreground">{getProposalStatusInfo().description}</p>
                        {proposal && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted: {new Date(proposal.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {proposal && (
                  <div className="bg-secondary/50 rounded-xl p-6 border border-border/50">
                    <h3 className="font-semibold text-foreground mb-4">Proposal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <span className="ml-2 text-foreground">{proposal.company_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="ml-2 text-foreground">{proposal.phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2 text-foreground">{proposal.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">GST Status:</span>
                        <span className="ml-2 text-foreground">
                          {proposal.is_gst_registered ? `Registered (${proposal.gstin})` : 'Not Registered'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Non-user roles - show original assignment status
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-secondary rounded-xl p-5 flex flex-col items-center text-center border border-border/50 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Account Status</h3>
                  <p className="text-sm text-muted-foreground">Pending Assignment</p>
                </div>

                <div className="bg-secondary rounded-xl p-5 flex flex-col items-center text-center border border-border/50 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Next Step</h3>
                  <p className="text-sm text-muted-foreground">Admin Review</p>
                </div>

                <div className="bg-secondary rounded-xl p-5 flex flex-col items-center text-center border border-border/50 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Completion</h3>
                  <p className="text-sm text-muted-foreground">Full Access</p>
                </div>
              </div>
            )}

            <div className="bg-secondary/50 rounded-xl p-5 border border-border/50 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">What happens next?</h3>
                  <ul className="mt-2 space-y-2">
                    {profile?.role === 'user' ? (
                      <>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Administrator reviews your business proposal</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>You'll receive feedback on your proposal</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Upon approval, you'll be assigned to a company</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Full access to Synergetics platform</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Administrator reviews your account</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>You'll be assigned to a company and role</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Email notification will be sent</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>Full access to Synergetics platform</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Auto-refresh enabled</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last checked: {lastChecked.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center sm:text-right max-w-xs">
                  We're automatically checking your status every 30 seconds. You'll be redirected once assigned.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm hover:shadow-md transition-all"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Checking...' : 'Refresh Status'}
              </Button>
              <Button
                variant="outline"
                onClick={signOut}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border-border hover:bg-secondary"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            If you have any questions, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PendingAssignment;