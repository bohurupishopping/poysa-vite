import { useEffect, useState } from "react";
import { Shield, Eye, CheckCircle, XCircle, Edit, User, Search, FileText, Image, Download, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getKycDocumentUrl, getKycDocumentUrls } from "@/utils/kycUtils";

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
    pan_card_image_url: string | null;
    aadhar_card_front_url: string | null;
    aadhar_card_back_url: string | null;
    profile_photo_url: string | null;
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

interface KYCStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    notSubmitted: number;
}

// Profile Photo Component for table
const ProfilePhoto = ({ url }: { url: string | null }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadImage = async () => {
            if (!url) return;

            setLoading(true);
            try {
                const signedUrl = await getKycDocumentUrl(url);
                setImageUrl(signedUrl);
            } catch (error) {
                console.error('Error loading profile photo:', error);
                setImageUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [url]);

    if (!url || !imageUrl) {
        return (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt="Profile"
            className="h-8 w-8 rounded-full object-cover border"
            onError={() => setImageUrl(null)}
        />
    );
};

// Document Viewer Component
const DocumentViewer = ({ url, title }: { url: string | null; title: string }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadImage = async () => {
            if (!url) return;

            setLoading(true);
            try {
                const signedUrl = await getKycDocumentUrl(url);
                setImageUrl(signedUrl);
            } catch (error) {
                console.error('Error loading image:', error);
                setImageUrl(null);
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [url]);

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

    if (!imageUrl) {
        return (
            <div className="flex items-center justify-center h-32 bg-red-50 rounded-lg border border-red-200">
                <div className="text-center text-red-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Failed to load {title}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(imageUrl, '_blank')}
                onError={() => setImageUrl(null)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                </Button>
            </div>
        </div>
    );
};

// KYC Detail Modal Component
const KYCDetailModal = ({ record, onStatusUpdate }: { record: KYCRecord; onStatusUpdate: (id: string, status: 'approved' | 'rejected', reason?: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await onStatusUpdate(record.id, 'approved');
            setIsOpen(false);
            toast.success('KYC approved successfully');
        } catch (error) {
            toast.error('Failed to approve KYC');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setIsProcessing(true);
        try {
            await onStatusUpdate(record.id, 'rejected', rejectionReason);
            setIsOpen(false);
            setRejectionReason('');
            toast.success('KYC rejected successfully');
        } catch (error) {
            toast.error('Failed to reject KYC');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        KYC Review - {record.profiles?.full_name || 'Unknown User'}
                    </DialogTitle>
                    <DialogDescription>
                        Review the submitted KYC documents and information
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Current Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    {record.status === 'pending_review' && <Clock className="h-4 w-4 text-yellow-600" />}
                                    {record.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                    {record.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                                    <Badge variant={
                                        record.status === 'approved' ? 'default' :
                                            record.status === 'rejected' ? 'destructive' :
                                                record.status === 'pending_review' ? 'secondary' : 'outline'
                                    }>
                                        {record.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Submitted: {new Date(record.created_at).toLocaleDateString()}
                                </p>
                                {record.updated_at !== record.created_at && (
                                    <p className="text-sm text-gray-600">
                                        Updated: {new Date(record.updated_at).toLocaleDateString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Profile Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium">Profile Name</p>
                                    <p className="text-sm text-gray-600">{record.profiles?.full_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Legal Name</p>
                                    <p className="text-sm text-gray-600">{record.legal_full_name || 'N/A'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Email</Label>
                                    <p className="text-sm text-gray-600">{record.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Phone Number</Label>
                                    <p className="text-sm text-gray-600">{record.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">PAN Card Number</Label>
                                    <p className="text-sm text-gray-600">{record.pan_card_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Aadhar Card Number</Label>
                                    <p className="text-sm text-gray-600">{record.aadhar_card_number || 'N/A'}</p>
                                </div>
                            </div>

                            {record.address && (
                                <div className="mt-4">
                                    <Label className="text-sm font-medium">Address</Label>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {record.address.street && <p>{record.address.street}</p>}
                                        <p>
                                            {[record.address.city, record.address.state, record.address.postal_code]
                                                .filter(Boolean).join(', ')}
                                        </p>
                                        {record.address.country && <p>{record.address.country}</p>}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Uploaded Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Profile Photo</Label>
                                    <DocumentViewer url={record.profile_photo_url} title="Profile Photo" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">PAN Card</Label>
                                    <DocumentViewer url={record.pan_card_image_url} title="PAN Card" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Aadhar Card (Front)</Label>
                                    <DocumentViewer url={record.aadhar_card_front_url} title="Aadhar Card Front" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Aadhar Card (Back)</Label>
                                    <DocumentViewer url={record.aadhar_card_back_url} title="Aadhar Card Back" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* References */}
                    {record.profile_references && record.profile_references.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    References
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {record.profile_references.map((ref, index) => (
                                        <div key={ref.id} className="border rounded-lg p-4">
                                            <h4 className="font-medium mb-2">
                                                {ref.reference_type} Reference {index + 1}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <Label className="font-medium">Name</Label>
                                                    <p className="text-gray-600">{ref.full_name}</p>
                                                </div>
                                                <div>
                                                    <Label className="font-medium">Relationship</Label>
                                                    <p className="text-gray-600">{ref.relationship || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <Label className="font-medium">Phone</Label>
                                                    <p className="text-gray-600">{ref.phone_number}</p>
                                                </div>
                                                <div>
                                                    <Label className="font-medium">City</Label>
                                                    <p className="text-gray-600">{ref.address?.city || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rejection Reason (if rejected) */}
                    {record.status === 'rejected' && record.rejection_reason && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Rejection Reason
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-800 text-sm">{record.rejection_reason}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    {record.status === 'pending_review' && (
                        <div className="flex flex-col gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                                <Textarea
                                    id="rejection-reason"
                                    placeholder="Provide a detailed reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {isProcessing ? 'Rejecting...' : 'Reject KYC'}
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {isProcessing ? 'Approving...' : 'Approve KYC'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function UserKYC() {
    const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<KYCRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stats, setStats] = useState<KYCStats>({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        notSubmitted: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchKYCRecords = async () => {
        try {
            const { data, error } = await supabase
                .from('profile_kyc')
                .select(`
                    *,
                    profiles (full_name),
                    profile_references (*)
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setKycRecords(data);
                setFilteredRecords(data);

                // Calculate stats
                const statsData = data.reduce((acc, record) => {
                    acc.total++;
                    switch (record.status) {
                        case 'pending_review':
                            acc.pending++;
                            break;
                        case 'approved':
                            acc.approved++;
                            break;
                        case 'rejected':
                            acc.rejected++;
                            break;
                        case 'not_submitted':
                            acc.notSubmitted++;
                            break;
                    }
                    return acc;
                }, { total: 0, pending: 0, approved: 0, rejected: 0, notSubmitted: 0 });

                setStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching KYC records:', error);
            toast.error('Failed to fetch KYC records');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (kycId: string, newStatus: 'approved' | 'rejected', rejectionReason?: string) => {
        try {
            const updateData: any = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'rejected' && rejectionReason) {
                updateData.rejection_reason = rejectionReason;
            } else if (newStatus === 'approved') {
                updateData.rejection_reason = null;
            }

            const { error } = await supabase
                .from('profile_kyc')
                .update(updateData)
                .eq('id', kycId);

            if (error) throw error;

            await fetchKYCRecords();
        } catch (error: any) {
            throw new Error(error.message || `Failed to ${newStatus} KYC`);
        }
    };

    useEffect(() => {
        fetchKYCRecords();
    }, []);

    // Filter records based on search term and status
    useEffect(() => {
        let filtered = kycRecords;

        if (searchTerm) {
            filtered = filtered.filter(record =>
                record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.legal_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                record.phone_number?.includes(searchTerm)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(record => record.status === statusFilter);
        }

        setFilteredRecords(filtered);
    }, [searchTerm, statusFilter, kycRecords]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge variant="default">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            case 'pending_review':
                return <Badge variant="secondary">Pending Review</Badge>;
            case 'not_submitted':
                return <Badge variant="outline">Not Submitted</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading KYC records...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-600" />
                            KYC Management
                        </h1>
                        <p className="text-gray-600">Review and manage user KYC submissions and document verification</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search and Filter in same row as buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search users, names, emails..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status ({stats.total})</SelectItem>
                                    <SelectItem value="pending_review">Pending Review ({stats.pending})</SelectItem>
                                    <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
                                    <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
                                    <SelectItem value="not_submitted">Not Submitted ({stats.notSubmitted})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                variant="outline"
                                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-colors"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                            <Button
                                onClick={fetchKYCRecords}
                                variant="outline"
                                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Refresh</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Legend */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Document Status Legend:</p>
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>Profile Photo</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>PAN Card</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span>Aadhar Front</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span>Aadhar Back</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total KYC</CardTitle>
                        <User className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{stats.total}</div>
                        <p className="text-xs text-blue-600/70">All submissions</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700">Pending Review</CardTitle>
                        <Eye className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{stats.pending}</div>
                        <p className="text-xs text-orange-600/70">Awaiting review</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Approved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{stats.approved}</div>
                        <p className="text-xs text-green-600/70">Verified users</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-red-700">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-red-900 mb-1">{stats.rejected}</div>
                        <p className="text-xs text-red-600/70">Failed verification</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Not Submitted</CardTitle>
                        <User className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{stats.notSubmitted}</div>
                        <p className="text-xs text-purple-600/70">Pending submission</p>
                    </CardContent>
                </Card>
            </div>

            {/* KYC Records Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">User</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Legal Name</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Contact</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Documents</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Submitted</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 px-8">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                <span className="ml-2">Loading KYC records...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 px-8">
                                            <div className="max-w-md mx-auto">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <Search className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No KYC records found</h3>
                                                <p className="text-gray-600 mb-6">
                                                    {searchTerm || statusFilter !== 'all'
                                                        ? 'Try adjusting your search criteria or clear filters to see all records'
                                                        : 'No KYC records have been submitted yet'
                                                    }
                                                </p>
                                                {(!searchTerm && statusFilter === 'all') && (
                                                    <Button
                                                        variant="outline"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 transition-colors"
                                                    >
                                                        <User className="mr-2 h-4 w-4" />
                                                        Refresh Records
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <TableRow key={record.id} className="hover:bg-gray-50/20 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <ProfilePhoto url={record.profile_photo_url} />
                                                    <div>
                                                        <p className="font-medium text-blue-600">
                                                            {record.profiles?.full_name || 'Unknown User'}
                                                        </p>
                                                        {record.legal_full_name && record.legal_full_name !== record.profiles?.full_name && (
                                                            <p className="text-xs text-gray-500">{record.legal_full_name}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">{record.legal_full_name || <span className="text-muted-foreground">-</span>}</p>
                                                    {record.pan_card_number && (
                                                        <p className="text-xs text-gray-500">PAN: {record.pan_card_number}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <p className="text-sm">{record.email || <span className="text-muted-foreground">-</span>}</p>
                                                    <p className="text-xs text-gray-500">{record.phone_number || '-'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-1">
                                                    {record.profile_photo_url && <div className="w-2 h-2 bg-green-500 rounded-full" title="Profile Photo" />}
                                                    {record.pan_card_image_url && <div className="w-2 h-2 bg-blue-500 rounded-full" title="PAN Card" />}
                                                    {record.aadhar_card_front_url && <div className="w-2 h-2 bg-purple-500 rounded-full" title="Aadhar Front" />}
                                                    {record.aadhar_card_back_url && <div className="w-2 h-2 bg-orange-500 rounded-full" title="Aadhar Back" />}
                                                    <span className="text-xs text-gray-500 ml-1">
                                                        {[record.profile_photo_url, record.pan_card_image_url, record.aadhar_card_front_url, record.aadhar_card_back_url]
                                                            .filter(Boolean).length}/4
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(record.status)}
                                                    {record.status === 'pending_review' && (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6 text-gray-600">
                                                <div className="space-y-1">
                                                    <p className="text-sm">{new Date(record.created_at).toLocaleDateString()}</p>
                                                    {record.updated_at !== record.created_at && (
                                                        <p className="text-xs text-gray-500">
                                                            Updated: {new Date(record.updated_at).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <KYCDetailModal
                                                        record={record}
                                                        onStatusUpdate={handleStatusUpdate}
                                                    />
                                                    {record.status === 'pending_review' && (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleStatusUpdate(record.id, 'approved')}
                                                                className="h-8 px-3 rounded-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 text-xs"
                                                            >
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
