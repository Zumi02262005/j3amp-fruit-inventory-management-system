import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import "./UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, logsRes] = await Promise.all([
          userAPI.getUserById(id),
          userAPI.getUserActivityLogs(id),
        ]);
        setProfile(profileRes.data.data);

        // Filter to only receive/dispatch actions and take latest 3
        const allLogs = logsRes.data.data;
        const transactionLogs = allLogs.filter(
          (log) => log.action === "RECEIVE STOCK" || log.action === "DISPATCH STOCK"
        );
        setRecentActivity(transactionLogs.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleViewFullHistory = async () => {
    if (fullHistory.length > 0) {
      setShowFullHistory(true);
      return;
    }
    setHistoryLoading(true);
    try {
      const response = await userAPI.getUserActivityLogs(id);
      const allLogs = response.data.data;
      const transactionLogs = allLogs.filter(
        (log) => log.action === "RECEIVE STOCK" || log.action === "DISPATCH STOCK"
      );
      setFullHistory(transactionLogs);
      setShowFullHistory(true);
    } catch (err) {
      console.error("Failed to fetch full history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " " + new Date(date).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return <div className="loader">Loading user details...</div>;
  if (!profile) return <div className="error-bar">User not found</div>;

  return (
    <div className="user-details-container page-with-navbar">
      {/* Header */}
      <div className="user-details-header">
        <span className="user-details-back" onClick={() => navigate("/users")}>
          ← Back to Users
        </span>
        <p className="user-details-title">Users</p>
      </div>

      <div className="user-details-content">

        {/* User Profile Card */}
        <div className="user-profile-card">
          <p className="user-profile-card-label">User Profile</p>
          <ul className="user-profile-list">
            <li><strong>{profile.full_name}</strong></li>
            <li>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</li>
            <li>@{profile.username}</li>
            <li>ID: {profile.user_id}</li>
            <li>Email: {profile.email}</li>
            {profile.phone && <li>Phone: {profile.phone}</li>}
            <li>Created: {new Date(profile.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</li>
            <li>Last Login: {profile.last_login ? new Date(profile.last_login).toLocaleString() : "Never"}</li>
          </ul>
        </div>

        {/* Recent Activity Card */}
        <div className="user-activity-card">
          <p className="user-activity-label">Recent Activity</p>
          {recentActivity.length === 0 ? (
            <p className="user-activity-empty">No recent activity</p>
          ) : (
            <div className="user-activity-list">
              {recentActivity.map((log) => (
                <div className="user-activity-item" key={log.log_id}>
                  <p className="user-activity-action">{log.action}</p>
                  <p className="user-activity-details">{log.details}</p>
                  <p className="user-activity-date">{formatDate(log.log_date)}</p>
                </div>
              ))}
            </div>
          )}
          {recentActivity.length > 0 && (
            <div className="user-activity-footer">
              <span
                className="view-full-history-link"
                onClick={handleViewFullHistory}
              >
                {historyLoading ? "Loading..." : "View Full History →"}
              </span>
            </div>
          )}
        </div>

        {/* Full History */}
        {showFullHistory && (
          <div className="user-activity-card">
            <div className="user-activity-card-header">
              <p className="user-activity-label">Full History</p>
              <button className="user-history-close" onClick={() => setShowFullHistory(false)}>✕</button>
            </div>
            {fullHistory.length === 0 ? (
              <p className="user-activity-empty">No transaction history</p>
            ) : (
              <div className="user-activity-list">
                {fullHistory.map((log) => (
                  <div className="user-activity-item" key={log.log_id}>
                    <p className="user-activity-action">{log.action}</p>
                    <p className="user-activity-details">{log.details}</p>
                    <p className="user-activity-date">{formatDate(log.log_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDetails;