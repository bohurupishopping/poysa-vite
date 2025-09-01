import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateProductForm } from '@/components/forms/CreateProductForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { productService, type Product } from '@/services/productService';

export default function CreateProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(productId);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !profile?.company_id) return;

      setLoading(true);
      try {
        const productData = await productService.getProduct(productId, profile.company_id);
        setProduct(productData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load product',
          variant: 'destructive',
        });
        navigate('/manager/operations/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, profile?.company_id, navigate, toast]);

  const handleSuccess = () => {
    navigate('/manager/operations/products');
  };

  const handleCancel = () => {
    navigate('/manager/operations/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading product...</span>
      </div>
    );
  }

  // Convert product data to form format
  const initialData = product ? {
    name: product.name,
    sku: product.sku || '',
    type: product.type,
    description: product.description || '',
    sale_price: product.sale_price?.toString() || '',
    purchase_price: product.average_cost?.toString() || '',
    hsn_sac_code: product.hsn_sac_code || '',
    default_tax_group_id: product.default_tax_group_id || '',
  } : undefined;

  return (
    <div className="container mx-auto py-6">
      <CreateProductForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        initialData={initialData}
        isEditing={isEditing}
        productId={productId}
      />
    </div>
  );
}