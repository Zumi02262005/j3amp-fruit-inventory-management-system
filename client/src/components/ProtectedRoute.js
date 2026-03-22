import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Handle the "Wait" state while checking localStorage/token
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Verifying access...</p>
      </div>
    );
  }

  // 2. Not logged in? Send them to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged in, but role not authorized for this specific route?
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath =
      user.role === "admin" ? "/admin-dashboard" : "/inventory-home";
    return <Navigate to={defaultPath} replace />;
  }

  // 4. Authorized! Render the component
  return children;
};

export default ProtectedRoute;