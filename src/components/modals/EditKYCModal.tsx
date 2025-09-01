import { useState, useEffect } from "react";
import { Edit, Save, User, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface KYCRecord {
    id: string;
    profile_id: string;
    status: 'not_submitted' | 'pending_review' | 'approved' | 'rejected';
    legal_full_name: string | null;
    email: string | null;
    phone_number: string | null;
    pan_card_number: string | null;
    aadhar_card_number: string | null;
    address: any;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    profiles: {
        full_name: string | null;
    };
    profile_references: Array<{
        id: string;
        reference_type: string;
        full_name: string;
        relationship: string | null;
        phone_number: string;
        address: any;
    }>;
}

interface EditKYCModalProps {
    kycRecord: KYCRecord;
    onKYCUpdated: () => void;
}

interface KYCFormData {
    legal_full_name: string;
    email: string;
    phone_number: string;
    pan_card_number: string;
    aadhar_card_number: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
    status: 'not_submitted' | 'pending_review' | 'approved' | 'rejected';
}

interface ReferenceFormData {
    reference_type: string;
    full_name: string;
    relationship: string;
    phone_number: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
    };
}

export function EditKYCModal({ kycRecord, onKYCUpdated }: EditKYCModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<KYCFormData>({
        legal_full_name: "",
        email: "",
        phone_number: "",
        pan_card_number: "",
        aadhar_card_number: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: ""
        },
        status: 'not_submitted'
    });
    const [references, setReferences] = useState<ReferenceFormData[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            // Initialize form data
            setFormData({
                legal_full_name: kycRecord.legal_full_name || "",
                email: kycRecord.email || "",
                phone_number: kycRecord.phone_number || "",
                pan_card_number: kycRecord.pan_card_number || "",
                aadhar_card_number: kycRecord.aadhar_card_number || "",
                address: {
                    street: kycRecord.address?.street || "",
                    city: kycRecord.address?.city || "",
                    state: kycRecord.address?.state || "",
                    pincode: kycRecord.address?.pincode || ""
                },
                status: kycRecord.status
            });

            // Initialize references
            setReferences(
                kycRecord.profile_references.map(ref => ({
                    reference_type: ref.reference_type,
                    full_name: ref.full_name,
                    relationship: ref.relationship || "",
                    phone_number: ref.phone_number,
                    address: {
                        street: ref.address?.street || "",
                        city: ref.address?.city || "",
                        state: ref.address?.state || "",
                        pincode: ref.address?.pincode || ""
                    }
                }))
            );
        }
    }, [open, kycRecord]);

    const handleInputChange = (field: keyof KYCFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddressChange = (field: keyof KYCFormData['address'], value: string) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [field]: value }
        }));
    };

    const handleReferenceChange = (index: number, field: keyof ReferenceFormData, value: string) => {
        setReferences(prev => prev.map((ref, i) =>
            i === index ? { ...ref, [field]: value } : ref
        ));
    };

    const handleReferenceAddressChange = (index: number, field: keyof ReferenceFormData['address'], value: string) => {
        setReferences(prev => prev.map((ref, i) =>
            i === index
                ? { ...ref, address: { ...ref.address, [field]: value } }
                : ref
        ));
    };

    const addReference = () => {
        setReferences(prev => [...prev, {
            reference_type: "",
            full_name: "",
            relationship: "",
            phone_number: "",
            address: {
                street: "",
                city: "",
                state: "",
                pincode: ""
            }
        }]);
    };

    const removeReference = (index: number) => {
        setReferences(prev => prev.filter((_, i) => i !== index));
    };

    const validatePAN = (pan: string): boolean => {
        if (!pan) return true; // PAN is optional
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const validateAadhar = (aadhar: string): boolean => {
        if (!aadhar) return true; // Aadhar is optional
        const aadharRegex = /^[0-9]{12}$/;
        return aadharRegex.test(aadhar.replace(/\s/g, ''));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePAN(formData.pan_card_number)) {
            toast({
                title: "Invalid PAN",
                description: "Please enter a valid PAN format (e.g., ABCDE1234F)",
                variant: "destructive",
            });
            return;
        }

        if (!validateAadhar(formData.aadhar_card_number)) {
            toast({
                title: "Invalid Aadhar",
                description: "Please enter a valid 12-digit Aadhar number",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            // Update KYC record
            const { error: kycError } = await supabase
                .from('profile_kyc')
                .update({
                    legal_full_name: formData.legal_full_name || null,
                    email: formData.email || null,
                    phone_number: formData.phone_number || null,
                    pan_card_number: formData.pan_card_number || null,
                    aadhar_card_number: formData.aadhar_card_number || null,
                    address: formData.address,
                    status: formData.status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', kycRecord.id);

            if (kycError) throw kycError;

            // Delete existing references
            const { error: deleteError } = await supabase
                .from('profile_references')
                .delete()
                .eq('kyc_id', kycRecord.id);

            if (deleteError) throw deleteError;

            // Insert new references
            if (references.length > 0) {
                const validReferences = references.filter(ref =>
                    ref.full_name.trim() && ref.phone_number.trim()
                );

                if (validReferences.length > 0) {
                    const { error: referencesError } = await supabase
                        .from('profile_references')
                        .insert(
                            validReferences.map(ref => ({
                                kyc_id: kycRecord.id,
                                reference_type: ref.reference_type,
                                full_name: ref.full_name,
                                relationship: ref.relationship || null,
                                phone_number: ref.phone_number,
                                address: ref.address
                            }))
                        );

                    if (referencesError) throw referencesError;
                }
            }

            toast({
                title: "Success",
                description: "KYC record updated successfully",
            });

            setOpen(false);
            onKYCUpdated();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update KYC record",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit KYC - {kycRecord.profiles?.full_name || 'Unknown User'}
                        </DialogTitle>
                        <DialogDescription>
                            Update user KYC information and references
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_submitted">Not Submitted</SelectItem>
                                    <SelectItem value="pending_review">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Personal Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="legal_full_name">Legal Full Name</Label>
                                    <Input
                                        id="legal_full_name"
                                        value={formData.legal_full_name}
                                        onChange={(e) => handleInputChange("legal_full_name", e.target.value)}
                                        placeholder="Enter legal full name"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone_number">Phone Number</Label>
                                        <Input
                                            id="phone_number"
                                            value={formData.phone_number}
                                            onChange={(e) => handleInputChange("phone_number", e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label>Address</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            placeholder="Street Address"
                                            value={formData.address.street}
                                            onChange={(e) => handleAddressChange("street", e.target.value)}
                                        />
                                        <Input
                                            placeholder="City"
                                            value={formData.address.city}
                                            onChange={(e) => handleAddressChange("city", e.target.value)}
                                        />
                                        <Input
                                            placeholder="State"
                                            value={formData.address.state}
                                            onChange={(e) => handleAddressChange("state", e.target.value)}
                                        />
                                        <Input
                                            placeholder="Pincode"
                                            value={formData.address.pincode}
                                            onChange={(e) => handleAddressChange("pincode", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Identity Documents */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Identity Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="pan_card_number">PAN Card Number</Label>
                                        <Input
                                            id="pan_card_number"
                                            value={formData.pan_card_number}
                                            onChange={(e) => handleInputChange("pan_card_number", e.target.value.toUpperCase())}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="aadhar_card_number">Aadhar Card Number</Label>
                                        <Input
                                            id="aadhar_card_number"
                                            value={formData.aadhar_card_number}
                                            onChange={(e) => handleInputChange("aadhar_card_number", e.target.value.replace(/\D/g, ''))}
                                            placeholder="123456789012"
                                            maxLength={12}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* References */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {references.map((reference, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium">Reference {index + 1}</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeReference(index)}
                                            >
                                                Remove
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                placeholder="Full Name"
                                                value={reference.full_name}
                                                onChange={(e) => handleReferenceChange(index, "full_name", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Reference Type"
                                                value={reference.reference_type}
                                                onChange={(e) => handleReferenceChange(index, "reference_type", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Relationship"
                                                value={reference.relationship}
                                                onChange={(e) => handleReferenceChange(index, "relationship", e.target.value)}
                                            />
                                            <Input
                                                placeholder="Phone Number"
                                                value={reference.phone_number}
                                                onChange={(e) => handleReferenceChange(index, "phone_number", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm">Address</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <Input
                                                    placeholder="Street"
                                                    value={reference.address.street}
                                                    onChange={(e) => handleReferenceAddressChange(index, "street", e.target.value)}
                                                />
                                                <Input
                                                    placeholder="City"
                                                    value={reference.address.city}
                                                    onChange={(e) => handleReferenceAddressChange(index, "city", e.target.value)}
                                                />
                                                <Input
                                                    placeholder="State"
                                                    value={reference.address.state}
                                                    onChange={(e) => handleReferenceAddressChange(index, "state", e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Pincode"
                                                    value={reference.address.pincode}
                                                    onChange={(e) => handleReferenceAddressChange(index, "pincode", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addReference}
                                    className="w-full"
                                >
                                    Add Reference
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}