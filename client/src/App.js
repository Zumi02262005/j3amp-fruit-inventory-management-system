import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavigationBar from "./components/NavigationBar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/admin-dashboard";
import InboundDashboard from "./pages/dashboards/inbound-dashboard";
import OutboundDashboard from "./pages/dashboards/outbound-dashboard";
import InventoryHome from "./pages/inventory/inventory-home";
import InventoryItem from "./pages/inventory/inventory-item";
import ReceiveStock from "./pages/transactions/receive-stock";
import DispatchStock from "./pages/transactions/dispatch-stock";
import Profile from "./pages/profile/Profile";
import Users from "./pages/users/Users";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationBar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* NEW: User Management Route */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbound-dashboard"
            element={
              <ProtectedRoute allowedRoles={["inbound"]}>
                <InboundDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/outbound-dashboard"
            element={
              <ProtectedRoute allowedRoles={["outbound", "admin"]}>
                <OutboundDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory-home"
            element={
              <ProtectedRoute allowedRoles={["admin", "inbound", "outbound"]}>
                <InventoryHome />
              </ProtectedRoute>
            }
          />

          <Route
            path="/receive-stock"
            element={
              <ProtectedRoute allowedRoles={["inbound", "admin"]}>
                <ReceiveStock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dispatch-stock"
            element={
              <ProtectedRoute allowedRoles={["outbound", "admin"]}>
                <DispatchStock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/:sku"
            element={<InventoryItem />}
          />

          {/* Profile - all roles */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["admin", "inbound", "outbound"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Users - admin only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;