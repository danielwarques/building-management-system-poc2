import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import backend from "~backend/client";

export type UserType = 'building_owner' | 'syndic' | 'administrator';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getAuthenticatedBackend: () => typeof backend;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function validateUser(data: any): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'number' &&
    typeof data.email === 'string' &&
    typeof data.firstName === 'string' &&
    typeof data.lastName === 'string' &&
    (data.userType === 'building_owner' || data.userType === 'syndic' || data.userType === 'administrator')
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        if (validateUser(parsed)) {
          setUser(parsed);
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await backend.auth.login({ email, password });

    if (!validateUser(response.user)) {
      throw new Error('Invalid user data received from server');
    }

    localStorage.setItem("authToken", response.token);
    localStorage.setItem("userData", JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
  }, []);

  const getAuthenticatedBackend = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      return backend.with({ auth: { authorization: `Bearer ${token}` } });
    }
    return backend;
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isLoading, getAuthenticatedBackend }),
    [user, login, logout, isLoading, getAuthenticatedBackend]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}