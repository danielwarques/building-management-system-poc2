import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import { useRole } from "../contexts/RoleContext";
import { Building2, MapPin, Users, UserCheck, Shield, AlertTriangle } from "lucide-react";
import CreateBuildingDialog from "../components/CreateBuildingDialog";
import CreateConseilDialog from "../components/CreateConseilDialog";

export default function Buildings() {
  const { hasPermission, getBackendClient } = useRole();

  const { data: buildings, isLoading, error } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => getBackendClient().buildings.list(),
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Buildings</h1>
          <p className="text-gray-600">Manage your building portfolio</p>
        </div>
        {hasPermission("create_building") && (
          <CreateBuildingDialog>
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Add Building
            </Button>
          </CreateBuildingDialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings?.buildings?.map((building: any) => (
          <Card key={building.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                {building.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {building.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Units</span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {building.unitsCount}
                  </Badge>
                </div>
                
                {/* Syndic Information */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Syndic</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={building.syndicType === 'professional' ? 'default' : 'secondary'}>
                        {building.syndicType === 'professional' ? 'Professional' : 'Voluntary'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {building.syndicCompanyName || building.syndicName}
                  </div>
                  {building.syndicContactEmail && (
                    <div className="text-xs text-gray-500">{building.syndicContactEmail}</div>
                  )}
                </div>
                
                {/* Conseil Information */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conseil</span>
                  <div className="flex items-center gap-2">
                    {building.hasConseil ? (
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-500">Missing</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {building.hasConseil && building.conseilPresidentName && (
                  <div className="text-sm">
                    <span className="text-gray-600">President: </span>
                    <span className="font-medium">{building.conseilPresidentName}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
                {!building.hasConseil && (
                  <CreateConseilDialog buildingId={building.id}>
                    <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-200 hover:bg-orange-50">
                      <Shield className="h-3 w-3 mr-1" />
                      Create Conseil
                    </Button>
                  </CreateConseilDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {buildings && buildings.buildings && buildings.buildings.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No buildings found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first building</p>
          {hasPermission("create_building") && (
            <CreateBuildingDialog>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Add Building
              </Button>
            </CreateBuildingDialog>
          )}
        </div>
      )}
    </div>
  );
}
