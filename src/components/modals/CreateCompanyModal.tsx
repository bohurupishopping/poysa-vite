import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import type { BusinessProposal } from "@/types/business-proposal";

interface CreateCompanyModalProps {
  onCompanyCreated?: () => void;
  triggerClassName?: string;
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

export function CreateCompanyModal({ onCompanyCreated, triggerClassName }: CreateCompanyModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposals, setProposals] = useState<BusinessProposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
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

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Fetch approved business proposals for import (optional)
  useEffect(() => {
    if (!open) return;
    const fetchProposals = async () => {
      try {
        setProposalLoading(true);
        const { data, error } = await supabase
          .from("business_proposals")
          .select(
            [
              "id",
              "company_name",
              "full_name",
              "phone",
              "email",
              "address_line_1",
              "address_line_2",
              "city",
              "state_province",
              "postal_code",
              "country",
              "is_gst_registered",
              "gstin",
              "status",
              "created_at"
            ].join(",")
          )
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProposals((data as unknown as BusinessProposal[]) || []);
      } catch (err: any) {
        console.error("Failed to load proposals", err);
        toast({ title: "Error", description: err.message || "Failed to load proposals", variant: "destructive" });
      } finally {
        setProposalLoading(false);
      }
    };

    fetchProposals();
  }, [open, toast]);

  const handleSelectProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const pickedPhone = proposal.contact_phone || proposal.phone || "";
    const pickedEmail = proposal.contact_email || proposal.email || "";
    const pickedGSTIN = proposal.is_gst_registered ? (proposal.gstin || "") : "";

    setFormData(prev => ({
      ...prev,
      name: proposal.company_name || prev.name,
      business_type: proposal.business_type || prev.business_type,
      address_line_1: proposal.address_line_1 || prev.address_line_1,
      address_line_2: proposal.address_line_2 || prev.address_line_2,
      city: proposal.city || prev.city,
      state: proposal.state_province || prev.state,
      postal_code: proposal.postal_code || prev.postal_code,
      phone: pickedPhone || prev.phone,
      email: pickedEmail || prev.email,
      gstin: pickedGSTIN || prev.gstin,
      website: prev.website,
      pan_number: prev.pan_number,
      tan_number: prev.tan_number,
      cin_number: prev.cin_number,
    }));
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
        .insert([{
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
          business_type: formData.business_type || null,
          country: 'India'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company created successfully",
      });

      setFormData({
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
      setOpen(false);
      onCompanyCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" className={triggerClassName}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company to the system. This will create a new tenant for managing financial data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Import from Business Proposal (optional) */}
            <div className="space-y-2">
              <Label htmlFor="proposal">Import from Business Proposal</Label>
              <Select
                value={selectedProposalId}
                onValueChange={(value) => handleSelectProposal(value)}
                disabled={proposalLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={proposalLoading ? "Loading proposals..." : "Select a proposal (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {proposals.length === 0 ? (
                    <SelectItem disabled value="__no_proposals__">No approved proposals</SelectItem>
                  ) : (
                    proposals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.company_name} — {p.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selecting a proposal will auto-fill the form. You can still edit fields.</p>
            </div>

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
              {loading ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}