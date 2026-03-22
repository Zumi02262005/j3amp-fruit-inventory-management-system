import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI, logsAPI, boAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./admin-dashboard.css";
import profile_icon from "../../assets/icons/profile_icon.svg";
import generate_report_icon from "../../assets/icons/generate_report_icon.svg";
import manage_users_icon from "../../assets/icons/manage_users_icon.svg";
import backup_data_icon from "../../assets/icons/backup_icon.svg";
import view_inventory_icon from "../../assets/icons/view_inventory_icon.svg";

const useRipple = () => {
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }, []);
  return createRipple;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingBOCount, setPendingBOCount] = useState(0);

  const createRipple = useRipple();

  useEffect(() => {
    const fetchTotalStock = async () => {
      try {
        const response = await inventoryAPI.getInventoryTotal();
        setTotalStock(response.data.data);
      } catch (err) {
        setTotalStock("N/A");
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await inventoryAPI.getInventoryCategories();
        setTotalCategories(response.data.data);
      } catch (err) {
        setTotalCategories("N/A");
      }
    };

    const fetchExpiringBatches = async () => {
      try {
        const response = await inventoryAPI.getExpiringBatches();
        setExpiringCount(response.data.data);
      } catch (err) {
        setExpiringCount("N/A");
      }
    };

    const fetchRecentActivity = async () => {
      try {
        const response = await logsAPI.recentActivity();
        setRecentActivity(response.data.data);
      } catch (err) {
        setRecentActivity([]);
      }
    };

    const fetchPendingBO = async () => {
      try {
        const response = await boAPI.getPendingCount();
        setPendingBOCount(response.data.data);
      } catch (err) {
        setPendingBOCount(0);
      }
    };

    fetchRecentActivity();
    fetchTotalStock();
    fetchCategories();
    fetchExpiringBatches();
    fetchPendingBO();
  }, []);

  const handleViewInventory = () => navigate("/inventory-home");

  return (
    <div className="dashboard-container page-with-navbar">
      <div className="dashboard-header">
        <p className="dashboard-overview-label">Overview</p>

        {/* Requests button with pending badge */}
        <button
          className="requests-button"
          onClick={() => navigate("/bo-requests")}
        >
          Requests
          {pendingBOCount > 0 && (
            <span className="requests-badge">{pendingBOCount}</span>
          )}
        </button>

        <NotificationPanel />
        <button className="profile-button" onClick={() => navigate("/profile")}>
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
              <p className="expiring-count">
                {expiringCount !== null ? expiringCount : "..."}
              </p>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <p>Recent Activity</p>
          <div className="recent-activity-list">
            {recentActivity.length === 0 ? (
              <p><strong>No recent activity</strong></p>
            ) : (
              recentActivity.map((activity) => (
                <ul key={activity.log_id} className="recent-activity-content">
                  <li>
                    <span className="activity-action"><strong>{activity.action}</strong> - </span>
                    <span className="activity-user">{activity.username} - </span>
                    <span className="activity-details">{activity.details} - </span>
                    <span className="activity-date">{new Date(activity.log_date).toLocaleDateString()}</span>
                  </li>
                </ul>
              ))
            )}
          </div>
        </div>

        <div id="admin-quick-actions">
          <button id="generate-report-card" onClick={(e) => { createRipple(e); navigate("/reports"); }}>
            <img src={generate_report_icon} alt="Generate Report" className="action-icon" />
            <p id="generate-report-text">Generate report</p>
          </button>
          <button id="manage-users-card" onClick={(e) => { createRipple(e); navigate("/users"); }}>
            <img src={manage_users_icon} alt="Manage Users" className="action-icon" />
            <p id="manage-users-text">Manage users</p>
          </button>
          <button id="logs-card" onClick={(e) => { createRipple(e); navigate("/admin-logs"); }}>
            <img src={backup_data_icon} alt="Logs" className="action-icon" />
            <p id="logs-text">Logs</p>
          </button>
          <button id="view-inventory-card" onClick={(e) => { createRipple(e); handleViewInventory(); }}>
            <img src={view_inventory_icon} alt="View Inventory" className="action-icon" />
            <p id="view-inventory-text">View inventory</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;