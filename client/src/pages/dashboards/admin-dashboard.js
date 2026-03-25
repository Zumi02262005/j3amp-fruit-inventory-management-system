// admin-dashboard.jsx
// This page displays the dashboard for the admin user
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI, logsAPI, boAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./admin-dashboard.css";

// Icons
import profile_icon from "../../assets/icons/profile_icon.svg";
import generate_report_icon from "../../assets/icons/generate_report_icon.svg";
import manage_users_icon from "../../assets/icons/manage_users_icon.svg";
import backup_data_icon from "../../assets/icons/backup_icon.svg";
import view_inventory_icon from "../../assets/icons/view_inventory_icon.svg";

// --- Helpers & Hooks ---
const fmtDate = (d) => new Date(d).toLocaleDateString();

const useRipple = () => {
  return useCallback((e) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }, []);
};

// --- Configurations ---
const ADMIN_ACTIONS = [
  { id: "generate-report-card", textId: "generate-report-text", path: "/reports", icon: generate_report_icon, label: "Generate report" },
  { id: "manage-users-card", textId: "manage-users-text", path: "/users", icon: manage_users_icon, label: "Manage users" },
  { id: "logs-card", textId: "logs-text", path: "/admin-logs", icon: backup_data_icon, label: "Logs" },
  { id: "view-inventory-card", textId: "view-inventory-text", path: "/inventory-home", icon: view_inventory_icon, label: "View inventory" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();

  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingBOCount, setPendingBOCount] = useState(0);

  useEffect(() => {
    // Fire all independent requests concurrently to speed up initial render
    inventoryAPI.getInventoryTotal()
      .then((res) => setTotalStock(res.data.data))
      .catch(() => setTotalStock("N/A"));

    inventoryAPI.getInventoryCategories()
      .then((res) => setTotalCategories(res.data.data))
      .catch(() => setTotalCategories("N/A"));

    inventoryAPI.getExpiringBatches()
      .then((res) => setExpiringCount(res.data.data))
      .catch(() => setExpiringCount("N/A"));

    logsAPI.recentActivity()
      .then((res) => setRecentActivity(res.data.data))
      .catch(() => setRecentActivity([]));

    boAPI.getPendingCount()
      .then((res) => setPendingBOCount(res.data.data))
      .catch(() => setPendingBOCount(0));
  }, []);

  return (
    <div className="dashboard-container page-with-navbar">
      <div className="dashboard-header">
        <p className="dashboard-overview-label">Overview</p>

        {/* Requests button with pending badge */}
        <button className="requests-button" onClick={() => navigate("/bo-requests")}>
          Requests
          {pendingBOCount > 0 && <span className="requests-badge">{pendingBOCount}</span>}
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
              <p className="categories-count">{totalCategories !== null ? totalCategories : "..."}</p>
            </div>
            <div className="expiring-section">
              <p className="expiring">Expiring: </p>
              <p className="expiring-count">{expiringCount !== null ? expiringCount : "..."}</p>
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
                    <span className="activity-date">{fmtDate(activity.log_date)}</span>
                  </li>
                </ul>
              ))
            )}
          </div>
        </div>

        <div id="admin-quick-actions">
          {ADMIN_ACTIONS.map(({ id, textId, path, icon, label }) => (
            <button key={id} id={id} onClick={(e) => { createRipple(e); navigate(path); }}>
              <img src={icon} alt={label} className="action-icon" />
              <p id={textId}>{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;