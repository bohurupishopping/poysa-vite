import { useEffect, useState } from "react";
import { BookOpen, Edit, ToggleLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCompanyContext } from "@/components/CompanyContextSwitcher";
import { CreateAccountModal } from "@/components/modals/CreateAccountModal";
import { supabase } from "@/integrations/supabase/client";

interface Account {
  id: string;
  account_code: string | null;
  account_name: string;
  account_type: string | null;
  account_class: string;
  parent_account_id: string | null;
  is_active: boolean;
  description: string | null;
}

export default function ChartOfAccounts() {
  const { selectedCompany } = useCompanyContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', selectedCompany)
        .is('deleted_at', null)
        .order('account_code');

      if (data) {
        setAccounts(data);
        setFilteredAccounts(data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [selectedCompany]);

  // Filter accounts based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account =>
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_class.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, accounts]);

  const getAccountClassBadge = (accountClass: string): "default" | "destructive" | "secondary" | "outline" => {
    const classColors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      'asset': 'default',
      'liability': 'destructive',
      'equity': 'secondary',
      'revenue': 'default',
      'expense': 'outline'
    };
    return classColors[accountClass] || 'outline';
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
          <p className="text-neutral-500">Please select a company to manage chart of accounts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading chart of accounts...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart of Accounts</h1>
          <p className="text-gray-600">Manage the company's financial account structure</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-64 rounded-full border-0 focus-visible:ring-1"
            />
          </div>
          <CreateAccountModal
            companyId={selectedCompany}
            onAccountCreated={fetchAccounts}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading accounts...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No accounts found matching your search.' : 'No accounts found. Create your first account to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">
                    {account.account_code || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-neutral-500" />
                      {account.account_name}
                    </div>
                  </TableCell>
                  <TableCell>{account.account_type || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getAccountClassBadge(account.account_class)}>
                      {account.account_class}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {account.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ToggleLeft className="h-4 w-4" />
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