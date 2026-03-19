import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import "./inventory-home.css";

const ExpiredCard = ({ item, navigate }) => {
  return (
    <div className="expired-card">
      <p className="expired-sku">{item.sku}</p>
      <ul className="expired-details">
        <li><strong>{item.product_name}</strong></li>
        <li>Batch: {item.batch_id}</li>
        <li>Expired: {new Date(item.expiration_date).toLocaleDateString()}</li>
      </ul>
      <div className="view-details-container">
        <span
          className="view-details-link expired-view-link"
          onClick={() => navigate(`/inventory/${item.sku}`)}
        >
          View Details &rarr;
        </span>
      </div>
    </div>
  );
};

const InventoryHome = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [low_stock_items, setLowStockItems] = useState([]);
  const [expiring_items, setExpiringItems] = useState([]);
  const [expired_items, setExpiredItems] = useState([]);
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await inventoryAPI.getInventory();
        if (response.data.success) setItems(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    };

    const fetchLowStock = async () => {
      try {
        const response = await inventoryAPI.getLowStockItems();
        if (response.data.success) setLowStockItems(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load low stock items");
      }
    };

    const fetchExpiring = async () => {
      try {
        const response = await inventoryAPI.getExpiringItems();
        if (response.data.success) setExpiringItems(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load expiring items");
      }
    };

    const fetchExpired = async () => {
      try {
        const response = await inventoryAPI.getExpiredItems();
        if (response.data.success) setExpiredItems(response.data.data);
      } catch (err) {
        console.error("Failed to load expired items:", err);
      }
    };

    const fetchTotalStock = async () => {
      try {
        const response = await inventoryAPI.getInventoryTotal();
        setTotalStock(response.data.data);
      } catch (err) {
        setTotalStock("N/A");
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await inventoryAPI.getInventoryCategories();
        setTotalCategories(response.data.data);
      } catch (err) {
        setTotalCategories("N/A");
      }
    };

    const fetchExpiringBatches = async () => {
      try {
        const response = await inventoryAPI.getExpiringBatches();
        setExpiringCount(response.data.data);
      } catch (err) {
        setExpiringCount("N/A");
      }
    };

    fetchTotalStock();
    fetchExpiringBatches();
    fetchCategories();
    fetchExpiring();
    fetchLowStock();
    fetchExpired();
    fetchInventory();
  }, []);

  if (loading) return <div className="loader">Loading inventory...</div>;
  if (error) return <div className="error-bar">{error}</div>;

  return (
    <div className="inventory-home-container page-with-navbar">
      <p className="inventory-home-label">Inventory</p>
      <div className="inventory-content">

        {/* Stock Overview */}
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
              <p className="expiring-count">{expiringCount !== null ? expiringCount : "..."}</p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="low-stock">
          <p className="low-stock-label">Low Stock</p>
          <div className="low-stock-list">
            {low_stock_items.length === 0 ? (
              <div className="low-stock-card">
                <p><strong>No low stock items</strong></p>
              </div>
            ) : (
              low_stock_items.map((item) => (
                <div className="low-stock-card" key={item.sku}>
                  <p className="low-stock-sku">{item.sku}</p>
                  <ul className="low-stock-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Total Stock: {parseFloat(item.total_stock || 0).toFixed(2)} kg</li>
                    <li>Reorder Point: {parseFloat(item.reorder_point).toFixed(2)} kg</li>
                  </ul>
                  <div className="view-details-container">
                    <span
                      className="view-details-link"
                      onClick={() => navigate(`/inventory/${item.sku}`)}
                    >
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="expiring-items">
          <p className="expiring-label">Expiring Soon</p>
          <div className="expiring-list">
            {expiring_items.length === 0 ? (
              <div className="expiring-card">
                <p><strong>No expiring items</strong></p>
              </div>
            ) : (
              expiring_items.map((item) => (
                <div className="expiring-card" key={item.batch_id}>
                  <p className="expiring-sku">{item.sku}</p>
                  <ul className="expiring-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Batch: {item.batch_id}</li>
                    <li>Expires: {new Date(item.expiration_date).toLocaleDateString()}</li>
                  </ul>
                  <div className="view-details-container">
                    <span
                      className="view-details-link"
                      onClick={() => navigate(`/inventory/${item.sku}`)}
                    >
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expired */}
        {expired_items.length > 0 && (
          <div className="expired-items">
            <p className="expired-label">Expired</p>
            <div className="expired-list">
              {expired_items.map((item) => (
                <ExpiredCard key={item.batch_id} item={item} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div className="all-products">
          <p className="all-products-label">All Products</p>
          <div className="product-list">
            {items.map((item) => {
              const stock = parseFloat(item.total_stock || 0).toFixed(2);
              return (
                <div className="product-card" key={item.sku}>
                  <p className="product-sku">{item.sku}</p>
                  <ul className="product-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Total: {stock} kg</li>
                  </ul>
                  <div className="view-details-container">
                    <span
                      className="view-details-link"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/inventory/${item.sku}`)}
                    >
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryHome;