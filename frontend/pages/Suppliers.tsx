import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import backend from "~backend/client";
import { useRole } from "../contexts/RoleContext";
import { Mail, Phone, Star, Briefcase, Plus } from "lucide-react";
import CreateSupplierDialog from "../components/CreateSupplierDialog";

export default function Suppliers() {
  const { hasPermission, getBackendClient } = useRole();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getBackendClient().suppliers.list(),
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

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-gray-600">Manage your trusted service providers</p>
        </div>
        {hasPermission("create_supplier") && (
          <CreateSupplierDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </CreateSupplierDialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.suppliers?.map((supplier: any) => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                {supplier.companyName}
              </CardTitle>
              <CardDescription>{supplier.contactName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a 
                    href={`mailto:${supplier.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {supplier.email}
                  </a>
                </div>
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a 
                      href={`tel:${supplier.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Specialties */}
              <div>
                <h4 className="text-sm font-medium mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-1">
                  {supplier.specialties?.length ? (
                    supplier.specialties.map((specialty: string) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No specialties listed</span>
                  )}
                </div>
              </div>

              {/* Rating and Jobs */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-xs text-gray-600">Rating</p>
                  {supplier.rating > 0 ? (
                    renderRating(supplier.rating)
                  ) : (
                    <span className="text-sm text-gray-500">No ratings yet</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Jobs Completed</p>
                  <p className="text-lg font-bold">{supplier.totalJobs}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!suppliers?.suppliers?.length && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first supplier</p>
          {hasPermission("create_supplier") && (
            <CreateSupplierDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </CreateSupplierDialog>
          )}
        </div>
      )}
    </div>
  );
}
