// outbound-logs.jsx
// This page displays the activity logs of the inbound user
import React, { useState, useEffect } from "react";
import { logsAPI } from "../../services/api";
import "./inbound-logs.css";

// --- Formatting & Parsing Helpers ---
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

// Parses "Received X units of Y (Batch Z) from Supplier" into parts
const parseReceiptDetails = (details) => {
  const match = details.match(/^(Received .+? \(Batch \d+\)) from (.+)$/);
  if (match) return { main: match[1], supplier: match[2] };
  return { main: details, supplier: null };
};

const InboundLogs = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await logsAPI.recentReceipts();
        setReceipts(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve receipts: ", err);
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  if (loading) return <div className="loader">Loading logs...</div>;

  return (
    <div className="logs-home-container page-with-navbar">
      <p className="logs-home-label">Logs</p>
      
      <div className="logs-content">
        <div className="recent-activity-admin">
          <p className="recent-activity-label">My Receipts</p>
          
          <div className="log-list">
            {receipts.length === 0 ? (
              <div className="log-card">
                <p><strong>No receipts found</strong></p>
              </div>
            ) : (
              receipts.map((receipt) => {
                const { main, supplier } = parseReceiptDetails(receipt.details);
                return (
                  <div className="log-card" key={receipt.log_id}>
                    <p className="log-action">RECEIVE</p>
                    <ul className="log-details">
                      <li>{main}</li>
                      {supplier && <li>Supplier: {supplier}</li>}
                      <li>{fmtDate(receipt.log_date)} {fmtTime(receipt.log_date)}</li>
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

export default InboundLogs;