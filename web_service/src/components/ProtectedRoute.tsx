import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasValidAuthentication } from '../lib/tokenUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function ProtectedRoute({ children, isAuthenticated }: ProtectedRouteProps) {
  const location = useLocation();

  // Double-check authentication using both prop and localStorage
  const hasValidAuth = isAuthenticated && hasValidAuthentication();

  if (!hasValidAuth) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
