import { useEffect, useState } from "react";
import { Package, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { CreateProductModal } from "@/components/modals/CreateProductModal";
import { ViewProductModal } from "@/components/modals/ViewProductModal";
import { EditProductModal } from "@/components/modals/EditProductModal";
import { supabase } from "@/integrations/supabase/client";


interface Product {
  id: string;
  sku: string | null;
  name: string;
  type: string;
  description: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  is_active: boolean;
}

export default function Products() {
  const { selectedCompany } = useCompanyContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', selectedCompany)
        .is('deleted_at', null)
        .order('name');

      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCompany]);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'GOOD': return 'default';
      case 'SERVICE': return 'secondary';
      default: return 'outline';
    }
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-neutral-500">Please select a company to manage products & services.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products & Services</h1>
          <p className="text-gray-600">Manage the company's catalog of goods and services</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-64 rounded-full border-0 focus-visible:ring-1"
            />
          </div>
          <CreateProductModal
            companyId={selectedCompany}
            onProductCreated={fetchProducts}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading products...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No products found matching your search.' : 'No products found. Create your first product to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">
                    {product.sku || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-neutral-500" />
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getTypeBadgeVariant(product.type)}
                      className="rounded-full"
                    >
                      {product.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.sale_price ? `₹${Number(product.sale_price).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    {product.purchase_price ? `₹${Number(product.purchase_price).toLocaleString()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                      className="rounded-full"
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {product.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ViewProductModal productId={product.id} />
                      <EditProductModal
                        productId={product.id}
                        companyId={selectedCompany!}
                        onProductUpdated={fetchProducts}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}