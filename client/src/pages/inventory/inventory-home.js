import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [low_stock_items, setLowStockItems] = useState([]);
  const [expiring_items, setExpiringItems] = useState([]);
  const [expired_items, setExpiredItems] = useState([]);
  const [totalStock, setTotalStock] = useState(null);
  const [totalCategories, setTotalCategories] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);

  // Add SKU modal state
  const [showAddSku, setShowAddSku] = useState(false);
  const [skuForm, setSkuForm] = useState({
    sku: "",
    product_name: "",
    category: "",
    supplier: "",
    reorder_point: "50",
  });
  const [skuStatus, setSkuStatus] = useState({ type: "", msg: "" });

  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [invRes, lowRes, expRes, expiredRes, totalRes, catRes, expCountRes] = await Promise.all([
        inventoryAPI.getInventory(),
        inventoryAPI.getLowStockItems(),
        inventoryAPI.getExpiringItems(),
        inventoryAPI.getExpiredItems(),
        inventoryAPI.getInventoryTotal(),
        inventoryAPI.getInventoryCategories(),
        inventoryAPI.getExpiringBatches(),
      ]);
      if (invRes.data.success) setItems(invRes.data.data);
      if (lowRes.data.success) setLowStockItems(lowRes.data.data);
      if (expRes.data.success) setExpiringItems(expRes.data.data);
      if (expiredRes.data.success) setExpiredItems(expiredRes.data.data);
      setTotalStock(totalRes.data.data);
      setTotalCategories(catRes.data.data);
      setExpiringCount(expCountRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSkuFormChange = (e) => {
    setSkuForm({ ...skuForm, [e.target.name]: e.target.value });
  };

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
        {user?.role === "admin" && (
          <button className="add-sku-btn" onClick={() => setShowAddSku(true)}>
            + Add SKU
          </button>
        )}
      </div>

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
                    <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>
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
                    <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>
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
                    <span className="view-details-link" onClick={() => navigate(`/inventory/${item.sku}`)}>
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
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
            {skuStatus.msg && (
              <div className={`inv-modal-status ${skuStatus.type}`}>{skuStatus.msg}</div>
            )}
            <form onSubmit={handleSkuSubmit} className="inv-modal-form">
              <div className="inv-modal-input-group">
                <label>SKU</label>
                <input type="text" name="sku" value={skuForm.sku} onChange={handleSkuFormChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Product Name</label>
                <input type="text" name="product_name" value={skuForm.product_name} onChange={handleSkuFormChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Category</label>
                <input type="text" name="category" value={skuForm.category} onChange={handleSkuFormChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Supplier</label>
                <input type="text" name="supplier" value={skuForm.supplier} onChange={handleSkuFormChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Reorder Point (kg)</label>
                <input type="number" name="reorder_point" value={skuForm.reorder_point} onChange={handleSkuFormChange} step="0.01" min="0" required />
              </div>
              <button type="submit" className="inv-modal-submit-btn">Create SKU</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryHome;