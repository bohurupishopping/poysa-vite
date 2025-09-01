import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, User, Phone, Mail, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useKyc } from '@/hooks/useKyc';
import { toast } from 'sonner';

interface KycFormData {
    legal_full_name: string;
    email: string;
    phone_number: string;
    pan_card_number: string;
    aadhar_card_number: string;
    address: {
        street: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    references: Array<{
        reference_type: string;
        full_name: string;
        relationship: string;
        phone_number: string;
        address: {
            street: string;
            city: string;
            state: string;
            postal_code: string;
        };
    }>;
}

interface DocumentFiles {
    pan_card_image: File | null;
    aadhar_card_front: File | null;
    aadhar_card_back: File | null;
    profile_photo: File | null;
}

export const KycForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { submitKyc } = useKyc();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<KycFormData>({
        legal_full_name: '',
        email: user?.email || '',
        phone_number: '',
        pan_card_number: '',
        aadhar_card_number: '',
        address: {
            street: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'India'
        },
        references: [
            {
                reference_type: 'Personal',
                full_name: '',
                relationship: '',
                phone_number: '',
                address: { street: '', city: '', state: '', postal_code: '' }
            },
            {
                reference_type: 'Professional',
                full_name: '',
                relationship: '',
                phone_number: '',
                address: { street: '', city: '', state: '', postal_code: '' }
            }
        ]
    });

    const [documents, setDocuments] = useState<DocumentFiles>({
        pan_card_image: null,
        aadhar_card_front: null,
        aadhar_card_back: null,
        profile_photo: null
    });

    const handleInputChange = (field: string, value: string) => {
        if (field.startsWith('address.')) {
            const addressField = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                address: { ...prev.address, [addressField]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleReferenceChange = (index: number, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            references: prev.references.map((ref, i) => {
                if (i === index) {
                    if (field.startsWith('address.')) {
                        const addressField = field.split('.')[1];
                        return {
                            ...ref,
                            address: { ...ref.address, [addressField]: value }
                        };
                    }
                    return { ...ref, [field]: value };
                }
                return ref;
            })
        }));
    };

    const handleFileChange = (field: keyof DocumentFiles, file: File | null) => {
        setDocuments(prev => ({ ...prev, [field]: file }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;

        setLoading(true);
        try {
            await submitKyc(formData, documents);
            toast.success('KYC submitted successfully! Please wait for approval.');
            navigate('/manager/kyc-pending');
        } catch (error) {
            console.error('Error submitting KYC:', error);
            toast.error('Failed to submit KYC. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Complete Your KYC</h1>
                    <p className="text-gray-600 mt-2">
                        Please provide your details and documents to complete the verification process.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Provide your basic personal details as per official documents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="legal_full_name">Legal Full Name *</Label>
                                    <Input
                                        id="legal_full_name"
                                        value={formData.legal_full_name}
                                        onChange={(e) => handleInputChange('legal_full_name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone_number">Phone Number *</Label>
                                    <Input
                                        id="phone_number"
                                        value={formData.phone_number}
                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="pan_card_number">PAN Card Number *</Label>
                                    <Input
                                        id="pan_card_number"
                                        value={formData.pan_card_number}
                                        onChange={(e) => handleInputChange('pan_card_number', e.target.value.toUpperCase())}
                                        placeholder="ABCDE1234F"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="aadhar_card_number">Aadhar Card Number *</Label>
                                    <Input
                                        id="aadhar_card_number"
                                        value={formData.aadhar_card_number}
                                        onChange={(e) => handleInputChange('aadhar_card_number', e.target.value)}
                                        placeholder="1234 5678 9012"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Address Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="address_street">Street Address *</Label>
                                <Textarea
                                    id="address_street"
                                    value={formData.address.street}
                                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="address_city">City *</Label>
                                    <Input
                                        id="address_city"
                                        value={formData.address.city}
                                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address_state">State *</Label>
                                    <Input
                                        id="address_state"
                                        value={formData.address.state}
                                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address_postal_code">Postal Code *</Label>
                                    <Input
                                        id="address_postal_code"
                                        value={formData.address.postal_code}
                                        onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="address_country">Country *</Label>
                                    <Input
                                        id="address_country"
                                        value={formData.address.country}
                                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Document Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Document Upload
                            </CardTitle>
                            <CardDescription>
                                Upload clear images of your documents. Accepted formats: JPG, PNG, PDF (max 5MB each)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: 'pan_card_image', label: 'PAN Card Image *', required: true },
                                    { key: 'aadhar_card_front', label: 'Aadhar Card Front *', required: true },
                                    { key: 'aadhar_card_back', label: 'Aadhar Card Back *', required: true },
                                    { key: 'profile_photo', label: 'Profile Photo *', required: true }
                                ].map(({ key, label, required }) => (
                                    <div key={key}>
                                        <Label htmlFor={key}>{label}</Label>
                                        <div className="mt-1">
                                            <Input
                                                id={key}
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleFileChange(key as keyof DocumentFiles, e.target.files?.[0] || null)}
                                                required={required}
                                            />
                                            {documents[key as keyof DocumentFiles] && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    ✓ {documents[key as keyof DocumentFiles]?.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* References */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                References
                            </CardTitle>
                            <CardDescription>
                                Provide two references - one personal and one professional.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {formData.references.map((reference, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h4 className="font-medium mb-4">
                                        {reference.reference_type} Reference {index + 1}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Full Name *</Label>
                                            <Input
                                                value={reference.full_name}
                                                onChange={(e) => handleReferenceChange(index, 'full_name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Relationship *</Label>
                                            <Input
                                                value={reference.relationship}
                                                onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                                                placeholder="Friend, Colleague, etc."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>Phone Number *</Label>
                                            <Input
                                                value={reference.phone_number}
                                                onChange={(e) => handleReferenceChange(index, 'phone_number', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label>City *</Label>
                                            <Input
                                                value={reference.address.city}
                                                onChange={(e) => handleReferenceChange(index, 'address.city', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Alert>
                        <AlertDescription>
                            By submitting this form, you confirm that all information provided is accurate and complete.
                            False information may result in rejection of your application.
                        </AlertDescription>
                    </Alert>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading} className="px-8">
                            {loading ? 'Submitting...' : 'Submit KYC'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};