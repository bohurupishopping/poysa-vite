import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, FileText, User, Phone, Mail, MapPin, Users, RefreshCw } from 'lucide-react';
import { useKyc } from '@/hooks/useKyc';
import { useNavigate } from 'react-router-dom';

export const KycPending = () => {
    const navigate = useNavigate();
    const { kycData, references, loading, refetch } = useKyc();

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
                    <h1 className="text-3xl font-bold text-gray-900">KYC Under Review</h1>
                    <p className="text-gray-600 mt-2">
                        Your KYC application is being reviewed. We'll notify you once it's approved.
                    </p>
                </div>

                <Alert className="mb-8">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Status: Pending Review</strong>
                        <br />
                        Your KYC application was submitted on {new Date(kycData.created_at).toLocaleDateString()}.
                        Our team is reviewing your documents and will get back to you within 2-3 business days.
                    </AlertDescription>
                </Alert>

                <div className="flex justify-end mb-6">
                    <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh Status
                    </Button>
                </div>

                {/* Personal Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Legal Full Name</p>
                                <p className="font-medium">{kycData.legal_full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{kycData.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Phone Number</p>
                                <p className="font-medium">{kycData.phone_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">PAN Card Number</p>
                                <p className="font-medium">{kycData.pan_card_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Aadhar Card Number</p>
                                <p className="font-medium">{kycData.aadhar_card_number}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Address Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>{kycData.address?.street}</p>
                            <p>{kycData.address?.city}, {kycData.address?.state} {kycData.address?.postal_code}</p>
                            <p>{kycData.address?.country}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* References */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            References
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {references.map((reference, index) => (
                                <div key={reference.id} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-2">
                                        {reference.reference_type} Reference {index + 1}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Name</p>
                                            <p className="font-medium">{reference.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Relationship</p>
                                            <p className="font-medium">{reference.relationship}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Phone</p>
                                            <p className="font-medium">{reference.phone_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">City</p>
                                            <p className="font-medium">{reference.address?.city}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <AlertDescription>
                        <strong>What happens next?</strong>
                        <br />
                        1. Our team will verify your documents and references
                        <br />
                        2. We may contact your references for verification
                        <br />
                        3. You'll receive an email notification once your KYC is approved
                        <br />
                        4. After approval, you'll gain full access to the manager dashboard
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    );
};