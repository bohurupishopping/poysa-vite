import { useEffect, useState } from "react";
import { Building2, Users, UserPlus, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AssignUserModal } from "@/components/modals/AssignUserModal";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalCompanies: number;
  totalManagers: number;
  unassignedUsers: number;
}

interface UnassignedUser {
  id: string;
  full_name: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalManagers: 0,
    unassignedUsers: 0,
  });
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch companies count
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact' })
          .is('deleted_at', null);

        // Fetch managers count
        const { count: managersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'manager');

        // Fetch unassigned users count and data
        const { data: unassignedUsersData, count: unassignedUsersCount } = await supabase
          .from('profiles')
          .select('id, full_name, created_at', { count: 'exact' })
          .eq('role', 'user')
          .is('company_id', null);

        setStats({
          totalCompanies: companiesCount || 0,
          totalManagers: managersCount || 0,
          unassignedUsers: unassignedUsersCount || 0,
        });
        setUnassignedUsers(unassignedUsersData || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System-wide overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 px-4 rounded-full border-0 bg-gray-100 hover:bg-gray-200"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Manage Users
          </Button>
          <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 rounded-full">
            <Building2 className="mr-2 h-4 w-4" />
            Create Company
          </Button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Companies</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
            <p className="text-xs text-gray-500 mt-1">All active companies</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Managers</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalManagers}</div>
            <p className="text-xs text-gray-500 mt-1">Assigned to companies</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unassigned Users</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.unassignedUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Users Table */}
      {unassignedUsers.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unassigned Users</h3>
                <p className="text-sm text-gray-600 mt-1">Users waiting for role and company assignment</p>
              </div>
              <Badge variant="secondary" className="rounded-full bg-orange-100 text-orange-800">
                {unassignedUsers.length} pending
              </Badge>
            </div>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'Unnamed User'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">Pending Assignment</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AssignUserModal
                        userId={user.id}
                        userName={user.full_name || 'Unnamed User'}
                        currentRole="user"
                        onUserUpdated={() => window.location.reload()}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-full"
                          >
                            Assign
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}