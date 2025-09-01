import { useEffect, useState } from "react";
import { Building2, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { CreateSupplierModal } from "@/components/modals/CreateSupplierModal";
import { ViewSupplierModal } from "@/components/modals/ViewSupplierModal";
import { supabase } from "@/integrations/supabase/client";

interface Supplier {
  id: string;
  name: string;
  details: any;
}

export default function Suppliers() {
  const { selectedCompany } = useCompanyContext();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', selectedCompany)
        .is('deleted_at', null)
        .order('name');

      if (data) {
        setSuppliers(data);
        setFilteredSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [selectedCompany]);

  // Filter suppliers based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.details?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.details?.phone?.includes(searchTerm) ||
        supplier.details?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-neutral-500">Please select a company to manage suppliers.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading suppliers...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
          <p className="text-gray-600">Manage the company's supplier list</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-64 rounded-full border-0 focus-visible:ring-1"
            />
          </div>
          <CreateSupplierModal
            companyId={selectedCompany}
            onSupplierCreated={fetchSuppliers}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading suppliers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers found. Create your first supplier to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-neutral-500" />
                      {supplier.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.details?.email || '-'}
                  </TableCell>
                  <TableCell>
                    {supplier.details?.phone || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {supplier.details?.address || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ViewSupplierModal supplierId={supplier.id} />
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
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