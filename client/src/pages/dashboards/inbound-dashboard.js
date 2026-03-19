import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { logsAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./inbound-dashboard.css";
import profile_icon from "../../assets/icons/profile_icon.svg";
import receive_icon from "../../assets/icons/receive_icon.svg";

const InboundDashboard = () => {
  const navigate = useNavigate();
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [lowStockCount, setLowStockCount] = useState(null);
  const [recentReceipts, setRecentReceipts] = useState([]);

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

    const fetchLowStock = async () => {
      try {
        const response = await inventoryAPI.getLowStockQuantity();
        setLowStockCount(response.data.data);
      } catch (err) {
        console.error("Failed to fetch low stock items:", err);
        setLowStockCount("N/A");
      }
    };

    const fetchRecentReceipts = async () => {
      try {
        const response = await logsAPI.recentReceipts();
        setRecentReceipts(response.data.data);
      } catch (err) {
        console.error("Failed to fetch recent receipts: ", err);
        setRecentReceipts([]);
      }
    };

    fetchTotalStock();
    fetchCategories();
    fetchLowStock();
    fetchRecentReceipts();
  }, []);

  const handleReceiveStock = () => navigate("/receive-stock");

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
              <p className="expiring">Low Stock: </p>
              <p className="expiring-count">
                {lowStockCount !== null ? lowStockCount : "..."}
              </p>
            </div>
          </div>
        </div>

        <div id="inbound-quick-actions">
          <button id="receive-stock-button" onClick={handleReceiveStock}>
            <img src={receive_icon} alt="Receive Stock" className="receive-icon" />
            <p id="receive-icon-text">Receive Stock</p>
          </button>
        </div>

        <div className="recent-receipts">
          <p>Recent Receipts</p>
          <ul className="recent-receipts-list">
            {recentReceipts.length === 0 ? (
              <p><strong>No recent receipts</strong></p>
            ) : (
              recentReceipts.map((receipt) => (
                <li key={receipt.log_id} className="recent-receipts-content">
                  <span className="receipt-action"><strong>{receipt.action}</strong> - </span>
                  <span className="receipt-details"><strong>{receipt.details}</strong> - </span>
                  <span className="receipt-date">
                    {new Date(receipt.log_date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {" "}
                  <span className="receipt-time">
                    {new Date(receipt.log_date).toLocaleTimeString("en-PH", {
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

export default InboundDashboard;