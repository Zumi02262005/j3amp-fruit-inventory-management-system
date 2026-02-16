import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>J3AMP Logistics</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {user?.name || user?.email}!</h2>
          <p>Role: <strong>{user?.role}</strong></p>
        </div>

        <div className="info-card">
          <h3>🎉 Phase 1 Complete!</h3>
          <p>Your authentication system is working!</p>
          <ul>
            <li>Login successful HAHAHAHHA WOOOOOOOOO</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;