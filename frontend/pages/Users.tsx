import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Search, UserPlus, Mail, Phone, Calendar, Shield, User as UserIcon, Users as UsersIcon, Building, Settings } from "lucide-react";
import { useRole } from "../contexts/RoleContext";
import CreateUserDialog from "../components/CreateUserDialog";
import backend from "~backend/client";



interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'building_owner' | 'syndic' | 'administrator';
  phone?: string;
  companyName?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getBackendClient } = useRole();

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Attempting to fetch users...");
      // Use the direct backend client since listUsers API doesn't require authentication
      const result = await backend.auth.listUsers();
      console.log("Successfully fetched users:", result);
      return result;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ userId, userType, active }: { userId: number; userType: 'building_owner' | 'syndic' | 'administrator'; active: boolean }) =>
      getBackendClient().auth.toggleUser({ userId, userType, active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const buildingOwners = usersData?.buildingOwners || [];
  const syndics = usersData?.syndics || [];
  const administrators = usersData?.administrators || [];
  
  const allUsers = [
    ...buildingOwners.map(u => ({ ...u, userType: 'building_owner' as const })),
    ...syndics.map(u => ({ ...u, userType: 'syndic' as const })),
    ...administrators.map(u => ({ ...u, userType: 'administrator' as const }))
  ];

  const filteredUsers = allUsers.filter((user: UserData) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserType = userTypeFilter === "all" || user.userType === userTypeFilter;
    
    return matchesSearch && matchesUserType;
  });

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case "administrator":
        return "bg-red-100 text-red-800";
      case "syndic":
        return "bg-blue-100 text-blue-800";
      case "building_owner":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "administrator":
        return <Settings className="h-4 w-4" />;
      case "syndic":
        return <Shield className="h-4 w-4" />;
      case "building_owner":
        return <Building className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const userTypeStats = {
    building_owner: buildingOwners.length,
    syndic: syndics.length,
    administrator: administrators.length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Building Owners</h1>
          <p className="text-gray-600 mt-1">Manage building owners, syndics, and administrators</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Building className="h-4 w-4" />
                Building Owners
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTypeStats.building_owner}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Shield className="h-4 w-4" />
                Syndics
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTypeStats.syndic}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Settings className="h-4 w-4" />
                Administrators
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTypeStats.administrator}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find users by name, email, or role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All User Types</SelectItem>
                <SelectItem value="building_owner">Building Owner</SelectItem>
                <SelectItem value="syndic">Syndic</SelectItem>
                <SelectItem value="administrator">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-red-600 font-semibold mb-2">Error loading users</div>
                <div className="text-sm text-gray-600">
                  {error instanceof Error ? error.message : "Failed to fetch users"}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>User Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: UserData) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadgeColor(user.userType)}`}>
                          {getUserTypeIcon(user.userType)}
                          <span className="ml-1">{user.userType.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.companyName ? (
                          <span>{user.companyName}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserMutation.mutate({ 
                            userId: user.id,
                            userType: user.userType,
                            active: !user.active 
                          })}
                          disabled={toggleUserMutation.isPending}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm || userTypeFilter !== "all" 
                            ? "No users found matching your criteria"
                            : "No users found"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}