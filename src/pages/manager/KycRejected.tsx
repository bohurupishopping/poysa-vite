import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, FileText } from 'lucide-react';
import { useKyc } from '@/hooks/useKyc';
import { useNavigate } from 'react-router-dom';

export const KycRejected = () => {
    const navigate = useNavigate();
    const { kycData, loading, resetKyc, refetch } = useKyc();

    const handleResubmit = async () => {
        try {
            await resetKyc();
            navigate('/manager/kyc');
        } catch (error) {
            console.error('Error resetting KYC:', error);
        }
    };

    const handleRefresh = () => {
        refetch();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    if (!kycData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-600">No KYC data found.</p>
                        <Button
                            onClick={() => navigate('/manager/kyc')}
                            className="w-full mt-4"
                        >
                            Complete KYC
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">KYC Application Rejected</h1>
                    <p className="text-gray-600 mt-2">
                        Your KYC application has been rejected. Please review the feedback and resubmit.
                    </p>
                </div>

                <Alert variant="destructive" className="mb-8">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Application Rejected</strong>
                        <br />
                        Your KYC application was rejected on {new Date(kycData.updated_at).toLocaleDateString()}.
                        Please review the reason below and resubmit with corrected information.
                    </AlertDescription>
                </Alert>

                <div className="flex justify-end mb-6">
                    <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh Status
                    </Button>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Rejection Reason
                        </CardTitle>
                        <CardDescription>
                            Please address the following issues before resubmitting your application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">
                                {kycData.rejection_reason || 'No specific reason provided. Please contact support for more details.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Common Rejection Reasons
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900">Document Quality Issues</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    <li>Blurry or unclear document images</li>
                                    <li>Documents not fully visible in the image</li>
                                    <li>Poor lighting or shadows on documents</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Information Mismatch</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    <li>Name on documents doesn't match the provided name</li>
                                    <li>Address information doesn't match documents</li>
                                    <li>Phone number or email verification failed</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Reference Issues</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    <li>References could not be contacted</li>
                                    <li>Reference information is incomplete or incorrect</li>
                                    <li>References did not confirm the relationship</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Document Validity</h4>
                                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                                    <li>Expired documents</li>
                                    <li>Invalid PAN or Aadhar format</li>
                                    <li>Documents appear to be tampered with</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert className="mb-8">
                    <AlertDescription>
                        <strong>Before Resubmitting:</strong>
                        <br />
                        1. Ensure all document images are clear and well-lit
                        <br />
                        2. Verify that all information matches your official documents
                        <br />
                        3. Confirm your references are available and aware they may be contacted
                        <br />
                        4. Double-check that all required fields are filled correctly
                    </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                    <Button onClick={handleResubmit} className="px-8">
                        Resubmit KYC Application
                    </Button>
                </div>
            </div>
        </div>
    );
};