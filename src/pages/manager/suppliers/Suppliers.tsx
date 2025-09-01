import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Supplier } from "@/integrations/supabase/manager-types";

interface SupplierDetails {
    email?: string;
    phone?: string;
    address?: string;
    gstin?: string;
}

interface SupplierWithStats extends Omit<Supplier, 'details'> {
    total_bills: number;
    total_amount: number;
    outstanding_amount: number;
    details: SupplierDetails | null; // Add 'details' with the specific type, allowing null
}

export default function ManagerSuppliers() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchSuppliers = async () => {
            if (!profile?.company_id) return;

            try {
                const { data, error } = await supabase
                    .from('suppliers')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .is('deleted_at', null)
                    .order('name');

                if (error) throw error;

                // For now, we'll set stats to 0. In a real app, you'd join with purchase_bills
                const suppliersWithStats = (data || []).map(supplier => ({
                    ...supplier,
                    total_bills: 0,
                    total_amount: 0,
                    outstanding_amount: 0,
                    details: supplier.details as SupplierDetails | null, // Explicitly cast details
                }));

                setSuppliers(suppliersWithStats);
            } catch (error) {
                console.error('Error fetching suppliers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, [profile?.company_id]);

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.details?.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getSupplierDetails = (details: SupplierDetails | null): SupplierDetails => {
        if (!details) return { email: undefined, phone: undefined, address: undefined, gstin: undefined };
        return {
            email: details.email || undefined,
            phone: details.phone || undefined,
            address: details.address || undefined,
            gstin: details.gstin || undefined,
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading suppliers...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
                        <p className="text-gray-600">Manage your supplier relationships</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search in same row as button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search suppliers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                onClick={() => navigate('/manager/suppliers/create')}
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Add Supplier</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Suppliers</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{suppliers.length}</div>
                        <p className="text-xs text-blue-600/70">Active suppliers</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Total Purchases</CardTitle>
                        <Building2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl lg:text-2xl font-bold text-green-900 mb-1">
                            {formatCurrency(suppliers.reduce((sum, s) => sum + s.total_amount, 0))}
                        </div>
                        <p className="text-xs text-green-600/70">All time</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-orange-700">Outstanding</CardTitle>
                        <Building2 className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl lg:text-2xl font-bold text-orange-900 mb-1">
                            {formatCurrency(suppliers.reduce((sum, s) => sum + s.outstanding_amount, 0))}
                        </div>
                        <p className="text-xs text-orange-600/70">Pending payments</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Avg. Bill Value</CardTitle>
                        <Building2 className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl lg:text-2xl font-bold text-purple-900 mb-1">
                            {suppliers.length > 0
                                ? formatCurrency(suppliers.reduce((sum, s) => sum + s.total_amount, 0) / suppliers.length)
                                : formatCurrency(0)
                            }
                        </div>
                        <p className="text-xs text-purple-600/70">Per supplier</p>
                    </CardContent>
                </Card>
            </div>

            {/* Suppliers Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Supplier</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Contact</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">GSTIN</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Total Purchases</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Outstanding</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Bills</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSuppliers.map((supplier) => {
                                    const details = getSupplierDetails(supplier.details);
                                    return (
                                        <TableRow key={supplier.id} className="hover:bg-gray-50/20 transition-colors">
                                            <TableCell className="py-4 px-6">
                                                <div>
                                                    <div className="font-medium text-gray-900">{supplier.name}</div>
                                                    {details.address && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {details.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="space-y-1">
                                                    {details.email && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {details.email}
                                                        </div>
                                                    )}
                                                    {details.phone && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {details.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                {details.gstin ? (
                                                    <span className="font-mono text-sm text-gray-600">{details.gstin}</span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="font-semibold text-gray-900">
                                                    {formatCurrency(supplier.total_amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <div className="font-semibold text-gray-900">
                                                    {formatCurrency(supplier.outstanding_amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-6">
                                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                                    {supplier.total_bills}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right py-4 px-6">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        onClick={() => navigate(`/manager/suppliers/${supplier.id}/transactions`)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        onClick={() => navigate(`/manager/suppliers/edit/${supplier.id}`)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-full border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-xs"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-xs"
                                                    >
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredSuppliers.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? 'Try adjusting your search criteria or clear the search to see all suppliers'
                                    : 'Create your first supplier to get started with managing your relationships'
                                }
                            </p>
                            {(!searchTerm) && (
                                <Button
                                    onClick={() => navigate('/manager/suppliers/create')}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Supplier
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
