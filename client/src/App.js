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
import AdminLogs from "./pages/logs-pages/admin-logs";
import InboundLogs from "./pages/logs-pages/inbound-logs";
import OutboundLogs from "./pages/logs-pages/outbound-logs";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationBar />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/inbound-dashboard" element={<ProtectedRoute allowedRoles={["inbound"]}><InboundDashboard /></ProtectedRoute>} />
          <Route path="/outbound-dashboard" element={<ProtectedRoute allowedRoles={["outbound"]}><OutboundDashboard /></ProtectedRoute>} />
          <Route path="/inventory-home" element={<ProtectedRoute allowedRoles={["admin", "inbound", "outbound"]}><InventoryHome /></ProtectedRoute>} />
          <Route path="/receive-stock" element={<ProtectedRoute allowedRoles={["inbound"]}><ReceiveStock /></ProtectedRoute>} />
          <Route path="/dispatch-stock" element={<ProtectedRoute allowedRoles={["outbound"]}><DispatchStock /></ProtectedRoute>} />
          <Route path="/inventory/:sku" element={<InventoryItem />} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={["admin", "inbound", "outbound"]}><Profile /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>} />
          <Route path="/admin-logs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLogs /></ProtectedRoute>} />
          <Route path="/inbound-logs" element={<ProtectedRoute allowedRoles={["inbound"]}><InboundLogs /></ProtectedRoute>} />
          <Route path="/outbound-logs" element={<ProtectedRoute allowedRoles={["outbound"]}><OutboundLogs /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;