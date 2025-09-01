import React, { useState } from 'react';
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
import { User, Mail, Phone, MapPin, FileText, Save, Loader2, ArrowLeft } from 'lucide-react';
import { CreateCustomerForm as CreateCustomerFormType } from '@/integrations/supabase/manager-types';
import { CustomerService } from '@/services/customerService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Indian states list matching Flutter implementation
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

// Validation schema matching Flutter patterns
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val),
      'Please enter a valid email address'
    ),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  gstin: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      'Please enter a valid 15-digit GSTIN'
    ),
  taxNumber: z.string().optional(),
});

type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

interface CreateCustomerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<CreateCustomerFormData>;
  isEditing?: boolean;
  customerId?: string;
}

export function CreateCustomerForm({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  customerId,
}: CreateCustomerFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
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
    },
  });

  const onSubmit = async (data: CreateCustomerFormData) => {
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
      // Ensure name is provided since it's required
      const customerData: CreateCustomerFormType = {
        name: data.name!,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        gstin: data.gstin,
        taxNumber: data.taxNumber,
      };

      if (isEditing && customerId) {
        await CustomerService.updateCustomer(customerId, profile.company_id, customerData);
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        });
      } else {
        await CustomerService.createCustomer(profile.company_id, customerData);
        toast({
          title: 'Success',
          description: 'Customer created successfully',
        });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save customer',
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
                {isEditing ? 'Edit Customer' : 'Create Customer'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? 'Update customer information' : 'Add a new customer'}
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
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Customer Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter customer name"
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

          {/* Additional Information */}
          <Card className="rounded-2xl border border-gray-100/50 bg-white overflow-hidden">
            <CardHeader className="pb-4 bg-gray-50/30">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                Additional Information
                <span className="text-sm font-normal text-gray-500">Tax details</span>
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
                          onChange={(e) => {
                            field.onChange(e.target.value.toUpperCase());
                          }}
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
                          placeholder="Enter tax identification number"
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
        </div>
      </Form>
    </div>
  );
}
