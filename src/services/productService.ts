import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { ProductWithStock, ProductType } from '@/integrations/supabase/manager-types';

type Product = Tables<'products'>;
type ProductInsert = Omit<Product, 'id' | 'deleted_at'>;
type ProductUpdate = Partial<Omit<Product, 'id' | 'company_id'>>;

class ProductService {
  // Get all products for a company
  async getProducts(companyId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  }

  // Get a single product by ID
  async getProduct(productId: string, companyId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }

  // Search products by name or SKU
  async searchProducts(
    companyId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('name');

    if (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }

    return data || [];
  }

  // Get products by type
  async getProductsByType(
    companyId: string,
    type: ProductType
  ): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch products by type: ${error.message}`);
    }

    return data || [];
  }

  // Get products with stock information
  async getProductsWithStock(companyId: string): Promise<ProductWithStock[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch products with stock: ${error.message}`);
    }

    // For now, we'll set current_stock and stock_value to 0 as we don't have inventory tracking yet
    return (data || []).map(product => ({
      ...product,
      current_stock: 0,
      stock_value: 0
    }));
  }

  // Create a new product
  async createProduct(
    productData: ProductInsert
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  // Update an existing product
  async updateProduct(
    id: string,
    productData: ProductUpdate
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  // Delete a product (soft delete)
  async deleteProduct(productId: string, companyId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('company_id', companyId);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  // Toggle product active status
  async toggleProductStatus(
    productId: string,
    companyId: string,
    isActive: boolean
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product status: ${error.message}`);
    }

    return data;
  }

  // Get product statistics for a company
  async getProductStats(companyId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('type, is_active')
      .eq('company_id', companyId)
      .is('deleted_at', null);

    if (error) {
      throw new Error(`Failed to fetch product statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      active: data.filter(p => p.is_active).length,
      inactive: data.filter(p => !p.is_active).length,
      goods: data.filter(p => p.type === 'GOOD').length,
      services: data.filter(p => p.type === 'SERVICE').length,
    };

    return stats;
  }
}

// Export a singleton instance
export const productService = new ProductService();
export type { Product, ProductInsert, ProductUpdate };