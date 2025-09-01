import { supabase } from '@/integrations/supabase/client';

/**
 * Get a secure URL for business proposal documents
 * For admins, this will return a signed URL that bypasses RLS
 */
export const getBusinessProposalDocumentUrl = async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;

    try {
        // Extract the file path from the full URL if it's already a full URL
        let cleanPath = filePath;
        if (filePath.includes('/storage/v1/object/public/business-proposal-documents/')) {
            cleanPath = filePath.split('/storage/v1/object/public/business-proposal-documents/')[1];
        } else if (filePath.includes('/business-proposal-documents/')) {
            cleanPath = filePath.split('/business-proposal-documents/')[1];
        }

        // For admins, create a signed URL that lasts 1 hour
        const { data, error } = await supabase.storage
            .from('business-proposal-documents')
            .createSignedUrl(cleanPath, 3600); // 1 hour expiry

        if (error) {
            console.error('Error creating signed URL for business proposal document:', error);
            return null;
        }

        return data.signedUrl;
    } catch (error) {
        console.error('Error getting business proposal document URL:', error);
        return null;
    }
};

/**
 * Get multiple business proposal document URLs efficiently
 */
export const getBusinessProposalDocumentUrls = async (documentUrls: string[]): Promise<string[]> => {
    if (!documentUrls || documentUrls.length === 0) return [];

    try {
        const signedUrls = await Promise.all(
            documentUrls.map(url => getBusinessProposalDocumentUrl(url))
        );

        // Filter out null values
        return signedUrls.filter((url): url is string => url !== null);
    } catch (error) {
        console.error('Error getting business proposal document URLs:', error);
        return [];
    }
};

/**
 * Download a business proposal document
 */
export const downloadBusinessProposalDocument = async (filePath: string, filename?: string): Promise<void> => {
    try {
        const signedUrl = await getBusinessProposalDocumentUrl(filePath);

        if (!signedUrl) {
            throw new Error('Failed to get document URL');
        }

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = filename || filePath.split('/').pop() || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading business proposal document:', error);
        throw error;
    }
};