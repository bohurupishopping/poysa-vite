import { supabase } from '@/integrations/supabase/client';

/**
 * Get a secure URL for KYC documents
 * For admins and managers, this will return a signed URL that bypasses RLS
 * For users viewing their own documents, this returns the public URL
 */
export const getKycDocumentUrl = async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;

    try {
        // Extract the file path from the full URL if it's already a full URL
        let cleanPath = filePath;
        if (filePath.includes('/storage/v1/object/public/kyc/')) {
            cleanPath = filePath.split('/storage/v1/object/public/kyc/')[1];
        } else if (filePath.includes('/kyc/')) {
            cleanPath = filePath.split('/kyc/')[1];
        }

        // For admins and managers, create a signed URL that lasts 1 hour
        const { data, error } = await supabase.storage
            .from('kyc')
            .createSignedUrl(cleanPath, 3600); // 1 hour expiry

        if (error) {
            console.error('Error creating signed URL:', error);
            // Fallback to public URL
            const { data: { publicUrl } } = supabase.storage
                .from('kyc')
                .getPublicUrl(cleanPath);
            return publicUrl;
        }

        return data.signedUrl;
    } catch (error) {
        console.error('Error getting KYC document URL:', error);
        return null;
    }
};

/**
 * Get multiple KYC document URLs efficiently
 */
export const getKycDocumentUrls = async (record: {
    pan_card_image_url: string | null;
    aadhar_card_front_url: string | null;
    aadhar_card_back_url: string | null;
    profile_photo_url: string | null;
}): Promise<{
    pan_card_image_url: string | null;
    aadhar_card_front_url: string | null;
    aadhar_card_back_url: string | null;
    profile_photo_url: string | null;
}> => {
    const [panUrl, aadharFrontUrl, aadharBackUrl, profilePhotoUrl] = await Promise.all([
        getKycDocumentUrl(record.pan_card_image_url),
        getKycDocumentUrl(record.aadhar_card_front_url),
        getKycDocumentUrl(record.aadhar_card_back_url),
        getKycDocumentUrl(record.profile_photo_url),
    ]);

    return {
        pan_card_image_url: panUrl,
        aadhar_card_front_url: aadharFrontUrl,
        aadhar_card_back_url: aadharBackUrl,
        profile_photo_url: profilePhotoUrl,
    };
};