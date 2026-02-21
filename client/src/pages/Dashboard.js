import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import notification_bell from '../assets/icons/notification_bell.svg';
import profile_icon from '../assets/icons/profile_icon.svg';
import generate_report_icon from '../assets/icons/generate_report_icon.svg';
import manage_users_icon from '../assets/icons/manage_users_icon.svg';
import backup_data_icon from '../assets/icons/backup_icon.svg';
import view_inventory_icon from '../assets/icons/view_inventory_icon.svg';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- NEW FUNCTIONS TO MAKE BUTTONS WORK ---

  // 1. Logic for Generate Report
  const handleGenerateReport = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports/total-stock');
      const data = await response.json();
      console.log("Report Data:", data);
      alert("Generating Report... Check the Console for data!");
      // Later, you can navigate to a /reports page here
    } catch (err) {
      alert("Backend not running or Error: " + err.message);
    }
  };

  // 2. Logic for View Inventory
  const handleViewInventory = () => {
    // This tells the app to go to the Inventory screen
    navigate('/inventory'); 
  };

  // 3. Logic for Manage Users (Admins only)
  const handleManageUsers = () => {
    if (user?.role === 'Admin') {
      navigate('/users');
    } else {
      alert("Access Denied: You are not an Admin!");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <p className="dashboard-overview-label">Overview</p>
        <button className="notification-button">
          <img src={notification_bell} alt="Notifications" className="notification-icon" />
        </button>
        <button className="profile-button" onClick={handleLogout} title="Click to Logout">
          <img src={profile_icon} alt="Profile" className="profile-icon" />
        </button>
      </div>

      <div className="dashboard-content">
        {/* Stock Overview Header */}
        <div className="stock-overview">
          <div className="total-stock-section">
            <p className="total-stock">Total Stock</p>
            <p className="total-stock-amount">1250.00 kg</p>
          </div>
          <div className="stock-subsection">
            <div className="categories-section">
              <p className="categories">Categories: </p>
              <p className="categories-count">12</p>
            </div>
            <div className="expiring-section">
              <p className="expiring">Expiring: </p>
              <p className="expiring-count">5</p>
            </div>
          </div>
        </div>

        <div className="welcome-section">
          <h2>Welcome, {user?.name || user?.email}!</h2>
          <p>Role: <strong>{user?.role}</strong></p>
        </div>

        {/* Action Buttons (Now Functional) */}
        <div id="admin-quick-actions">
          <button id="generate-report-card" onClick={handleGenerateReport}>
            <img src={generate_report_icon} alt="Generate Report" className="action-icon" /> 
            <p id="generate-report-text">Generate report</p>
          </button>

          <button id="manage-users-card" onClick={handleManageUsers}>
            <img src={manage_users_icon} alt="Manage Users" className="action-icon" />
            <p id="manage-users-text">Manage users</p>
          </button>

          <button id="backup-data-card" onClick={() => alert("Backup started...")}>
            <img src={backup_data_icon} alt="Backup Data" className="action-icon" />
            <p id="backup-data-text">Backup data</p>
          </button>

          <button id="view-inventory-card" onClick={handleViewInventory}>
            <img src={view_inventory_icon} alt="View Inventory" className="action-icon" />
            <p id="view-inventory-text">View inventory</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;