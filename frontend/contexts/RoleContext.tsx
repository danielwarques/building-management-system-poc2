import { createContext, useContext, ReactNode } from "react";
import { useAuth, UserType } from "./AuthContext";
import backend from "~backend/client";

interface RoleContextType {
  currentUserType: UserType;
  currentUser: any;
  hasPermission: (action: string, resource?: any) => boolean;
  getBackendClient: () => typeof backend;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export function RoleProvider({ children }: RoleProviderProps) {
  const { user, getAuthenticatedBackend } = useAuth();
  
  const currentUserType = user?.userType || "administrator";
  const currentUser = user;



  const getBackendClient = () => {
    return getAuthenticatedBackend();
  };

  const hasPermission = (action: string, resource?: any): boolean => {
    switch (currentUserType) {
      case "administrator":
        return true; // Admin can do everything

      case "syndic":
        // Syndic can manage buildings and issues, but not create new buildings
        if (action === "create_building") return false;
        if (action === "manage_issues") return true;
        if (action === "view_buildings") return true;
        if (action === "assign_suppliers") return true;
        if (action === "view_suppliers") return true;
        return true;

      case "building_owner":
        // Building owners can only view their buildings and create issues
        if (action === "create_building") return false;
        if (action === "create_supplier") return false;
        if (action === "assign_suppliers") return false;
        if (action === "view_buildings") return true; // Limited to their buildings
        if (action === "create_issue") return true;
        if (action === "view_issues") return true; // Limited to their buildings
        return false;

      default:
        return false;
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentUserType,
        currentUser,
        hasPermission,
        getBackendClient,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}