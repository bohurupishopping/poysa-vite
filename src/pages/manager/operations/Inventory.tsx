import { useEffect, useState } from "react";
import { Search, Package, TrendingUp, TrendingDown, AlertTriangle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProductWithStock } from "@/integrations/supabase/manager-types";
import { ViewInventoryModal } from "@/components/modals/ViewInventoryModal";

export default function ManagerInventory() {
    const { profile } = useAuth();
    const [inventory, setInventory] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [stockFilter, setStockFilter] = useState<string>("all");
    const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchInventory = async () => {
            if (!profile?.company_id) return;

            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .eq('type', 'GOOD') // Only goods have inventory
                    .is('deleted_at', null)
                    .order('name');

                if (error) throw error;

                // For now, we'll set random stock values. In a real app, you'd calculate these from inventory_movements
                const inventoryWithStock = (data || []).map(product => ({
                    ...product,
                    current_stock: Math.floor(Math.random() * 100),
                    stock_value: Math.floor(Math.random() * 50000),
                }));

                setInventory(inventoryWithStock);
            } catch (error) {
                console.error('Error fetching inventory:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, [profile?.company_id]);

    const handleViewInventory = (product: ProductWithStock) => {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStock = true;
        if (stockFilter === "low") {
            matchesStock = item.current_stock < 10;
        } else if (stockFilter === "out") {
            matchesStock = item.current_stock === 0;
        } else if (stockFilter === "available") {
            matchesStock = item.current_stock > 0;
        }

        return matchesSearch && matchesStock;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
        if (stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown };
        return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    };

    const getInventoryStats = () => {
        const totalItems = inventory.length;
        const totalValue = inventory.reduce((sum, item) => sum + item.stock_value, 0);
        const lowStockItems = inventory.filter(item => item.current_stock < 10).length;
        const outOfStockItems = inventory.filter(item => item.current_stock === 0).length;

        return { totalItems, totalValue, lowStockItems, outOfStockItems };
    };

    const stats = getInventoryStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading inventory...</span>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
                    <p className="text-gray-600">Monitor stock levels and inventory value</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalItems}</div>
                        <p className="text-xs text-gray-500 mt-1">Unique products</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
                        <p className="text-xs text-gray-500 mt-1">Current inventory</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
                        <TrendingDown className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</div>
                        <p className="text-xs text-gray-500 mt-1">Below 10 units</p>
                    </CardContent>
                </Card>

                <Card className="rounded-lg border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.outOfStockItems}</div>
                        <p className="text-xs text-gray-500 mt-1">Needs restocking</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by stock" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="available">In Stock</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="out">Out of Stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Inventory Table */}
            <Card className="rounded-lg border-0 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Unit Cost</TableHead>
                                <TableHead>Stock Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInventory.map((item) => {
                                const status = getStockStatus(item.current_stock);
                                const StatusIcon = status.icon;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                {item.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">
                                                {item.sku || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">
                                                {item.current_stock.toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">
                                                {item.average_cost ? formatCurrency(item.average_cost) : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(item.stock_value)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-xs rounded-full ${status.color} flex items-center gap-1 w-fit`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-gray-500">
                                                {new Date().toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleViewInventory(item)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {filteredInventory.length === 0 && (
                <Card className="rounded-lg border-0 shadow-sm">
                    <CardContent className="text-center py-12">
                        <div className="text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">No inventory items found</p>
                            <p className="text-sm">
                                {searchTerm || stockFilter !== "all"
                                    ? 'Try adjusting your search criteria'
                                    : 'Add products to start tracking inventory'
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Modal */}
            {selectedProduct && (
                <ViewInventoryModal
                    product={selectedProduct}
                    isOpen={isViewModalOpen}
                    onClose={() => setIsViewModalOpen(false)}
                />
            )}
        </div>
    );
}