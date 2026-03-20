import React, { useState, useEffect } from "react";
import { logsAPI } from "../../services/api";
import "./admin-logs.css";

const LogCard = ({ activity }) => {
  return (
    <div className="log-card">
      <p className="log-action">{activity.action}</p>
      <ul className="log-details">
        <li><strong>{activity.log_id}</strong></li>
        <li>{activity.details}</li>
        <li>{new Date(activity.log_date).toLocaleDateString()}</li>
      </ul>
    </div>
  );
};

const AdminLogs = () => {
  const [allActivities, setAllActivities] = useState([]);

  useEffect(() => {
    const fetchAllActivities = async () => {
      try {
        const response = await logsAPI.allActivities();
        setAllActivities(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve recent activity: ", err);
        setAllActivities([]);
      }
    };

    fetchAllActivities();
  }, []);

  return (
    <div className="logs-home-container page-with-navbar">
      <p className="logs-home-label">Logs</p>
      <div className="logs-content">

        {/* Recent Activity */}
        <div className="recent-activity-admin">
          <p className="recent-activity-label">Recent Activity</p>
          <div className="log-list">
            {allActivities.length === 0 ? (
              <div className="log-card">
                <p><strong>No recent activity</strong></p>
              </div>
            ) : (
              allActivities.map((activity) => (
                <LogCard key={activity.log_id} activity={activity} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogs;