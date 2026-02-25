import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth and Layout
import { AuthProvider } from './context/AuthContext'; 
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import Login from './pages/Login';
import AdminDashboard from './pages/admin-dashboard'; 
import Inventory from './pages/Inventory';

// Using your specific file spelling and casing
import RecieveStock from './pages/RecieveStock'; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Phase 2 Routes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/inventory" element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          } />

          {/* Route for Inbound Module (Receive Stock) */}
          <Route path="/receive-stock" element={
            <ProtectedRoute>
              <RecieveStock />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;