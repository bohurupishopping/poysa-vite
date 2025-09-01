import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SupplierService } from '@/services/supplierService';
import { CreateSupplierForm as CreateSupplierFormType, SupplierDetails } from '@/integrations/supabase/manager-types';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Phone,
  MapPin,
  FileText,
  User,
} from 'lucide-react';

// Indian states for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

// Payment terms options
const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Net 90',
  'Due on Receipt',
  'Cash on Delivery',
  '2/10 Net 30',
  '1/15 Net 30',
  'Custom',
];

// Validation schema matching Flutter patterns
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').trim(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val),
      'Please enter a valid email address'
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^[\+]?[1-9]?[0-9]{7,15}$/.test(val.replace(/[\s\-\(\)]/g, '')),
      'Please enter a valid phone number'
    ),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  postalCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || /^[1-9][0-9]{5}$/.test(val),
      'Please enter a valid 6-digit postal code'
    ),
  gstin: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || val.trim() === '' ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      'Please enter a valid 15-digit GSTIN'
    ),
  taxNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

interface CreateSupplierFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateSupplierFormData>;
  isEditing?: boolean;
  supplierId?: string;
}

export function CreateSupplierForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  supplierId,
}: CreateSupplierFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || 'West Bengal',
      country: initialData?.country || 'India',
      postalCode: initialData?.postalCode || '',
      gstin: initialData?.gstin || '',
      taxNumber: initialData?.taxNumber || '',
      contactPerson: initialData?.contactPerson || '',
      paymentTerms: initialData?.paymentTerms || '',
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (data: CreateSupplierFormData) => {
    if (!profile?.company_id) {
      toast({
        title: 'Error',
        description: 'No company selected',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate supplier details using service
      const supplierDetails = SupplierService.formToSupplierDetails(data as CreateSupplierFormType);
      const validationError = SupplierService.validateSupplierDetails(supplierDetails);
      
      if (validationError) {
        toast({
          title: 'Validation Error',
          description: validationError,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const supplierData: CreateSupplierFormType = {
        name: data.name, // Zod validation ensures this is not empty
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        gstin: data.gstin,
        taxNumber: data.taxNumber,
        contactPerson: data.contactPerson,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
      };

      if (isEditing && supplierId) {
        await SupplierService.updateSupplier(supplierId, profile.company_id, supplierData);
        toast({
          title: 'Success',
          description: 'Supplier updated successfully',
        });
      } else {
        const request = {
          company_id: profile.company_id,
          name: supplierData.name,
          gstin: supplierData.gstin || null,
          details: SupplierService.formToSupplierDetails(supplierData),
        };
        await SupplierService.createSupplier(request);
        toast({
          title: 'Success',
          description: 'Supplier created successfully',
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save supplier',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header - More compact and rounded */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-9 w-9 p-0 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Supplier' : 'Create Supplier'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? 'Update supplier information' : 'Add a new supplier'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-9 rounded-xl border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating' : 'Creating'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-5">
          {/* Basic Information - More compact cards */}
          <Card className="rounded-2xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-sm font-medium text-gray-700">Supplier Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter supplier name"
                          {...field}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-sm font-medium text-gray-700">Contact Person</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter contact person name"
                          {...field}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          {...field}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="rounded-2xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-sm font-medium text-gray-700">Street Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter street address"
                        className="rounded-xl min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">City</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter city" 
                          {...field} 
                          className="rounded-xl h-11 border-gray-20 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state} className="rounded-md">
                              {state}
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter postal code" 
                          {...field} 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Country</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter country" 
                          {...field} 
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Business Information */}
          <Card className="rounded-2xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                Tax & Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">GSTIN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 15-digit GSTIN"
                          {...field}
                          maxLength={15}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="taxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Tax Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tax number"
                          {...field}
                          className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-sm font-medium text-gray-700">Payment Terms</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_TERMS.map((term) => (
                          <SelectItem key={term} value={term} className="rounded-md">
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="rounded-2xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes about the supplier"
                        className="rounded-xl min-h-[80px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-colors"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
