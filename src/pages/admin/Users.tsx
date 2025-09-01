import { useEffect, useState } from "react";
import { Users as UsersIcon, Edit, Search, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssignUserModal } from "@/components/modals/AssignUserModal";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'user';
  company_id: string | null;
  created_at: string;
  companies?: { name: string };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select(`
          *,
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [roleFilter, users, searchTerm]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600">Manage user roles and company assignments</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Search and Filter in same row as buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 lg:flex-none">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 lg:h-10 w-full sm:w-64 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 lg:h-10 rounded-full border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles ({users.length})</SelectItem>
                  <SelectItem value="admin">Admin ({users.filter(u => u.role === 'admin').length})</SelectItem>
                  <SelectItem value="manager">Manager ({users.filter(u => u.role === 'manager').length})</SelectItem>
                  <SelectItem value="user">User ({users.filter(u => u.role === 'user').length})</SelectItem>
                </SelectContent>
              </Select>
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
                onClick={fetchUsers}
                variant="outline"
                className="h-9 lg:h-10 px-3 lg:px-4 rounded-full border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-blue-900 mb-1">{users.length}</div>
            <p className="text-xs text-blue-600/70">All time</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-red-700">Admins</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-red-900 mb-1">{users.filter(u => u.role === 'admin').length}</div>
            <p className="text-xs text-red-600/70">System administrators</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Managers</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-green-900 mb-1">{users.filter(u => u.role === 'manager').length}</div>
            <p className="text-xs text-green-600/70">Company managers</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-100/50 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700">Regular Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-bold text-purple-900 mb-1">{users.filter(u => u.role === 'user').length}</div>
            <p className="text-xs text-purple-600/70">Standard users</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      ) : (
        <>
          {/* Users Table */}
          <Card className="rounded-xl border border-gray-100/50 bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/30">
                  <TableRow className="hover:bg-gray-50/30">
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Name</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Role</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Assigned Company</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-6">Joined</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-gray-500">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-20 flex items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                          <p className="text-gray-600">
                            {searchTerm || roleFilter !== 'all' 
                              ? 'Try adjusting your search criteria or clear filters to see all users'
                              : 'No users have been registered yet'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/20 transition-colors">
                        <TableCell className="py-4 px-6 font-medium">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-neutral-500" />
                            {user.full_name || 'Unnamed User'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="rounded-full px-3 py-1">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {user.companies?.name || (
                            <span className="text-neutral-500 italic">No assignment</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <AssignUserModal
                            userId={user.id}
                            userName={user.full_name || 'Unnamed User'}
                            currentRole={user.role}
                            currentCompanyId={user.company_id}
                            onUserUpdated={fetchUsers}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-full border-purple-600 bg-purple-600 text-white hover:bg-purple-700 hover:border-purple-700 transition-all duration-200 text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            }
                          />
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
