import { useEffect, useState } from "react";
import { Building2, Archive, RotateCcw, Search, Trash2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCompanyModal } from "@/components/modals/CreateCompanyModal";
import { EditCompanyModal } from "@/components/modals/EditCompanyModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  state: string | null;
  gstin: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  pan_number: string | null;
  tan_number: string | null;
  cin_number: string | null;
  business_type: string | null;
  created_at: string;
  deleted_at: string | null;
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setCompanies(data);
        setFilteredCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCompany = async (companyId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          deleted_at: isArchived ? null : new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Company ${isArchived ? 'restored' : 'archived'} successfully`,
      });

      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isArchived ? 'restore' : 'archive'} company`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${companyName}" and ALL its data? This action cannot be undone and will remove all invoices, customers, products, and financial records associated with this company.`
    );

    if (!confirmed) return;

    try {
      const { error } = await (supabase as any).rpc('delete_company_and_all_data', {
        p_company_id_to_delete: companyId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Company "${companyName}" and all its data have been permanently deleted`,
      });

      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter companies based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.pan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.business_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Companies
            </h1>
            <p className="text-gray-600">Manage all tenant companies</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                variant="outline"
                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                onClick={fetchCompanies}
                variant="outline"
                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <CreateCompanyModal onCompanyCreated={fetchCompanies} triggerClassName="rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{companies.length}</div>
            <p className="text-xs text-blue-600/70">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Active Companies</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{companies.filter(c => !c.deleted_at).length}</div>
            <p className="text-xs text-green-600/70">Currently operating</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-700">Archived Companies</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-orange-900 mb-1">{companies.filter(c => c.deleted_at).length}</div>
            <p className="text-xs text-orange-600/70">Inactive companies</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700">GST Registered</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{companies.filter(c => c.gstin).length}</div>
            <p className="text-xs text-purple-600/70">With GST numbers</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading companies...</span>
        </div>
      ) : (
        <>
          {/* Companies Table */}
          <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow className="hover:bg-gray-50/30">
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Company Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Business Type</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Location</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">GSTIN</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-20 flex items-center justify-center">
                            <Search className="h-8 w-8 text-gray-40" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
                          <p className="text-gray-600">
                            {searchTerm 
                              ? 'Try adjusting your search criteria to see all companies'
                              : 'No companies have been created yet'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-gray-50/20 transition-colors">
                        <TableCell className="py-4 px-6 font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-neutral-500" />
                            <div>
                              <div>{company.name}</div>
                              {company.business_type && (
                                <div className="text-xs text-muted-foreground">{company.business_type}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {company.business_type || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm">
                            {company.city && company.state ? (
                              <div>{company.city}, {company.state}</div>
                            ) : company.city ? (
                              <div>{company.city}</div>
                            ) : company.state ? (
                              <div>{company.state}</div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {company.postal_code && (
                              <div className="text-xs text-muted-foreground">{company.postal_code}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm">
                            {company.phone && <div>{company.phone}</div>}
                            {company.email && (
                              <div className="text-xs text-muted-foreground">{company.email}</div>
                            )}
                            {!company.phone && !company.email && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm">
                            {company.gstin ? (
                              <div>{company.gstin}</div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {company.pan_number && (
                              <div className="text-xs text-muted-foreground">PAN: {company.pan_number}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge 
                            variant={company.deleted_at ? "destructive" : "default"}
                            className="rounded-full px-3 py-1"
                          >
                            {company.deleted_at ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <EditCompanyModal
                              company={company}
                              onCompanyUpdated={fetchCompanies}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-8 px-3 rounded-full border-gray-300 transition-all duration-200 text-xs ${
                                company.deleted_at 
                                  ? 'bg-green-600 text-white hover:bg-green-700 hover:border-green-700' 
                                  : 'bg-orange-600 text-white hover:bg-orange-700 hover:border-orange-700'
                              }`}
                              onClick={() => handleArchiveCompany(company.id, !!company.deleted_at)}
                            >
                              {company.deleted_at ? (
                                <>
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Restore
                                </>
                              ) : (
                                <>
                                  <Archive className="h-3 w-3 mr-1" />
                                  Archive
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 px-3 rounded-full bg-red-600 hover:bg-red-70 border-red-600 hover:border-red-700 transition-all duration-200 text-xs"
                              onClick={() => handleDeleteCompany(company.id, company.name)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
