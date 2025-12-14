import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// --- PAGE IMPORTS ---
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Role-Based Dashboards
import RequesterPage from "./pages/RequesterPage";
import ProcurementPage from "./pages/ProcurementPage";
import AuditPage from "./pages/AuditPage";
import FinancePage from "./pages/FinancePage";
import ExecutivesPage from "./pages/ExecutivesPage";

// Other Pages
import PastRequestsPage from "./pages/PastRequests";
import ToolIframePage from "./pages/ToolIframe";

const queryClient = new QueryClient();

// --- FIXED PROTECTED ROUTE (DEBUG VERSION) ---
const ProtectedRoute = ({ 
  children, 
  allow 
}: { 
  children: React.ReactElement; 
  allow?: string[] 
}) => {
  const { isAuthenticated, loading, profile } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // 2. Not Logged In -> Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Verification (The "Lazy Fix")
  if (allow && profile?.role) {
    // Convert to lowercase and trim spaces to prevent errors
    const userRole = String(profile.role).toLowerCase().trim();
    const allowedRoles = allow.map((r) => r.toLowerCase().trim());

    // DEBUG: Open your browser console (F12) to see this!
    console.log(`[AUTH CHECK] User Role: "${userRole}" | Allowed: ${JSON.stringify(allowedRoles)}`);

    if (!allowedRoles.includes(userRole)) {
      console.warn(`BLOCKED! "${userRole}" is not in allowed list.`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If logic passes, render the dashboard
  return children;
};

// --- MAIN APP COMPONENT ---
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Role-Based Routes */}
            <Route 
              path="/requester" 
              element={
                <ProtectedRoute allow={["requester"]}>
                  <RequesterPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/procurement" 
              element={
                <ProtectedRoute allow={["procurement"]}>
                  <ProcurementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/audit" 
              element={
                <ProtectedRoute allow={["audit"]}>
                  <AuditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/finance" 
              element={
                <ProtectedRoute allow={["finance"]}>
                  <FinancePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/executives" 
              element={
                <ProtectedRoute allow={["executive"]}>
                  <ExecutivesPage />
                </ProtectedRoute>
              } 
            />

            {/* Shared Protected Pages */}
            <Route path="/requests-history" element={<PastRequestsPage />} />
            <Route path="/tools/anomaly" element={<ToolIframePage />} />

            {/* Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;