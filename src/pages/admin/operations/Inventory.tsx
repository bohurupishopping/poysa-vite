import { useEffect, useState } from "react";
import { Warehouse, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  products: { name: string; sku: string | null };
  warehouses: { name: string; location: string | null };
}

export default function Inventory() {
  const { selectedCompany } = useCompanyContext();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedCompany) {
        setLoading(false);
        return;
      }

      try {
        // Fetch products and warehouses separately for this demo
        const { data: products } = await supabase
          .from('products')
          .select('id, name, sku')
          .eq('company_id', selectedCompany)
          .eq('is_active', true)
          .is('deleted_at', null);

        const { data: warehouses } = await supabase
          .from('warehouses')
          .select('id, name, location')
          .eq('company_id', selectedCompany)
          .eq('is_active', true)
          .is('deleted_at', null);
        
        // Create inventory combinations (in real app, compute from inventory_movements)
        if (products && warehouses && warehouses.length > 0) {
          const inventoryData = products.map(product => ({
            product_id: product.id,
            warehouse_id: warehouses[0].id,
            quantity: Math.floor(Math.random() * 100), // Placeholder
            products: { name: product.name, sku: product.sku },
            warehouses: { name: warehouses[0].name, location: warehouses[0].location }
          }));
          setInventory(inventoryData);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [selectedCompany]);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { variant: 'destructive', label: 'Out of Stock' };
    if (quantity <= 10) return { variant: 'warning', label: 'Low Stock' };
    return { variant: 'default', label: 'In Stock' };
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-neutral-500">Please select a company to view inventory.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and movements across warehouses"
      />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity on Hand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item, index) => {
              const status = getStockStatus(item.quantity);
              return (
                <TableRow key={`${item.product_id}-${item.warehouse_id}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-neutral-500" />
                      {item.products.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {item.products.sku || '-'}
                  </TableCell>
                  <TableCell>
                    {item.warehouses.name}
                  </TableCell>
                  <TableCell>
                    {item.warehouses.location || '-'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant as any}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <History className="h-4 w-4" />
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}