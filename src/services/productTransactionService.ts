import { supabase } from '@/integrations/supabase/client';
import {
  ProductTransaction,
  ProductTransactionType,
  InventoryMovement,
  InventoryMovementType,
  ProductTransactionStats,
  ProductTransactionHelper
} from '@/types/product-transaction';

export class ProductTransactionService {
  /**
   * Get product transactions with pagination
   */
  static async getProductTransactions({
    productId,
    page = 1,
    limit = 20,
    startDate,
    endDate
  }: {
    productId: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ProductTransaction[]> {
    try {
      // Get all inventory movements for this product
      let movementsQuery = supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId);

      // Apply date filtering if provided
      if (startDate) {
        movementsQuery = movementsQuery.gte(
          'movement_date',
          startDate.toISOString()
        );
      }
      if (endDate) {
        movementsQuery = movementsQuery.lte(
          'movement_date',
          endDate.toISOString()
        );
      }

      const { data: movementsResponse, error } = await movementsQuery.order(
        'movement_date',
        { ascending: false }
      );

      if (error) throw error;
      if (!movementsResponse) return [];

      // Convert inventory movements to ProductTransaction objects
      const transactions: ProductTransaction[] = [];

      for (const movement of movementsResponse) {
        // Note: The actual database schema may not have all these columns
        // We need to check what's available and provide defaults
        const movementType = ProductTransactionHelper.parseMovementType(
          (movement as any).movement_type || ''
        );
        const transactionType = ProductTransactionHelper.mapMovementTypeToTransactionType(
          movementType
        );

        transactions.push({
          id: movement.id,
          product_id: productId,
          transaction_date: movement.movement_date,
          type: transactionType,
          quantity: Math.abs(movement.quantity_change || 0),
          unit_price: (movement as any).unit_cost || undefined,
          total_amount: (movement as any).total_value_change || undefined,
          reference: movement.reason,
          notes: movement.notes || undefined,
          document_number: ProductTransactionHelper.extractDocumentNumber(
            movement.reason || ''
          ),
          document_type: ProductTransactionHelper.getDocumentType(movementType)
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = transactions.length > startIndex
        ? transactions.slice(startIndex, Math.min(endIndex, transactions.length))
        : [];

      // Calculate running balance for the paginated results
      // Get the balance before the first transaction in this page
      const runningBalance = await this.getStockBalanceBeforeDate(
        productId,
        paginatedTransactions.length > 0
          ? new Date(paginatedTransactions[paginatedTransactions.length - 1].transaction_date)
          : new Date()
      );

      // Calculate running balance for each transaction
      let currentBalance = runningBalance;
      for (let i = paginatedTransactions.length - 1; i >= 0; i--) {
        const transaction = paginatedTransactions[i];
        const movement = movementsResponse[startIndex + (paginatedTransactions.length - 1 - i)];
        const quantityChange = movement.quantity_change || 0;

        currentBalance += quantityChange;
        paginatedTransactions[i] = {
          ...transaction,
          running_balance: currentBalance
        };
      }

      return paginatedTransactions;
    } catch (error) {
      throw new Error(`Failed to fetch product transactions: ${error}`);
    }
  }

  /**
   * Helper method to get stock balance before a specific date
   */
  private static async getStockBalanceBeforeDate(
    productId: string,
    date: Date
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('quantity_change')
        .eq('product_id', productId)
        .lt('movement_date', date.toISOString());

      if (error) throw error;
      if (!data) return 0;

      return data.reduce(
        (sum, movement) => sum + (movement.quantity_change || 0),
        0
      );
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current stock balance for a product
   */
  static async getCurrentStockBalance(productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('quantity_change')
        .eq('product_id', productId);

      if (error) throw error;
      if (!data) return 0;

      return data.reduce(
        (sum, movement) => sum + (movement.quantity_change || 0),
        0
      );
    } catch (error) {
      throw new Error(`Failed to calculate stock balance: ${error}`);
    }
  }

  /**
   * Get inventory movements for a product
   */
  static async getInventoryMovements({
    productId,
    page = 1,
    limit = 20
  }: {
    productId: string;
    page?: number;
    limit?: number;
  }): Promise<InventoryMovement[]> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .order('movement_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch inventory movements: ${error}`);
    }
  }

  /**
   * Get product transaction statistics
   */
  static async getProductTransactionStats(
    productId: string
  ): Promise<ProductTransactionStats> {
    try {
      const currentBalance = await this.getCurrentStockBalance(productId);

      // Get statistics from inventory movements
      // Note: The actual database may not have movement_type and total_value_change columns
      const { data: movementsResponse, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;
      if (!movementsResponse) {
        return {
          current_balance: currentBalance,
          total_sales_qty: 0,
          total_sales_value: 0,
          total_purchase_qty: 0,
          total_purchase_value: 0
        };
      }

      let totalSalesQty = 0;
      let totalSalesValue = 0;
      let totalPurchaseQty = 0;
      let totalPurchaseValue = 0;

      for (const movement of movementsResponse) {
        // Use type assertion since these columns may not exist in the actual database
        const movementType = (movement as any).movement_type?.toUpperCase();
        const quantityChange = Math.abs(movement.quantity_change || 0);
        const valueChange = Math.abs((movement as any).total_value_change || 0);

        switch (movementType) {
          case 'SALE':
          case 'PURCHASE_RETURN':
            totalSalesQty += quantityChange;
            totalSalesValue += valueChange;
            break;
          case 'PURCHASE':
          case 'SALES_RETURN':
            totalPurchaseQty += quantityChange;
            totalPurchaseValue += valueChange;
            break;
        }
      }

      return {
        current_balance: currentBalance,
        total_sales_qty: totalSalesQty,
        total_sales_value: totalSalesValue,
        total_purchase_qty: totalPurchaseQty,
        total_purchase_value: totalPurchaseValue
      };
    } catch (error) {
      throw new Error(`Failed to fetch product statistics: ${error}`);
    }
  }
}
