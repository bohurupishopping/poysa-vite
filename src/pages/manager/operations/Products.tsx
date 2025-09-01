import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Package, BarChart3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProductWithStock, ProductType } from "@/integrations/supabase/manager-types";
import { ProductTransactionService } from "@/services/productTransactionService";

export default function ManagerProducts() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    useEffect(() => {
        const fetchProducts = async () => {
            if (!profile?.company_id) return;

            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .is('deleted_at', null)
                    .order('name');

                if (error) throw error;

                // Calculate actual stock values using ProductTransactionService
                const productsWithStock = await Promise.all((data || []).map(async (product) => {
                    if (product.type === 'GOOD') {
                        try {
                            const stockBalance = await ProductTransactionService.getCurrentStockBalance(product.id);
                            const stockValue = stockBalance * (product.average_cost || 0);
                            return {
                                ...product,
                                current_stock: stockBalance,
                                stock_value: stockValue,
                            };
                        } catch (stockError) {
                            console.error(`Error calculating stock for product ${product.id}:`, stockError);
                            return {
                                ...product,
                                current_stock: 0,
                                stock_value: 0,
                            };
                        }
                    } else {
                        return {
                            ...product,
                            current_stock: 0,
                            stock_value: 0,
                        };
                    }
                }));

                setProducts(productsWithStock);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [profile?.company_id]);

    const filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === "all" || product.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getTypeColor = (type: ProductType) => {
        switch (type) {
            case 'GOOD':
                return 'bg-blue-100 text-blue-800';
            case 'SERVICE':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeCounts = () => {
        return {
            all: products.length,
            GOOD: products.filter(p => p.type === 'GOOD').length,
            SERVICE: products.filter(p => p.type === 'SERVICE').length,
            active: products.filter(p => p.is_active).length,
            inactive: products.filter(p => !p.is_active).length,
        };
    };

    const typeCounts = getTypeCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading products...</span>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mb-8 flex flex-col gap-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Products & Services</h1>
                        <p className="text-gray-600">Manage your inventory and service offerings</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                        {/* Search and Filter in same row as buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                    <SelectValue placeholder="Filter by type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types ({typeCounts.all})</SelectItem>
                                    <SelectItem value="GOOD">Goods ({typeCounts.GOOD})</SelectItem>
                                    <SelectItem value="SERVICE">Services ({typeCounts.SERVICE})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 lg:gap-3">
                            <Button
                                variant="outline"
                                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-0 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Analytics</span>
                            </Button>
                            <Button
                                onClick={() => navigate('/manager/operations/products/create')}
                                className="h-9 lg:h-10 px-3 lg:px-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Add Product</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{typeCounts.all}</div>
                        <p className="text-xs text-blue-600/70">{typeCounts.active} active</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-700">Goods</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{typeCounts.GOOD}</div>
                        <p className="text-xs text-blue-600/70">Physical products</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-green-700">Services</CardTitle>
                        <Package className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{typeCounts.SERVICE}</div>
                        <p className="text-xs text-green-600/70">Service offerings</p>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-semibold text-purple-700">Stock Value</CardTitle>
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-xl lg:text-2xl font-bold text-purple-900 mb-1">
                            {formatCurrency(products.reduce((sum, p) => sum + p.stock_value, 0))}
                        </div>
                        <p className="text-xs text-purple-600/70">Current inventory</p>
                    </CardContent>
                </Card>
            </div>



            {/* Products Table */}
            <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/30">
                                <TableRow className="hover:bg-gray-50/30">
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Product</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">SKU</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Type</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Sale Price</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Purchase Price</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Stock</TableHead>
                                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div>
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                {product.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <span className="font-mono text-sm text-gray-600">
                                                {product.sku || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 ${getTypeColor(product.type)}`}>
                                                {product.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(product.sale_price)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(product.average_cost)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {product.type === 'GOOD' ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{product.current_stock}</div>
                                                    <div className="text-gray-500">{formatCurrency(product.stock_value)}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge variant={product.is_active ? "default" : "secondary"} className="rounded-full px-3 py-1">
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    onClick={() => navigate(`/manager/operations/products/${product.id}/transactions`)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-xs"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    onClick={() => navigate(`/manager/operations/products/edit/${product.id}`)}
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
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {filteredProducts.length === 0 && (
                <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <CardContent className="text-center py-16 px-8">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || typeFilter !== "all"
                                    ? 'Try adjusting your search criteria or clear filters to see all products'
                                    : 'Create your first product to get started with managing your inventory'
                                }
                            </p>
                            {(!searchTerm && typeFilter === "all") && (
                                <Button
                                    onClick={() => navigate('/manager/operations/products/create')}
                                    className="bg-blue-600 hover:bg-blue-700 rounded-full px-6 transition-colors"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add First Product
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
