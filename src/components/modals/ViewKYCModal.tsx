import { useState } from "react";
import { Eye, CheckCircle, XCircle, User, Phone, Mail, MapPin, CreditCard, FileText } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

interface ViewKYCModalProps {
    kycRecord: KYCRecord;
    onStatusUpdate: (kycId: string, status: 'approved' | 'rejected', rejectionReason?: string) => void;
}

export function ViewKYCModal({ kycRecord, onStatusUpdate }: ViewKYCModalProps) {
    const [open, setOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionForm, setShowRejectionForm] = useState(false);

    const handleApprove = () => {
        onStatusUpdate(kycRecord.id, 'approved');
        setOpen(false);
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            return;
        }
        onStatusUpdate(kycRecord.id, 'rejected', rejectionReason);
        setOpen(false);
        setShowRejectionForm(false);
        setRejectionReason("");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'pending_review':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
            case 'not_submitted':
                return <Badge variant="outline">Not Submitted</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatAddress = (address: any) => {
        if (!address) return 'Not provided';
        if (typeof address === 'string') return address;

        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);

        return parts.length > 0 ? parts.join(', ') : 'Not provided';
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        KYC Details - {kycRecord.profiles?.full_name || 'Unknown User'}
                    </DialogTitle>
                    <DialogDescription>
                        Review and manage user KYC submission
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Basic Info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Current Status</p>
                            {getStatusBadge(kycRecord.status)}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Submitted</p>
                            <p className="text-sm font-medium">{new Date(kycRecord.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Legal Full Name</Label>
                                    <p className="text-sm">{kycRecord.legal_full_name || 'Not provided'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Profile Name</Label>
                                    <p className="text-sm">{kycRecord.profiles?.full_name || 'Not provided'}</p>
                                </div>
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
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        Email
                                    </Label>
                                    <p className="text-sm">{kycRecord.email || 'Not provided'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        Phone Number
                                    </Label>
                                    <p className="text-sm">{kycRecord.phone_number || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Address
                                </Label>
                                <p className="text-sm">{formatAddress(kycRecord.address)}</p>
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
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">PAN Card Number</Label>
                                    <p className="text-sm font-mono">{kycRecord.pan_card_number || 'Not provided'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Aadhar Card Number</Label>
                                    <p className="text-sm font-mono">
                                        {kycRecord.aadhar_card_number
                                            ? `****-****-${kycRecord.aadhar_card_number.slice(-4)}`
                                            : 'Not provided'
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* References */}
                    {kycRecord.profile_references && kycRecord.profile_references.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    References ({kycRecord.profile_references.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {kycRecord.profile_references.map((reference, index) => (
                                        <div key={reference.id} className="border rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                                    <p className="text-sm">{reference.full_name}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                                                    <p className="text-sm">{reference.reference_type}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Relationship</Label>
                                                    <p className="text-sm">{reference.relationship || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                                                    <p className="text-sm">{reference.phone_number}</p>
                                                </div>
                                                {reference.address && (
                                                    <div className="md:col-span-2">
                                                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                                                        <p className="text-sm">{formatAddress(reference.address)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rejection Reason (if rejected) */}
                    {kycRecord.status === 'rejected' && kycRecord.rejection_reason && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                                    <XCircle className="h-4 w-4" />
                                    Rejection Reason
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-700">{kycRecord.rejection_reason}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rejection Form */}
                    {showRejectionForm && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-lg text-red-700">Reject KYC</CardTitle>
                                <CardDescription>Please provide a reason for rejection</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                    <Textarea
                                        id="rejection-reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Please provide a detailed reason for rejection..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>

                    {kycRecord.status === 'pending_review' && (
                        <>
                            {!showRejectionForm ? (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowRejectionForm(true)}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button onClick={handleApprove}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowRejectionForm(false);
                                            setRejectionReason("");
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        disabled={!rejectionReason.trim()}
                                    >
                                        Confirm Rejection
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}