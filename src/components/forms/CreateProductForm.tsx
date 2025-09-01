import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, DollarSign, FileText, Save, Loader2, ArrowLeft } from 'lucide-react';
import { ProductType, ChartOfAccount, TaxGroup } from '@/integrations/supabase/manager-types';
import { productService, type Product, type ProductInsert } from '@/services/productService';
import { accountService } from '@/services/accountService';
import { taxService } from '@/services/taxService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Product validation schema
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  sku: z.string().optional(),
  type: z.enum(['GOOD', 'SERVICE'] as const, {
    required_error: 'Product type is required',
  }),
  description: z.string().optional(),
  sale_price: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      'Sale price must be a valid positive number'
    ),
  average_cost: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      'Purchase price must be a valid positive number'
    ),
  hsn_sac_code: z.string().optional(),
  default_tax_group_id: z.string().optional(),
  cogs_account_id: z.string().optional(),
  revenue_account_id: z.string().optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

interface CreateProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateProductFormData>;
  isEditing?: boolean;
  productId?: string;
}

export function CreateProductForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  productId,
}: CreateProductFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<ChartOfAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<ChartOfAccount[]>([]);
  const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      type: initialData?.type || 'GOOD',
      description: initialData?.description || '',
      sale_price: initialData?.sale_price?.toString() || '',
      average_cost: initialData?.average_cost?.toString() || '',
      hsn_sac_code: initialData?.hsn_sac_code || '',
      default_tax_group_id: initialData?.default_tax_group_id || '',
      cogs_account_id: initialData?.cogs_account_id || '',
      revenue_account_id: initialData?.revenue_account_id || '',
    },
  });

  // Fetch accounts and tax rates on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.company_id) {
        setIsLoadingData(false);
        return;
      }

      try {
        const [allAccounts, allTaxGroups] = await Promise.all([
          accountService.getAccounts(profile.company_id),
          taxService.getTaxGroups(profile.company_id)
        ]);

        setAccounts(allAccounts);
        setRevenueAccounts(allAccounts.filter(acc => acc.account_class === 'REVENUE'));
        setExpenseAccounts(allAccounts.filter(acc => acc.account_class === 'EXPENSE'));
        setTaxGroups(allTaxGroups);

        // Set default accounts based on account codes (similar to Flutter implementation)
        if (!isEditing && !initialData) {
          // Default revenue account: 3310 - Sales Revenue
          const defaultRevenueAccount = revenueAccounts.find(acc => acc.account_code === '3310') || revenueAccounts[0];
          if (defaultRevenueAccount) {
            form.setValue('revenue_account_id', defaultRevenueAccount.id);
          }

          // Default COGS account: 4100 - Cost of Goods Sold
          const defaultCogsAccount = expenseAccounts.find(acc => acc.account_code === '4100') || expenseAccounts[0];
          if (defaultCogsAccount) {
            form.setValue('cogs_account_id', defaultCogsAccount.id);
          }
        }
      } catch (error) {
        console.error('Error fetching accounts and tax groups:', error);
        toast({
          title: 'Warning',
          description: 'Failed to load accounts and tax groups',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [profile?.company_id, form, isEditing, initialData, toast]);

  const onSubmit = async (data: CreateProductFormData) => {
    if (!profile?.company_id) {
      toast({
        title: 'Error',
        description: 'Company information not found',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const productData: ProductInsert = {
        name: data.name,
        sku: data.sku || null,
        type: data.type,
        description: data.description || null,
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        average_cost: data.average_cost ? Number(data.average_cost) : null,
        hsn_sac_code: data.hsn_sac_code || null,
        default_tax_group_id: data.default_tax_group_id || null,
        cogs_account_id: data.cogs_account_id || null,
        revenue_account_id: data.revenue_account_id || null,
        inventory_asset_account_id: null,
        quantity_on_hand: 0,
        company_id: profile.company_id,
        is_active: true,
      };

      if (isEditing && productId) {
        await productService.updateProduct(productId, productData);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        await productService.createProduct(productData);
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} product`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update product information' : 'Add a new product to your inventory'}
            </p>
          </div>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter product name"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter SKU (optional)"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GOOD">Good</SelectItem>
                          <SelectItem value="SERVICE">Service</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter product description (optional)"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pricing Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="average_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hsn_sac_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HSN/SAC Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter HSN/SAC code"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_tax_group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Tax Group</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingData ? "Loading tax groups..." : "Select tax group"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taxGroups.map((taxGroup) => (
                            <SelectItem key={taxGroup.id} value={taxGroup.id}>
                              {taxGroup.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="cogs_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COGS Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingData ? "Loading accounts..." : "Select COGS account"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code ? `${account.account_code} - ` : ''}{account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="revenue_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Revenue Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingData ? "Loading accounts..." : "Select revenue account"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {revenueAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code ? `${account.account_code} - ` : ''}{account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}