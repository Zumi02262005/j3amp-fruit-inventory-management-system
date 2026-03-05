import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  console.log("user:", user, "loading:", loading, "isAuthenticated:", isAuthenticated);

  // 1. Handle the "Wait" state while checking localStorage/token
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Verifying access...</p>
      </div>
    );
  }

  // 2. Not logged in? Send them to login
  // We save the current location so we can redirect them back after they log in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Logged in, but role not authorized for this specific route?
  // If allowedRoles is provided (e.g., ['admin']), check if user has it
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they aren't an admin, send them to their specific default home
    const defaultPath =
      user.role === "admin" ? "/admin-dashboard" : "/inventory-home";
    return <Navigate to={defaultPath} replace />;
  }
  

  // 4. Authorized! Render the component
  return children;
};

export default ProtectedRoute;
