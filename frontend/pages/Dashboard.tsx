import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRole } from "../contexts/RoleContext";
import { AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Wrench } from "lucide-react";

export default function Dashboard() {
  const { getBackendClient } = useRole();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getBackendClient().dashboard.getStats(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Issues",
      value: stats?.totalIssues || 0,
      icon: Wrench,
      color: "text-blue-600",
    },
    {
      title: "Open Issues",
      value: stats?.openIssues || 0,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "In Progress",
      value: stats?.inProgressIssues || 0,
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Completed",
      value: stats?.completedIssues || 0,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Overview of your building management activities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total Cost */}
      {stats?.totalCost && stats.totalCost > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-3xl font-bold">${stats?.totalCost?.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>Latest reported issues and maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentIssues?.length ? (
                stats?.recentIssues?.map((issue: any) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{issue.title}</h4>
                      <p className="text-sm text-gray-600">{issue.buildingName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[issue.priority as keyof typeof priorityColors]}>
                        {issue.priority}
                      </Badge>
                      <Badge className={statusColors[issue.status as keyof typeof statusColors]}>
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent issues</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Expirations */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expirations</CardTitle>
            <CardDescription>Documents and warranties expiring soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.upcomingExpirations?.length ? (
                stats.upcomingExpirations.map((exp: any) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <h4 className="font-medium">{exp.name}</h4>
                        <p className="text-sm text-gray-600">{exp.buildingName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {new Date(exp.expiryDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming expirations</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
