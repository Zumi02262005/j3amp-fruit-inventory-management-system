import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { logsAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./outbound-dashboard.css";
import profile_icon from "../../assets/icons/profile_icon.svg";
import dispatch_icon from "../../assets/icons/dispatch_icon.svg";

const OutboundDashboard = () => {
  const navigate = useNavigate();
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [recentDispatches, setRecentDispatches] = useState([]);

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
    const fetchRecentDispatches = async () => {
      try {
        const response = await logsAPI.recentDispatches();
        setRecentDispatches(response.data.data);
      } catch (err) {
        console.error("Failed to fetch recent dispatches: ", err);
        setRecentDispatches([]);
      }
    };
    fetchCategories();
    fetchTotalStock();
    fetchExpiringBatches();
    fetchRecentDispatches();
  }, []);

  const handleDispatchStock = () => navigate("/dispatch-stock");

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

        <div id="outbound-quick-actions">
          <button id="dispatch-stock-button" onClick={handleDispatchStock}>
            <img src={dispatch_icon} alt="Dispatch Stock" className="dispatch-icon" />
            <p id="dispatch-icon-text">Dispatch Stock</p>
          </button>
        </div>

        <div className="recent-dispatches">
          <p>Recent Dispatches</p>
          <ul className="recent-dispatches-list">
            {recentDispatches.length === 0 ? (
              <p><strong>No recent dispatches</strong></p>
            ) : (
              recentDispatches.map((dispatch) => (
                <li key={dispatch.log_id} className="recent-dispatches-content">
                  <span className="receipt-action"><strong>{dispatch.action}</strong> - </span>
                  <span className="receipt-details">
                    <strong>{dispatch.details}</strong> -{" "}
                  </span>
                  <span className="receipt-date">
                    {new Date(dispatch.log_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {" "}
                  <span className="receipt-time">
                    {new Date(dispatch.log_date).toLocaleTimeString("en-PH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OutboundDashboard;