import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavigationBar from "./components/NavigationBar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboards/admin-dashboard";
import InboundDashboard from "./pages/dashboards/inbound-dashboard";
import InventoryHome from "./pages/inventory/inventory-home";
import InventoryItem from "./pages/inventory/inventory-item";
import ReceiveStock from "./pages/transactions/receive-stock";
import DispatchStock from "./pages/transactions/dispatch-stock";
import "./App.css";
import OutboundDashboard from "./pages/dashboards/outbound-dashboard";

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

          <Route
            path="/inbound-dashboard"
            element={
              // Added 'admin' so they don't get kicked out if they visit this
              <ProtectedRoute allowedRoles={["inbound"]}>
                <InboundDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/outbound-dashboard"
            element={
              <ProtectedRoute allowedRoles={["outbound"]}>
                <OutboundDashboard />
              </ProtectedRoute>
            }
          />

          {/* 2. Added the missing Inventory Route */}
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
              <ProtectedRoute allowedRoles={["inbound"]}>
                <ReceiveStock />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dispatch-stock"
            element={
              <ProtectedRoute allowedRoles={["outbound"]}>
                <DispatchStock />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/inventory/:sku" 
            element={<InventoryItem />}
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Route - This was catching /inventory-home before! */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
