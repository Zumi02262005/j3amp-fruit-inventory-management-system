import React, { useState, useEffect, useRef } from "react";
import { alertAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./NotificationPanel.css";
import notification_bell from "../assets/icons/notification_bell.svg";

const NotificationPanel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlertCount = async () => {
    try {
      const response = await alertAPI.getAlertCount();
      setAlertCount(response.data.data);
    } catch (err) {
      console.error("Failed to fetch alert count:", err);
    }
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertAPI.getActiveAlerts();
      setAlerts(response.data.data);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) fetchAlerts();
  };

  // Admin only — clears for everyone since alert record is shared
  const handleClearAlert = async (alertId) => {
    try {
      await alertAPI.clearAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
      setAlertCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to clear alert:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await alertAPI.clearAllAlerts();
      setAlerts([]);
      setAlertCount(0);
    } catch (err) {
      console.error("Failed to clear all alerts:", err);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "critical": return "alert-critical";
      case "high":     return "alert-high";
      case "medium":   return "alert-medium";
      default:         return "alert-low";
    }
  };

  const getAlertIcon = () => "!";

  return (
    <div className="notification-wrapper" ref={panelRef}>
      {/* Bell button with badge */}
      <button
        className={`notification-button ${isOpen ? "bell-active" : ""}`}
        onClick={handleBellClick}
        aria-expanded={isOpen}
        aria-label="Notifications"
      >
        <img
          src={notification_bell}
          alt="Notifications"
          className={`notification-icon ${isOpen ? "bell-ring" : ""}`}
        />
        {alertCount > 0 && (
          <span className="notification-badge">
            {alertCount > 99 ? "99+" : alertCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`notification-backdrop ${isOpen ? "backdrop-visible" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`notification-panel ${isOpen ? "panel-open" : "panel-closed"}`}
        aria-hidden={!isOpen}
      >
        <div className="notification-panel-header">
          <h3>Notifications</h3>
          {/* Clear all — admin only */}
          {isAdmin && alerts.length > 0 && (
            <button className="clear-all-btn" onClick={handleClearAll}>
              Clear all
            </button>
          )}
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="notification-loading">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="notification-empty">No active alerts 🎉</p>
          ) : (
            alerts.map((alert, index) => (
              <div
                key={alert.alert_id}
                className={`notification-item ${getPriorityClass(alert.priority)}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="notification-item-content">
                  <span className="notification-icon-type">
                    {getAlertIcon(alert.alert_type)}
                  </span>
                  <div className="notification-item-text">
                    <p className="notification-message">{alert.message}</p>
                    <p className="notification-time">
                      {new Date(alert.triggered_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {/* Clear button — admin only */}
                {isAdmin && (
                  <button
                    className="notification-clear-btn"
                    onClick={() => handleClearAlert(alert.alert_id)}
                    aria-label="Dismiss notification"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;