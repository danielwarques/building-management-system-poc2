import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import backend from "~backend/client";
import { useRole } from "../contexts/RoleContext";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Plus, Clock, CheckCircle, User, Calendar, UserCheck } from "lucide-react";
import CreateIssueDialog from "../components/CreateIssueDialog";

export default function Issues() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { currentUserType, currentUser, hasPermission, getBackendClient } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery({
    queryKey: ["issues", statusFilter],
    queryFn: () => {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      return getBackendClient().issues.list(params);
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getBackendClient().suppliers.list(),
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => getBackendClient().issues.update({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Issue updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating issue",
        description: error.message,
        variant: "destructive",
      });
      console.error("Update issue error:", error);
    },
  });

  const handleStatusChange = (issueId: number, newStatus: string) => {
    updateIssueMutation.mutate({ id: issueId, status: newStatus });
  };

  const handleAssignSupplier = (issueId: number, supplierId: number | null) => {
    updateIssueMutation.mutate({ 
      id: issueId, 
      assignedTo: supplierId || undefined,
      status: supplierId ? "assigned" : "open" // Auto-update status when assigning/unassigning
    });
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const statusColors = {
    open: "bg-gray-100 text-gray-800",
    assigned: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-600",
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
      case "assigned":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const canUpdateStatus = (issue: any) => {
    // Building owners can't update issue status
    // Syndics and administrators can update any issue
    return hasPermission("manage_issues");
  };

  const canAssignSupplier = (issue: any) => {
    // Only admin and syndic can assign suppliers
    return hasPermission("assign_suppliers");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Issues & Maintenance</h1>
          <p className="text-gray-600">Track and manage building maintenance requests</p>
        </div>
        {hasPermission("create_issue") && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {issues?.issues?.map((issue: any) => (
          <Card key={issue.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    {issue.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {issue.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={priorityColors[issue.priority as keyof typeof priorityColors]}>
                    {issue.priority}
                  </Badge>
                  <Badge className={statusColors[issue.status as keyof typeof statusColors]}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Reported by: {issue.reportedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium">{issue.buildingName}</span>
                  {issue.assetName && <span className="text-gray-600"> - {issue.assetName}</span>}
                </div>
              </div>

              {issue.assignedTo ? (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-600">Assigned to: </span>
                  <span className="text-sm font-medium">{issue.assignedTo}</span>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm text-gray-600">Not assigned</span>
                </div>
              )}

              {/* Assignment Management */}
              {canAssignSupplier(issue) && issue.status !== "closed" && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Assign to Supplier:</span>
                    <Select
                      value={issue.assignedTo ? suppliers?.suppliers?.find(s => s.contactName === issue.assignedTo)?.id.toString() || "" : "unassigned"}
                      onValueChange={(value) => {
                        const supplierId = value === "unassigned" ? null : parseInt(value);
                        handleAssignSupplier(issue.id, supplierId);
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {suppliers?.suppliers?.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.companyName} - {supplier.contactName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(issue.estimatedCost || issue.actualCost) && (
                <div className="mt-3 pt-3 border-t flex gap-4">
                  {issue.estimatedCost && (
                    <div>
                      <span className="text-sm text-gray-600">Estimated: </span>
                      <span className="text-sm font-medium">${issue.estimatedCost}</span>
                    </div>
                  )}
                  {issue.actualCost && (
                    <div>
                      <span className="text-sm text-gray-600">Actual: </span>
                      <span className="text-sm font-medium">${issue.actualCost}</span>
                    </div>
                  )}
                </div>
              )}

              {canUpdateStatus(issue) && issue.status !== "closed" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Update Status:</span>
                    <Select
                      value={issue.status}
                      onValueChange={(value) => handleStatusChange(issue.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!issues?.issues?.length && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
          <p className="text-gray-600 mb-4">No issues match your current filter</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report New Issue
          </Button>
        </div>
      )}

      <CreateIssueDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
