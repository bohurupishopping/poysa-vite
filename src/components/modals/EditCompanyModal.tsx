import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Company {
    id: string;
    name: string;
    state: string | null;
    gstin: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    pan_number: string | null;
    tan_number: string | null;
    cin_number: string | null;
    business_type: string | null;
    created_at: string;
    deleted_at: string | null;
}

interface EditCompanyModalProps {
    company: Company;
    onCompanyUpdated?: () => void;
}

interface CompanyFormData {
    name: string;
    state: string;
    gstin: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    postal_code: string;
    phone: string;
    email: string;
    website: string;
    pan_number: string;
    tan_number: string;
    cin_number: string;
    business_type: string;
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Puducherry"
];

const BUSINESS_TYPES = [
    "Private Limited Company",
    "Public Limited Company",
    "Limited Liability Partnership (LLP)",
    "Partnership Firm",
    "Sole Proprietorship",
    "One Person Company (OPC)",
    "Section 8 Company",
    "Producer Company",
    "Nidhi Company",
    "Trust",
    "Society",
    "Other"
];

export function EditCompanyModal({ company, onCompanyUpdated }: EditCompanyModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CompanyFormData>({
        name: "",
        state: "",
        gstin: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        postal_code: "",
        phone: "",
        email: "",
        website: "",
        pan_number: "",
        tan_number: "",
        cin_number: "",
        business_type: ""
    });
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setFormData({
                name: company.name,
                state: company.state || "",
                gstin: company.gstin || "",
                address_line_1: company.address_line_1 || "",
                address_line_2: company.address_line_2 || "",
                city: company.city || "",
                postal_code: company.postal_code || "",
                phone: company.phone || "",
                email: company.email || "",
                website: company.website || "",
                pan_number: company.pan_number || "",
                tan_number: company.tan_number || "",
                cin_number: company.cin_number || "",
                business_type: company.business_type || ""
            });
        }
    }, [open, company]);

    const handleInputChange = (field: keyof CompanyFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateGSTIN = (gstin: string): boolean => {
        if (!gstin) return true; // GSTIN is optional
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    };

    const validatePAN = (pan: string): boolean => {
        if (!pan) return true; // PAN is optional
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    };

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        if (formData.gstin && !validateGSTIN(formData.gstin)) {
            toast({
                title: "Invalid GSTIN",
                description: "Please enter a valid GSTIN format",
                variant: "destructive",
            });
            return;
        }

        if (formData.pan_number && !validatePAN(formData.pan_number)) {
            toast({
                title: "Invalid PAN",
                description: "Please enter a valid PAN format (e.g., ABCDE1234F)",
                variant: "destructive",
            });
            return;
        }

        if (formData.email && !validateEmail(formData.email)) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name.trim(),
                    state: formData.state || null,
                    gstin: formData.gstin || null,
                    address_line_1: formData.address_line_1 || null,
                    address_line_2: formData.address_line_2 || null,
                    city: formData.city || null,
                    postal_code: formData.postal_code || null,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    website: formData.website || null,
                    pan_number: formData.pan_number || null,
                    tan_number: formData.tan_number || null,
                    cin_number: formData.cin_number || null,
                    business_type: formData.business_type || null
                })
                .eq('id', company.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Company updated successfully",
            });

            setOpen(false);
            onCompanyUpdated?.();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update company",
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Company</DialogTitle>
                        <DialogDescription>
                            Update company information. Changes will be reflected across the system.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">
                                        Company Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Enter company name"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="business_type">Business Type</Label>
                                        <Select value={formData.business_type} onValueChange={(value) => handleInputChange("business_type", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select business type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BUSINESS_TYPES.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="state">State</Label>
                                        <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INDIAN_STATES.map((state) => (
                                                    <SelectItem key={state} value={state}>
                                                        {state}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Address Information</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="address_line_1">Address Line 1</Label>
                                    <Input
                                        id="address_line_1"
                                        value={formData.address_line_1}
                                        onChange={(e) => handleInputChange("address_line_1", e.target.value)}
                                        placeholder="Building, Street"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="address_line_2">Address Line 2</Label>
                                    <Input
                                        id="address_line_2"
                                        value={formData.address_line_2}
                                        onChange={(e) => handleInputChange("address_line_2", e.target.value)}
                                        placeholder="Area, Landmark"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange("city", e.target.value)}
                                            placeholder="Enter city"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="postal_code">Postal Code</Label>
                                        <Input
                                            id="postal_code"
                                            value={formData.postal_code}
                                            onChange={(e) => handleInputChange("postal_code", e.target.value)}
                                            placeholder="Enter postal code"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

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
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) => handleInputChange("website", e.target.value)}
                                        placeholder="https://www.example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tax Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Tax Information</h3>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gstin">GSTIN</Label>
                                    <Input
                                        id="gstin"
                                        value={formData.gstin}
                                        onChange={(e) => handleInputChange("gstin", e.target.value.toUpperCase())}
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength={15}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        15-character GSTIN format (optional)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="pan_number">PAN Number</Label>
                                        <Input
                                            id="pan_number"
                                            value={formData.pan_number}
                                            onChange={(e) => handleInputChange("pan_number", e.target.value.toUpperCase())}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tan_number">TAN Number</Label>
                                        <Input
                                            id="tan_number"
                                            value={formData.tan_number}
                                            onChange={(e) => handleInputChange("tan_number", e.target.value.toUpperCase())}
                                            placeholder="ABCD12345E"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cin_number">CIN Number</Label>
                                    <Input
                                        id="cin_number"
                                        value={formData.cin_number}
                                        onChange={(e) => handleInputChange("cin_number", e.target.value.toUpperCase())}
                                        placeholder="U12345AB1234PTC123456"
                                        maxLength={21}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Corporate Identity Number (for companies)
                                    </p>
                                </div>
                            </div>
                        </div>
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
                        <Button type="submit" disabled={loading || !formData.name.trim()}>
                            {loading ? "Updating..." : "Update Company"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}