import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import NotificationPanel from "../../components/NotificationPanel";
import "./outbound-dashboard.css";
import profile_icon from "../../assets/icons/profile_icon.svg";

const OutboundDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);

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
    fetchTotalStock();

    const fetchCategories = async () => {
      try {
        const response = await inventoryAPI.getInventoryCategories();
        setTotalCategories(response.data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setTotalCategories("N/A");
      }
    };
    fetchCategories();

    const fetchExpiringBatches = async () => {
      try {
        const response = await inventoryAPI.getExpiringBatches();
        setExpiringCount(response.data.data);
      } catch (err) {
        console.error("Failed to fetch expiring batches:", err);
        setExpiringCount("N/A");
      }
    };
    fetchExpiringBatches();
  }, []);

  const handleViewInventory = () => navigate("/inventory-home");
  const handleLogout = () => { logout(); navigate("/login"); };

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
      </div>
    </div>
  );
};

export default OutboundDashboard;