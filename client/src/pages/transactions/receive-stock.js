// receive-stock.jsx
// This page handles the receive stock functionality.

import React, { useState, useEffect, useCallback } from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./receive-stock.css";

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

const ReceiveStock = () => {
  // Main form data state
  const [formData, setFormData] = useState({ sku: "", quantity: "", expiration_date: "", supplier_name: "" });
  
  // Data, loading, and UI states
  const [skuList, setSkuList] = useState([]);
  const [skuLoading, setSkuLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const createRipple = useRipple();

  // Fetch SKUs on initial mount
  useEffect(() => {
    inventoryAPI.getSkuDropdown()
      .then(res => setSkuList(res.data.data))
      .catch(err => {
        console.error("Failed to load SKU list:", err);
        setStatus({ type: "error", msg: "Failed to load SKU list." });
      })
      .finally(() => setSkuLoading(false));
  }, []);

  // Handle outside clicks to close the custom dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatters and status calculators for SKUs
  const getSkuColor = (item) => item.is_low_stock && item.is_expiring_soon ? "#a855f7" : item.is_expiring_soon ? "#ef4444" : item.is_low_stock ? "#f97316" : "inherit";
  const getSkuLabel = (item) => `${item.sku} — ${item.product_name}`;

  // Form handlers
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Updating inventory..." });
    try {
      const response = await transactionAPI.receiveStock(formData);
      if (response.data.success) {
        setStatus({ type: "success", msg: `Successfully received ${formData.quantity}kg for ${formData.sku}` });
        setFormData({ sku: "", quantity: "", expiration_date: "", supplier_name: "" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to receive stock. Check SKU." });
    }
  };

  // Derived selected item based on current form data
  const selectedItem = skuList.find(i => i.sku === formData.sku);

  return (
    <div className="receive-stock-container page-with-navbar">
      <div className="receive-stock-header">
        <p className="receive-stock-label">Receive</p>
      </div>
      
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="receive-stock-form">
          {status.msg && <div className={`status-message ${status.type}`}>{status.msg}</div>}

          {/* SKU Custom Dropdown */}
          <div className="form-input-group custom-dropdown">
            <label>SKU</label>
            {skuLoading ? (
              <div className="sku-dropdown-selected disabled">Loading SKUs...</div>
            ) : (
              <>
                {/* Hidden input to enforce native HTML validation for required field */}
                <input type="text" name="sku" value={formData.sku} required readOnly style={{ display: "none" }} />
                
                <div
                  className={`sku-dropdown-selected ${dropdownOpen ? "open" : ""}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ color: selectedItem ? getSkuColor(selectedItem) : "#999" }}
                >
                  {selectedItem ? getSkuLabel(selectedItem) : "Select a SKU"}
                  <span className="sku-dropdown-arrow">▾</span>
                </div>
                
                {dropdownOpen && (
                  <div className="sku-dropdown-list">
                    {skuList.map((item) => (
                      <div
                        key={item.sku}
                        className="sku-dropdown-item"
                        style={{ color: getSkuColor(item) }}
                        onClick={() => {
                          setFormData({ ...formData, sku: item.sku });
                          setDropdownOpen(false);
                        }}
                      >
                        {getSkuLabel(item)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* SKU Legend */}
            <div className="sku-legend" style={{ marginTop: '-10px', marginBottom: '15px' }}>
              <span className="legend-item legend-low-stock">● Low Stock</span>
              <span className="legend-item legend-expiring">● Expiring Soon</span>
              <span className="legend-item legend-critical">● Both</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-input-group">
            <label>Quantity (kg)</label>
            <input type="number" name="quantity" placeholder="0.00" step="0.01" value={formData.quantity} onChange={handleChange} required />
          </div>

          {/* Expiration Date Input */}
          <div className="form-input-group">
            <label>Expiration Date</label>
            <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} required />
          </div>

          {/* Supplier Input */}
          <div className="form-input-group">
            <label>Supplier</label>
            <input type="text" name="supplier_name" placeholder="Supplier name" value={formData.supplier_name} onChange={handleChange} />
          </div>

          <button type="submit" className="receive-button" onClick={createRipple}>
            Receive
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReceiveStock;