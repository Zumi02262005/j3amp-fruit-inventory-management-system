import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { logsAPI } from "../../services/api";
import "./admin-dashboard.css";
import notification_bell from "../../assets/icons/notification_bell.svg";
import profile_icon from "../../assets/icons/profile_icon.svg";
import generate_report_icon from "../../assets/icons/generate_report_icon.svg";
import manage_users_icon from "../../assets/icons/manage_users_icon.svg";
import backup_data_icon from "../../assets/icons/backup_icon.svg";
import view_inventory_icon from "../../assets/icons/view_inventory_icon.svg";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchTotalStock = async () => {
      try {
        const response = await inventoryAPI.getInventoryTotal();
        setTotalStock(response.data.data);
      } catch (err) {
        console.error("Failed to fetch total stock:", err);
        setTotalStock("N/A");
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await inventoryAPI.getInventoryCategories();
        setTotalCategories(response.data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setTotalCategories("N/A");
      }
    };

    const fetchExpiringBatches = async () => {
      try {
        const response = await inventoryAPI.getExpiringBatches();
        setExpiringCount(response.data.data);
      } catch (err) {
        console.error("Failed to fetch expiring batches:", err);
        setExpiringCount("N/A");
      }
    };
    
    const fetchRecentActivity = async () => {
      try {
        const response = await logsAPI.recentActivity();
        setRecentActivity(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve recent activity: ", err);
        setRecentActivity([]);
      }
    }

    fetchRecentActivity();
    fetchTotalStock();
    fetchCategories();
    fetchExpiringBatches();
  }, []);

  const handleViewInventory = () => {
    navigate("/inventory-home");
  };

  return (
    <div className="dashboard-container page-with-navbar">
      <div className="dashboard-header">
        <p className="dashboard-overview-label">Overview</p>
        <button className="notification-button">
          <img
            src={notification_bell}
            alt="Notifications"
            className="notification-icon"
          />
        </button>
        <button className="profile-button">
          <img src={profile_icon} alt="Profile" className="profile-icon" />
        </button>
      </div>

      <div className="dashboard-content">
        <div className="stock-overview">
          <div className="total-stock-section">
            <p className="total-stock">Total Stock</p>
            <p className="total-stock-amount">
              {totalStock !== null ? `${totalStock} kg` : "Loading..."}
            </p>
          </div>
          <div className="stock-subsection">
            <div className="categories-section">
              <p className="categories">Categories: </p>
              <p className="categories-count">
                {totalCategories !== null ? totalCategories : "..."}
              </p>
            </div>
            <div className="expiring-section">
              <p className="expiring">Expiring: </p>
              <p className="expiring-count">{expiringCount !== null ? expiringCount : "..."}</p>
            </div>
          </div>
        </div>

        <div className="welcome-section">
          <h2>Welcome, {user?.name || user?.email}!</h2>
          <p>
            Role: <strong>{user?.role}</strong>
          </p>
        </div>

        <div className="info-card">
          <h3>Phase 1 Complete!</h3>
          <p>Your authentication system is working!</p>
          <ul>
            <li>Login successful HAHAHAHHA WOOOOOOOOO</li>
          </ul>
        </div>

        <div className="recent-activity">
          <p>Recent Activity</p>
          <div className="recent-activity-list">
            {recentActivity.length === 0 ? (
              <p><strong>No recent activity</strong></p>
            ) : (
              recentActivity.map((activity) =>(
                <ul key={activity.log_id} className="recent-activity-content">
                  <li>
                    <span className="activity-action"><strong>{activity.action}</strong> -</span>
                    <span className="activity-user">{activity.user_id} - </span>
                    <span className="activity-details">{activity.details} -</span>
                    <span className="activity-date">{new Date(activity.log_date).toLocaleDateString()}</span>
                  </li>
                </ul>
              ))
            )}
          </div>
        </div>

        <div id="admin-quick-actions">
          <button id="generate-report-card">
            <img
              src={generate_report_icon}
              alt="Generate Report"
              className="action-icon"
            />
            <p id="generate-report-text">Generate report</p>
          </button>
          <button id="manage-users-card">
            <img
              src={manage_users_icon}
              alt="Manage Users"
              className="action-icon"
            />
            <p id="manage-users-text">Manage users</p>
          </button>
          <button id="backup-data-card">
            <img
              src={backup_data_icon}
              alt="Backup Data"
              className="action-icon"
            />
            <p id="backup-data-text">Backup data</p>
          </button>
          <button id="view-inventory-card" onClick={handleViewInventory}>
            <img
              src={view_inventory_icon}
              alt="View Inventory"
              className="action-icon"
            />
            <p id="view-inventory-text">View inventory</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
