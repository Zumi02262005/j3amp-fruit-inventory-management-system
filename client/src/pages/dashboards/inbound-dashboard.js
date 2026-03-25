// inbound-dashboard.jsx
// This page displays the dashboard for the inbound user
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI, logsAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./inbound-dashboard.css";
import profile_icon from "../../assets/icons/profile_icon.svg";
import receive_icon from "../../assets/icons/receive_icon.svg";

// --- Helpers & Hooks ---
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

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

const InboundDashboard = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();

  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [stockAlerts, setStockAlerts] = useState(null);
  const [recentReceipts, setRecentReceipts] = useState([]);

  useEffect(() => {
    // Fire independent requests concurrently to speed up initial render
    inventoryAPI.getInventoryTotal()
      .then((res) => setTotalStock(res.data.data))
      .catch((err) => { console.error("Failed to fetch total stock:", err); setTotalStock("N/A"); });

    inventoryAPI.getInventoryCategories()
      .then((res) => setTotalCategories(res.data.data))
      .catch((err) => { console.error("Failed to fetch categories:", err); setTotalCategories("N/A"); });

    // Combine low stock + no stock into one count concurrently
    Promise.all([inventoryAPI.getLowStockQuantity(), inventoryAPI.getNoStockCount()])
      .then(([lowRes, noRes]) => {
        const combined = (lowRes.data.data || 0) + (noRes.data.data || 0);
        setStockAlerts(combined);
      })
      .catch((err) => { console.error("Failed to fetch stock alerts:", err); setStockAlerts(0); });

    logsAPI.recentReceipts()
      .then((res) => setRecentReceipts(res.data.data))
      .catch((err) => { console.error("Failed to fetch recent receipts: ", err); setRecentReceipts([]); });
  }, []);

  return (
    <div className="dashboard-container page-with-navbar">
      <div className="dashboard-header">
        <p className="dashboard-overview-label">Overview</p>
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
            <div className="categories-section">
              <p className="categories">Low/No Stock: </p>
              <p className="categories-count">{stockAlerts !== null ? stockAlerts : "..."}</p>
            </div>
          </div>
        </div>

        <div id="inbound-quick-actions">
          <button
            id="receive-stock-button"
            onClick={(e) => { createRipple(e); navigate("/receive-stock"); }}
          >
            <img src={receive_icon} alt="Receive Stock" className="receive-icon" />
            <p id="receive-icon-text">Receive Stock</p>
          </button>
        </div>

        <div className="recent-receipts">
          <p>Recent Receipts</p>
          <ul className="recent-receipts-list">
            {recentReceipts.length === 0 ? (
              <p style={{ color: "#000", fontSize: "0.9rem" }}>No recent receipts</p>
            ) : (
              recentReceipts.map((receipt) => (
                <li key={receipt.log_id} className="recent-receipts-content">
                  <span className="receipt-action"><strong>{receipt.action}</strong> - </span>
                  <span className="receipt-details"><strong>{receipt.details}</strong> - </span>
                  <span className="receipt-date">{fmtDate(receipt.log_date)}</span>{" "}
                  <span className="receipt-time">{fmtTime(receipt.log_date)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InboundDashboard;