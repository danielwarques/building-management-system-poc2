import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import backend from "~backend/client";
import { useRole } from "../contexts/RoleContext";
import { Users, Shield, AlertCircle, CheckCircle, Building2, Eye, FileText } from "lucide-react";

export default function Conseil() {
  const { hasPermission, getBackendClient } = useRole();

  const { data: conseilsData, isLoading } = useQuery({
    queryKey: ["conseil"],
    queryFn: () => getBackendClient().conseil.list(),
  });

  const conseils = conseilsData?.conseils;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Conseil de Copropriété
          </h1>
          <p className="text-gray-600">Supervisory councils monitoring syndic management</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="supervisions">Supervisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conseils?.map((conseil: any) => (
              <Card key={conseil.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {conseil.buildingName}
                  </CardTitle>
                  <CardDescription>
                    Council established {new Date(conseil.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* President */}
                    {conseil.president && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default">President</Badge>
                        </div>
                        <p className="font-medium">
                          {conseil.president.firstName} {conseil.president.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{conseil.president.email}</p>
                      </div>
                    )}

                    {/* Members Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Members</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {conseil.members.length}
                      </Badge>
                    </div>

                    {/* Roles Distribution */}
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Roles</div>
                      <div className="flex flex-wrap gap-1">
                        {conseil.members.map((member: any) => (
                          <Badge key={member.id} variant="secondary" className="text-xs">
                            {member.role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-3 w-3 mr-2" />
                        View Details
                      </Button>
                      {hasPermission("create_supervision") && (
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-3 w-3 mr-2" />
                          Create Supervision
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {conseils && conseils.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No councils found</h3>
              <p className="text-gray-600 mb-4">
                Councils need to be created for buildings to supervise syndic management
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="supervisions" className="space-y-6">
          <SupervisionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SupervisionsTab() {
  const { getBackendClient } = useRole();

  // This would need to be implemented - fetching all supervisions
  const { data: supervisions, isLoading } = useQuery({
    queryKey: ["supervisions"],
    queryFn: async () => {
      // Placeholder - would need to implement backend endpoint
      return [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {supervisions && supervisions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No supervisions found</h3>
          <p className="text-gray-600 mb-4">
            Council members can create supervisions to monitor syndic activities
          </p>
        </div>
      )}
    </div>
  );
}