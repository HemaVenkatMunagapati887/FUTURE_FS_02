import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth Guard: Restricts views to logged-in users and verifies role access
export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // If session verification is active, display a loading screen
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-crm-dark">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-crm-primary border-t-transparent shadow-glow"></div>
          <p className="text-sm font-medium text-crm-textMuted animate-pulse">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verify role authorizations
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render sub-routes inside the dashboard layout
  return <Outlet />;
};

export default ProtectedRoute;
