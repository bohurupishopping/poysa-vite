import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Eye, AlertCircle, Download } from 'lucide-react';
import { getBusinessProposalDocumentUrl, downloadBusinessProposalDocument } from '@/utils/businessProposalUtils';
import { toast } from 'sonner';

interface DocumentViewerProps {
    url: string | null;
    title: string;
    filename?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, title, filename }) => {
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadDocument = async () => {
            if (!url) return;

            setLoading(true);
            setError(false);
            try {
                const signedUrl = await getBusinessProposalDocumentUrl(url);
                setDocumentUrl(signedUrl);
            } catch (error) {
                console.error('Error loading document:', error);
                setError(true);
                setDocumentUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadDocument();
    }, [url]);

    const handleDownload = async () => {
        if (!url) return;

        try {
            const downloadFilename = filename || url.split('/').pop() || title;
            await downloadBusinessProposalDocument(url, downloadFilename);
            toast.success(`Downloaded ${downloadFilename}`);
        } catch (error) {
            console.error('Error downloading document:', error);
            toast.error('Failed to download document');
        }
    };

    const handleView = () => {
        if (documentUrl) {
            window.open(documentUrl, '_blank');
        }
    };

    if (!url) {
        return (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No {title} uploaded</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                    <p className="text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !documentUrl) {
        return (
            <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg border border-red-200">
                <div className="text-center text-red-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load {title}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="mt-2"
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Try Download
                    </Button>
                </div>
            </div>
        );
    }

    // Check if it's an image
    const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

    return (
        <div className="relative group">
            {isImage ? (
                <img
                    src={documentUrl}
                    alt={title}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleView}
                    onError={() => setError(true)}
                />
            ) : (
                <div className="flex items-center justify-center h-32 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors" onClick={handleView}>
                    <div className="text-center text-blue-600">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">{title}</p>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleView}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownload}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                    </Button>
                </div>
            </div>
        </div>
    );
};