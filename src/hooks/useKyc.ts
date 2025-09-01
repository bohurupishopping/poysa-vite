import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type KycStatus = Database['public']['Enums']['kyc_status'];
type KycData = Database['public']['Tables']['profile_kyc']['Row'];
type ReferenceData = Database['public']['Tables']['profile_references']['Row'];

export const useKyc = () => {
    const { user } = useAuth();
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [references, setReferences] = useState<ReferenceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKycData = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setError(null);

            // Fetch KYC data
            const { data: kyc, error: kycError } = await supabase
                .from('profile_kyc')
                .select('*')
                .eq('profile_id', user.id)
                .single();

            if (kycError && kycError.code !== 'PGRST116') { // PGRST116 is "not found"
                throw kycError;
            }

            setKycData(kyc);

            // Fetch references if KYC exists
            if (kyc) {
                const { data: refs, error: refsError } = await supabase
                    .from('profile_references')
                    .select('*')
                    .eq('kyc_id', kyc.id);

                if (refsError) throw refsError;
                setReferences(refs || []);
            }
        } catch (err) {
            console.error('Error fetching KYC data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch KYC data');
        } finally {
            setLoading(false);
        }
    };

    const submitKyc = async (formData: any, documents: any) => {
        if (!user?.id) throw new Error('User not authenticated');

        try {
            // Upload documents
            const documentUrls: Record<string, string> = {};

            for (const [key, file] of Object.entries(documents)) {
                if (file && file instanceof File) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${key}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('kyc')
                        .upload(fileName, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('kyc')
                        .getPublicUrl(fileName);

                    documentUrls[`${key}_url`] = publicUrl;
                }
            }

            // Insert or update KYC data
            const kycPayload = {
                profile_id: user.id,
                legal_full_name: formData.legal_full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                pan_card_number: formData.pan_card_number,
                aadhar_card_number: formData.aadhar_card_number,
                address: formData.address,
                status: 'pending_review' as KycStatus,
                ...documentUrls
            };

            const { data: kycResult, error: kycError } = await supabase
                .from('profile_kyc')
                .upsert(kycPayload)
                .select()
                .single();

            if (kycError) throw kycError;

            // Delete existing references and insert new ones
            if (kycData?.id) {
                await supabase
                    .from('profile_references')
                    .delete()
                    .eq('kyc_id', kycData.id);
            }

            // Insert references
            const referencesData = formData.references.map((ref: any) => ({
                kyc_id: kycResult.id,
                reference_type: ref.reference_type,
                full_name: ref.full_name,
                relationship: ref.relationship,
                phone_number: ref.phone_number,
                address: ref.address
            }));

            const { error: referencesError } = await supabase
                .from('profile_references')
                .insert(referencesData);

            if (referencesError) throw referencesError;

            // Refresh data
            await fetchKycData();

            return kycResult;
        } catch (error) {
            console.error('Error submitting KYC:', error);
            throw error;
        }
    };

    const resetKyc = async () => {
        if (!kycData?.id) throw new Error('No KYC data to reset');

        try {
            const { error } = await supabase
                .from('profile_kyc')
                .update({
                    status: 'not_submitted' as KycStatus,
                    rejection_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', kycData.id);

            if (error) throw error;

            await fetchKycData();
        } catch (error) {
            console.error('Error resetting KYC:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchKycData();
    }, [user?.id]);

    return {
        kycData,
        references,
        loading,
        error,
        submitKyc,
        resetKyc,
        refetch: fetchKycData
    };
};