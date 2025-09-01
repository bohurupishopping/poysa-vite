import { useState, useEffect } from "react";
import { Eye, Package, Tag, DollarSign, BarChart3 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ViewProductModalProps {
  productId: string;
  trigger?: React.ReactNode;
}

interface ProductDetail {
  id: string;
  sku: string | null;
  name: string;
  type: string;
  description: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  is_active: boolean;
  revenue_account_id: string | null;
  cogs_account_id: string | null;
}

export function ViewProductModal({ productId, trigger }: ViewProductModalProps) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProductDetail = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (data) setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProductDetail();
    }
  }, [open, productId]);

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'GOOD': return 'default';
      case 'SERVICE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this product or service
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Name</label>
                    <p className="text-sm font-semibold">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">SKU</label>
                    <p className="text-sm font-mono">{product.sku || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Type</label>
                    <div>
                      <Badge variant={getTypeBadgeVariant(product.type)}>
                        {product.type}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Status</label>
                    <div>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                {product.description && (
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Description</label>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Sale Price</label>
                    <p className="text-lg font-semibold text-green-600">
                      {product.sale_price ? `₹${Number(product.sale_price).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Purchase Price</label>
                    <p className="text-lg font-semibold text-blue-600">
                      {product.purchase_price ? `₹${Number(product.purchase_price).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accounting Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Accounting Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600">Revenue Account</label>
                    <p className="text-sm">{product.revenue_account_id ? 'Configured' : 'Not configured'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600">COGS Account</label>
                    <p className="text-sm">{product.cogs_account_id ? 'Configured' : 'Not configured'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-neutral-500">Product not found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}