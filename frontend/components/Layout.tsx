import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useRole } from "../contexts/RoleContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import { 
  Building2, 
  Home, 
  AlertTriangle, 
  Briefcase, 
  Bell, 
  User,
  LogOut,
  Shield,
  Users
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { currentUserType, currentUser, hasPermission, getBackendClient } = useRole();
  const { logout } = useAuth();
  const { toast } = useToast();

  const { data: notifications } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: () => getBackendClient().notifications.list({ unreadOnly: true, limit: 1 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, show: true },
    { name: "Buildings", href: "/buildings", icon: Building2, show: hasPermission("view_buildings") },
    { name: "Users", href: "/users", icon: Users, show: currentUser?.role === 'admin' },
    { name: "Conseil", href: "/conseil", icon: Shield, show: hasPermission("view_buildings") || currentUser?.role === 'conseil_member' },
    { name: "Issues", href: "/issues", icon: AlertTriangle, show: hasPermission("view_issues") },
    { name: "Suppliers", href: "/suppliers", icon: Briefcase, show: hasPermission("view_suppliers") },
  ].filter(item => item.show);

  const isActive = (href: string) => location.pathname === href;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "syndic":
        return "bg-blue-100 text-blue-800";
      case "owner":
        return "bg-green-100 text-green-800";
      case "supplier":
        return "bg-orange-100 text-orange-800";
      case "conseil_member":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold">BuildingMgmt</span>
          </div>



          {/* User Info */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge className={getRoleBadgeColor(currentUser?.role || "")}>
                {currentUser?.role.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 py-4 border-t space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
              {notifications?.unreadCount && notifications.unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {notifications?.unreadCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                logout();
                toast({
                  title: "Signed out",
                  description: "You have been successfully signed out.",
                });
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}