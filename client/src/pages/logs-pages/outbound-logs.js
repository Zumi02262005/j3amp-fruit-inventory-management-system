// outbound-logs.jsx
// This page displays the activity logs of the outbound user
import React, { useState, useEffect } from "react";
import { logsAPI } from "../../services/api";
import "./outbound-logs.css";

// --- Formatting & Parsing Helpers ---
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

const parseDispatchDetails = (details) => {
  const match = details.match(/^(Dispatched .+? \(Batch \d+\)) to (.+)$/);
  if (match) return { main: match[1], client: match[2] };
  return { main: details, client: null };
};

const OutboundLogs = () => {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatches = async () => {
      try {
        const response = await logsAPI.recentDispatches();
        setDispatches(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve dispatches: ", err);
        setDispatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDispatches();
  }, []);

  if (loading) return <div className="loader">Loading logs...</div>;

  return (
    <div className="logs-home-container page-with-navbar">
      <p className="logs-home-label">Logs</p>
      
      <div className="logs-content">
        <div className="recent-activity-admin">
          <p className="recent-activity-label">My Dispatches</p>
          
          <div className="log-list">
            {dispatches.length === 0 ? (
              <div className="log-card">
                <p><strong>No dispatches found</strong></p>
              </div>
            ) : (
              dispatches.map((dispatch) => {
                const { main, client } = parseDispatchDetails(dispatch.details);
                return (
                  <div className="log-card" key={dispatch.log_id}>
                    <p className="log-action">DISPATCH</p>
                    <ul className="log-details">
                      <li>{main}</li>
                      {client && <li>Client: {client}</li>}
                      <li>{fmtDate(dispatch.log_date)} {fmtTime(dispatch.log_date)}</li>
                    </ul>
                  </div>
                );
              })
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default OutboundLogs;