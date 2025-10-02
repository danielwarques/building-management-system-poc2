import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Buildings from "./pages/Buildings";
import Users from "./pages/Users";
import Conseil from "./pages/Conseil";
import Issues from "./pages/Issues";
import Suppliers from "./pages/Suppliers";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import "./globals.css";

// Add error handler for message origin issues
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Invalid message origin') || 
        event.message?.includes('message origin')) {
      // Suppress these specific development environment errors
      event.preventDefault();
      console.warn('Suppressed message origin error (development environment):', event.message);
      return false;
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Invalid message origin') ||
        event.reason?.message?.includes('message origin')) {
      // Suppress these specific development environment errors
      event.preventDefault();
      console.warn('Suppressed unhandled rejection for message origin (development environment):', event.reason?.message);
    }
  });
}

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/users" element={<Users />} />
        <Route path="/conseil" element={<Conseil />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RoleProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <ProtectedRoutes />
                <Toaster />
              </div>
            </Router>
          </RoleProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
