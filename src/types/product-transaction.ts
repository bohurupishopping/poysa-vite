export enum ProductTransactionType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer'
}

export enum InventoryMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  PURCHASE_RETURN = 'PURCHASE_RETURN',
  SALES_RETURN = 'SALES_RETURN',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  INITIAL_STOCK = 'INITIAL_STOCK'
}

export interface ProductTransaction {
  id: string;
  product_id: string;
  transaction_date: string;
  type: ProductTransactionType;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  document_number?: string;
  document_type?: string;
  customer_name?: string;
  supplier_name?: string;
  reference?: string;
  notes?: string;
  running_balance?: number;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_date: string;
  quantity_change: number;
  reason: string;
  source_document_id: string | null;
  warehouse_id: string;
  notes?: string;
  company_id?: string;
  movement_type?: InventoryMovementType;
  unit_cost?: number;
  total_value_change?: number;
}

export interface ProductTransactionStats {
  current_balance: number;
  total_sales_qty: number;
  total_sales_value: number;
  total_purchase_qty: number;
  total_purchase_value: number;
}

// Helper functions similar to Flutter extension methods
export class ProductTransactionHelper {
  static isInward(transaction: ProductTransaction): boolean {
    switch (transaction.type) {
      case ProductTransactionType.PURCHASE:
        return true;
      case ProductTransactionType.SALE:
        return false;
      case ProductTransactionType.ADJUSTMENT:
        // For adjustments, check the total amount sign or use quantity
        if (transaction.total_amount !== undefined) {
          return transaction.total_amount >= 0;
        }
        return true; // Default to inward for adjustments
      case ProductTransactionType.TRANSFER:
        return true; // Transfers are typically inward to the receiving location
    }
  }

  static isOutward(transaction: ProductTransaction): boolean {
    return !this.isInward(transaction);
  }

  static getFormattedQuantity(transaction: ProductTransaction): string {
    const sign = this.isInward(transaction) ? '+' : '-';
    return `${sign}${Math.abs(transaction.quantity).toFixed(2)}`;
  }

  static getFormattedUnitPrice(transaction: ProductTransaction): string {
    if (transaction.unit_price === undefined) return '-';
    return `₹${transaction.unit_price.toFixed(2)}`;
  }

  static getFormattedTotalAmount(transaction: ProductTransaction): string {
    if (transaction.total_amount === undefined) return '-';
    const sign = transaction.total_amount >= 0 ? '' : '-';
    return `${sign}₹${Math.abs(transaction.total_amount).toFixed(2)}`;
  }

  static getFormattedRunningBalance(transaction: ProductTransaction): string {
    if (transaction.running_balance === undefined) return '-';
    return transaction.running_balance.toFixed(2);
  }

  static getTypeDisplayName(type: ProductTransactionType): string {
    switch (type) {
      case ProductTransactionType.SALE:
        return 'Sale';
      case ProductTransactionType.PURCHASE:
        return 'Purchase';
      case ProductTransactionType.ADJUSTMENT:
        return 'Adjustment';
      case ProductTransactionType.TRANSFER:
        return 'Transfer';
    }
  }

  static getPartyName(transaction: ProductTransaction): string | undefined {
    return transaction.customer_name || transaction.supplier_name;
  }

  static getDescription(transaction: ProductTransaction): string {
    // Use reference if available (from inventory movements)
    if (transaction.reference?.trim()) {
      return transaction.reference;
    }

    // Fallback to constructed description
    const party = this.getPartyName(transaction);
    if (party) {
      return `${this.getTypeDisplayName(transaction.type)} - ${party}`;
    }
    return this.getTypeDisplayName(transaction.type);
  }

  static parseMovementType(typeString?: string): InventoryMovementType {
    if (!typeString) return InventoryMovementType.ADJUSTMENT_IN;

    switch (typeString.toUpperCase()) {
      case 'PURCHASE':
        return InventoryMovementType.PURCHASE;
      case 'SALE':
        return InventoryMovementType.SALE;
      case 'PURCHASE_RETURN':
        return InventoryMovementType.PURCHASE_RETURN;
      case 'SALES_RETURN':
        return InventoryMovementType.SALES_RETURN;
      case 'ADJUSTMENT_IN':
        return InventoryMovementType.ADJUSTMENT_IN;
      case 'ADJUSTMENT_OUT':
        return InventoryMovementType.ADJUSTMENT_OUT;
      case 'INITIAL_STOCK':
        return InventoryMovementType.INITIAL_STOCK;
      default:
        return InventoryMovementType.ADJUSTMENT_IN;
    }
  }

  static mapMovementTypeToTransactionType(
    movementType: InventoryMovementType
  ): ProductTransactionType {
    switch (movementType) {
      case InventoryMovementType.PURCHASE:
      case InventoryMovementType.SALES_RETURN:
        return ProductTransactionType.PURCHASE;
      case InventoryMovementType.SALE:
      case InventoryMovementType.PURCHASE_RETURN:
        return ProductTransactionType.SALE;
      case InventoryMovementType.ADJUSTMENT_IN:
      case InventoryMovementType.ADJUSTMENT_OUT:
      case InventoryMovementType.INITIAL_STOCK:
        return ProductTransactionType.ADJUSTMENT;
    }
  }

  static getDocumentType(movementType: InventoryMovementType): string {
    switch (movementType) {
      case InventoryMovementType.PURCHASE:
        return 'Purchase Bill';
      case InventoryMovementType.SALE:
        return 'Sales Invoice';
      case InventoryMovementType.PURCHASE_RETURN:
        return 'Purchase Return';
      case InventoryMovementType.SALES_RETURN:
        return 'Sales Return';
      case InventoryMovementType.ADJUSTMENT_IN:
        return 'Stock Adjustment In';
      case InventoryMovementType.ADJUSTMENT_OUT:
        return 'Stock Adjustment Out';
      case InventoryMovementType.INITIAL_STOCK:
        return 'Initial Stock';
    }
  }

  static extractDocumentNumber(reason: string): string | undefined {
    // Try to extract document number from reason text
    const regex = /#([A-Za-z0-9-]+)/;
    const match = reason.match(regex);
    return match?.[1];
  }
}
