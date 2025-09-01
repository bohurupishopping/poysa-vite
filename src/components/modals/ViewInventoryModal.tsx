import { useState, useEffect } from "react";
import { Eye, Package, TrendingUp, TrendingDown, AlertTriangle, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ProductWithStock, InventoryMovement } from "@/integrations/supabase/manager-types";

interface ViewInventoryModalProps {
    product: ProductWithStock;
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

interface InventoryMovementWithDetails extends InventoryMovement {
    warehouse?: { name: string; location?: string };
}

export function ViewInventoryModal({ product, trigger, isOpen, onClose }: ViewInventoryModalProps) {
    const [open, setOpen] = useState(false);
    
    // Use external control if isOpen and onClose are provided
    const modalOpen = isOpen !== undefined ? isOpen : open;
    const handleOpenChange = (newOpen: boolean) => {
        if (onClose && !newOpen) {
            onClose();
        } else {
            setOpen(newOpen);
        }
    };
    const [movements, setMovements] = useState<InventoryMovementWithDetails[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (modalOpen) {
            fetchInventoryMovements();
        }
    }, [modalOpen, product.id]);

    const fetchInventoryMovements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory_movements')
                .select(`
          *,
          warehouse:warehouses(name, location)
        `)
                .eq('product_id', product.id)
                .order('movement_date', { ascending: false })
                .limit(20);

            if (error) throw error;
            setMovements(data || []);
        } catch (error) {
            console.error('Error fetching inventory movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return 'N/A';
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

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'PURCHASE':
                return 'bg-green-100 text-green-800';
            case 'SALE':
                return 'bg-blue-100 text-blue-800';
            case 'ADJUSTMENT_IN':
                return 'bg-purple-100 text-purple-800';
            case 'ADJUSTMENT_OUT':
                return 'bg-orange-100 text-orange-800';
            case 'PURCHASE_RETURN':
                return 'bg-red-100 text-red-800';
            case 'SALES_RETURN':
                return 'bg-yellow-100 text-yellow-800';
            case 'INITIAL_STOCK':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const status = getStockStatus(product.current_stock);
    const StatusIcon = status.icon;

    return (
        <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[95vw] max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Inventory Details - {product.name}
                    </DialogTitle>
                    <DialogDescription>
                        View detailed inventory information and movement history
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Product Overview */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="rounded-lg border-0 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Product Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">SKU:</span>
                                    <span className="text-sm font-mono">{product.sku || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Type:</span>
                                    <Badge variant="outline" className="text-xs">
                                        {product.type}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Sale Price:</span>
                                    <span className="text-sm font-semibold">{formatCurrency(product.sale_price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Purchase Price:</span>
                                    <span className="text-sm font-semibold">{formatCurrency(product.purchase_price)}</span>
                                </div>
                                {product.description && (
                                    <div>
                                        <span className="text-sm text-gray-600">Description:</span>
                                        <p className="text-sm mt-1">{product.description}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-0 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Stock Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Current Stock:</span>
                                    <span className="text-lg font-bold">{product.current_stock.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Stock Value:</span>
                                    <span className="text-sm font-semibold">{formatCurrency(product.stock_value)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <Badge variant="outline" className={`text-xs rounded-full ${status.color} flex items-center gap-1`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {status.label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Unit Cost:</span>
                                    <span className="text-sm font-semibold">
                                        {product.current_stock > 0
                                            ? formatCurrency(product.stock_value / product.current_stock)
                                            : 'N/A'
                                        }
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Movements */}
                    <Card className="rounded-lg border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Recent Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-sm">Loading movements...</span>
                                </div>
                            ) : movements.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="bg-muted/50">Date</TableHead>
                                                <TableHead className="bg-muted/50">Type</TableHead>
                                                <TableHead className="bg-muted/50 text-right">Quantity</TableHead>
                                                <TableHead className="bg-muted/50 text-right">Unit Cost</TableHead>
                                                <TableHead className="bg-muted/50">Warehouse</TableHead>
                                                <TableHead className="bg-muted/50">Reason</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {movements.map((movement) => (
                                                <TableRow key={movement.id} className="hover:bg-muted/30">
                                                    <TableCell className="py-3">
                                                        <div className="text-sm font-medium">
                                                            {new Date(movement.movement_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(movement.movement_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-xs rounded-full px-2 py-1 ${getMovementTypeColor(movement.reason || '')}`}
                                                        >
                                                            {movement.reason?.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-semibold ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {movement.unit_cost ? formatCurrency(movement.unit_cost) : 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm truncate max-w-[120px]">
                                                                {movement.warehouse?.name || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        <div className="max-w-[150px] truncate" title={movement.notes || ''}>
                                                            {movement.notes || movement.reason || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="font-medium text-base mb-1">No inventory movements found</h3>
                                    <p className="text-sm">There are no recorded movements for this product</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Alerts */}
                    {(product.current_stock === 0 || product.current_stock < 10) && (
                        <Card className="rounded-lg border-0 shadow-sm border-l-4 border-l-yellow-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <h4 className="font-medium text-yellow-800">Stock Alert</h4>
                                        <p className="text-sm text-yellow-700">
                                            {product.current_stock === 0
                                                ? 'This product is out of stock and needs immediate restocking.'
                                                : 'This product has low stock levels. Consider restocking soon.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}