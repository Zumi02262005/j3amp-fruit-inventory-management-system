// inventory-home.jsx
// This page displays the whole inventory (all the SKUs) and the admin-exclusive function of adding a new item
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./inventory-home.css";
import addSKUIcon from "../../assets/icons/generate_report_icon.svg";

// Hook to create a material-style ripple effect on buttons
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

// Formatting helpers to keep JSX clean
const fmt = (val) => parseFloat(val || 0).toFixed(2);
const fmtDate = (d) => new Date(d).toLocaleDateString();

// Configuration for the Add SKU Form
const SKU_FORM_FIELDS = [
  { name: "sku", label: "SKU", type: "text" },
  { name: "product_name", label: "Product Name", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "supplier", label: "Supplier", type: "text" },
  { name: "reorder_point", label: "Reorder Point (kg)", type: "number", step: "0.01", min: "0" },
];

const InventoryHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createRipple = useRipple();

  // Data State
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  
  // Dashboard Metrics State
  const [metrics, setMetrics] = useState({ totalStock: undefined, totalCategories: null, stockAlerts: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showAddSku, setShowAddSku] = useState(false);
  const [skuForm, setSkuForm] = useState({ sku: "", product_name: "", category: "", supplier: "", reorder_point: "50" });
  const [skuStatus, setSkuStatus] = useState({ type: "", msg: "" });

  const fetchAll = async () => {
    try {
      const [invRes, lowRes, expRes, expiredRes, totalRes, catRes, lowQtyRes, noStockRes] = await Promise.all([
        inventoryAPI.getInventory(),
        inventoryAPI.getLowStockItems(),
        inventoryAPI.getExpiringItems(),
        inventoryAPI.getExpiredItems(),
        inventoryAPI.getInventoryTotal(),
        inventoryAPI.getInventoryCategories(),
        inventoryAPI.getLowStockQuantity(),
        inventoryAPI.getNoStockCount(),
      ]);

      if (invRes.data.success) setItems(invRes.data.data);
      if (lowRes.data.success) setLowStockItems(lowRes.data.data);
      if (expRes.data.success) setExpiringItems(expRes.data.data);
      if (expiredRes.data.success) setExpiredItems(expiredRes.data.data);
      
      setMetrics({
        totalStock: totalRes.data.data,
        totalCategories: catRes.data.data,
        stockAlerts: (lowQtyRes.data.data || 0) + (noStockRes.data.data || 0)
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showAddSku ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showAddSku]);

  const handleSkuSubmit = async (e) => {
    e.preventDefault();
    setSkuStatus({ type: "loading", msg: "Creating SKU..." });
    try {
      await inventoryAPI.createSku(skuForm);
      setSkuStatus({ type: "success", msg: "SKU created successfully!" });
      setSkuForm({ sku: "", product_name: "", category: "", supplier: "", reorder_point: "50" });
      setShowAddSku(false);
      fetchAll();
    } catch (err) {
      setSkuStatus({ type: "error", msg: err.response?.data?.message || "Failed to create SKU." });
    }
  };

  if (loading) return <div className="loader">Loading inventory...</div>;
  if (error) return <div className="error-bar">{error}</div>;

  return (
    <div className="inventory-home-container page-with-navbar">
      <div className="inventory-home-header">
        <p className="inventory-home-label">Inventory</p>
      </div>

      <div className="inventory-content">
        {/* Stock Overview */}
        <div className="stock-overview">
          <div className="total-stock-section">
            <p className="total-stock">Total Stock</p>
            <p className="total-stock-amount">
              {metrics.totalStock === undefined ? "Loading..." : `${metrics.totalStock} kg`}
            </p>
          </div>
          <div className="stock-subsection">
            <div className="categories-section">
              <p className="categories">Categories: </p>
              <p className="categories-count">{metrics.totalCategories ?? "..."}</p>
            </div>
            <div className="expiring-section">
              <p className="expiring">Low/No Stock: </p>
              <p className="expiring-count">{metrics.stockAlerts ?? "..."}</p>
            </div>
          </div>
        </div>

        {/* Add SKU — admin only */}
        {user?.role === "admin" && (
          <div className="add-sku-actions">
            <button className="add-sku-card" onClick={(e) => { createRipple(e); setShowAddSku(true); }}>
              <img src={addSKUIcon} alt="Add SKU" className="action-icon" />
              <p className="add-sku-card-text">Add SKU</p>
            </button>
          </div>
        )}

        {/* Low Stock */}
        <div className="low-stock">
          <p className="low-stock-label">Low Stock</p>
          <div className="low-stock-list">
            {lowStockItems.length === 0 ? (
              <div className="low-stock-card"><p><strong>No low stock items</strong></p></div>
            ) : (
              lowStockItems.map((item) => (
                <div className="low-stock-card" key={item.sku}>
                  <p className="low-stock-sku">{item.sku}</p>
                  <ul className="low-stock-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Total Stock: {fmt(item.total_stock)} kg</li>
                    <li>Reorder Point: {fmt(item.reorder_point)} kg</li>
                  </ul>
                  <div className="view-details-container">
                    <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>View Details &rarr;</span>
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
            {expiringItems.length === 0 ? (
              <div className="expiring-card"><p><strong>No expiring items</strong></p></div>
            ) : (
              expiringItems.map((item) => (
                <div className="expiring-card" key={item.batch_id}>
                  <p className="expiring-sku">{item.sku}</p>
                  <ul className="expiring-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Batch: {item.batch_id}</li>
                    <li>Expires: {fmtDate(item.expiration_date)}</li>
                  </ul>
                  <div className="view-details-container">
                    <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>View Details &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expired */}
        <div className="expired-items">
          <p className="expired-label">Expired</p>
          <div className="expired-list">
            {expiredItems.length === 0 ? (
              <div className="expired-card"><p><strong>No expired batches</strong></p></div>
            ) : (
              expiredItems.map((item) => (
                <div className="expired-card" key={item.batch_id}>
                  <p className="expired-sku">{item.sku}</p>
                  <ul className="expired-details">
                    <li><strong>{item.product_name}</strong></li>
                    <li>Batch: {item.batch_id}</li>
                    <li>Expired: {fmtDate(item.expiration_date)}</li>
                  </ul>
                  <div className="view-details-container">
                    <span className="view-details-link expired-view-link" onClick={() => navigate(`/inventory/${item.sku}`)}>View Details &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* All Products */}
        <div className="all-products">
          <p className="all-products-label">All Products</p>
          <div className="product-list">
            {items.map((item) => (
              <div className="product-card" key={item.sku}>
                <p className="product-sku">{item.sku}</p>
                <ul className="product-details">
                  <li><strong>{item.product_name}</strong></li>
                  <li>Total: {fmt(item.total_stock)} kg</li>
                </ul>
                <div className="view-details-container">
                  <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>View Details &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add SKU Modal */}
      {showAddSku && (
        <div className="modal-overlay" onClick={() => setShowAddSku(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Add New SKU</h3>
              <button className="inv-modal-close" onClick={() => setShowAddSku(false)}>✕</button>
            </div>
            
            {skuStatus.msg && <div className={`inv-modal-status ${skuStatus.type}`}>{skuStatus.msg}</div>}
            
            <form onSubmit={handleSkuSubmit} className="inv-modal-form">
              {SKU_FORM_FIELDS.map(({ name, label, type, step, min }) => (
                <div className="inv-modal-input-group" key={name}>
                  <label>{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={skuForm[name]}
                    onChange={(e) => setSkuForm({ ...skuForm, [name]: e.target.value })}
                    step={step}
                    min={min}
                    required
                  />
                </div>
              ))}
              <button type="submit" className="inv-modal-submit-btn" onClick={createRipple}>
                Create SKU
              </button>
            </form>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHome;