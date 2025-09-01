import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateSupplierForm } from '@/components/forms/CreateSupplierForm';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { SupplierService } from '@/services/supplierService';
import { Supplier } from '@/integrations/supabase/manager-types';

export function CreateSupplier() {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const isEditing = Boolean(supplierId);

  useEffect(() => {
    if (isEditing && supplierId) {
      loadSupplier();
    }
  }, [supplierId, isEditing]);

  const loadSupplier = async () => {
    if (!supplierId) return;

    setLoading(true);
    try {
      const supplierData = await SupplierService.getSupplier(supplierId);
      if (supplierData) {
        setSupplier(supplierData);
      } else {
        toast({
          title: 'Error',
          description: 'Supplier not found',
          variant: 'destructive',
        });
        navigate('/manager/suppliers');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load supplier',
        variant: 'destructive',
      });
      navigate('/manager/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/manager/suppliers');
  };

  const handleCancel = () => {
    navigate('/manager/suppliers');
  };

  const getInitialData = () => {
    if (!supplier) return {};

    const details = SupplierService.supplierDetailsToForm(supplier.details as any);

    return {
      name: supplier.name,
      gstin: (supplier.details as any)?.gstin || '',
      ...details,
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
        <CreateSupplierForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialData={getInitialData()}
          isEditing={isEditing}
          supplierId={supplierId}
        />
      </div>
    </div>
  );
}
