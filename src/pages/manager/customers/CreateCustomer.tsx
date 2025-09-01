import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateCustomerForm } from '@/components/forms/CreateCustomerForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { CustomerService } from '@/services/customerService';
import { Customer } from '@/integrations/supabase/manager-types';

export default function CreateCustomer() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(customerId);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId || !profile?.company_id) return;

      setLoading(true);
      try {
        const customerData = await CustomerService.getCustomer(customerId);
        setCustomer(customerData);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load customer',
          variant: 'destructive',
        });
        navigate('/manager/customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, profile?.company_id, navigate, toast]);

  const handleSuccess = () => {
    navigate('/manager/customers');
  };

  const handleCancel = () => {
    navigate('/manager/customers');
  };

  const getInitialData = () => {
    if (!customer) return undefined;

    // Parse customer details from the details JSON field
    const details = customer.details as any;
    
    return {
      name: customer.name,
      email: details?.email || '',
      phone: details?.phone || '',
      address: details?.address || '',
      city: details?.city || '',
      state: details?.state || 'West Bengal',
      country: details?.country || 'India',
      postalCode: details?.postalCode || details?.postal_code || '',
      gstin: details?.gstin || '',
      taxNumber: details?.taxNumber || details?.tax_number || '',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        <CreateCustomerForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialData={getInitialData()}
          isEditing={isEditing}
          customerId={customerId}
        />
      </div>
    </div>
  );
}
