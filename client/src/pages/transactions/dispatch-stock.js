// dispatch-stock.jsx
// This page handles the dispatch stock functionality.
import React, { useState, useEffect, useCallback } from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./dispatch-stock.css";

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

const DispatchStock = () => {
  // Main form data state
  const [formData, setFormData] = useState({ sku: "", batch_id: "", client_name: "", quantity: "" });
  
  // Data and loading states for dropdowns
  const [skuList, setSkuList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [skuLoading, setSkuLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  
  // UI states for dropdowns and notifications
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [dropdowns, setDropdowns] = useState({ sku: false, batch: false });

  const createRipple = useRipple();

  // Fetch SKUs on initial mount
  useEffect(() => {
    inventoryAPI.getSkuDropdownDispatch()
      .then(res => setSkuList(res.data.data))
      .catch(err => console.error("Failed to load SKU list:", err))
      .finally(() => setSkuLoading(false));
  }, []);

  // Fetch batches dynamically whenever the selected SKU changes
  useEffect(() => {
    if (!formData.sku) {
      setBatchList([]);
      setFormData(prev => ({ ...prev, batch_id: "" }));
      return;
    }
    
    setBatchLoading(true);
    inventoryAPI.getBatches(formData.sku)
      .then(res => setBatchList(res.data.data))
      .catch(err => {
        console.error("Failed to load batches:", err);
        setBatchList([]);
      })
      .finally(() => setBatchLoading(false));
  }, [formData.sku]);

  // Handle outside clicks to close active custom dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        setDropdowns({ sku: false, batch: false });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatters and status calculators for SKUs
  const getSkuColor = (item) => item.is_low_stock && item.is_expiring_soon ? "#a855f7" : item.is_expiring_soon ? "#ef4444" : item.is_low_stock ? "#f97316" : "inherit";
  const getSkuLabel = (item) => {
    const warnings = [item.is_low_stock && "Low Stock", item.is_expiring_soon && "Expiring Soon"].filter(Boolean);
    const suffix = warnings.length ? ` — ⚠ ${warnings.join(", ")}` : "";
    return `${item.sku} — ${item.product_name} (${item.total_stock} kg)${suffix}`;
  };

  // Formatters and status calculators for Batches (86400000 ms = 1 day)
  const getBatchColor = (batch) => ((new Date(batch.expiration_date) - new Date()) / 86400000) <= 7 ? "#ef4444" : "inherit";
  const getBatchLabel = (batch) => `Batch #${batch.batch_id} — ${batch.remaining_quantity} kg — Expires: ${new Date(batch.expiration_date).toLocaleDateString()}`;

  // Form handlers
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Updating inventory..." });
    try {
      const response = await transactionAPI.dispatchStock(formData);
      if (response.data.success) {
        setStatus({ type: "success", msg: `Successfully dispatched ${formData.quantity} kg for ${formData.sku}` });
        setFormData({ sku: "", batch_id: "", client_name: "", quantity: "" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Failed to dispatch stock. Check SKU." });
    }
  };

  // Derived selected items based on current form data
  const selectedSku = skuList.find(i => i.sku === formData.sku);
  const selectedBatch = batchList.find(b => b.batch_id === parseInt(formData.batch_id));

  // Reusable custom dropdown renderer to prevent JSX duplication
  const renderDropdown = (type, label, isLoading, list, selectedItem, getLabel, getColor, placeholder) => {
    const isOpen = dropdowns[type];
    const toggleDropdown = () => setDropdowns(prev => ({ sku: false, batch: false, [type]: !prev[type] }));
    const disabled = type === 'batch' && !formData.sku;

    return (
      <div className="form-input-group">
        <label>{label}</label>
        {isLoading ? (
          <div className="custom-dropdown"><div className="sku-dropdown-selected disabled">Loading...</div></div>
        ) : (
          <div className="custom-dropdown">
            <div
              className={`sku-dropdown-selected ${disabled ? "disabled" : ""} ${isOpen ? "open" : ""}`}
              onClick={() => !disabled && toggleDropdown()}
              style={{ color: selectedItem ? getColor(selectedItem) : "#999" }}
            >
              {disabled ? "Select a SKU first" : selectedItem ? getLabel(selectedItem) : placeholder}
              <span className="sku-dropdown-arrow">▾</span>
            </div>
            
            {isOpen && (
              <div className="sku-dropdown-list">
                {list.map((item, idx) => {
                  // FIX: Use explicit type check instead of || to prevent batch objects
                  // from resolving to item.sku when item.batch_id is the correct field.
                  const id = type === 'sku' ? item.sku : item.batch_id;
                  return (
                    <div
                      key={id || idx}
                      className="sku-dropdown-item"
                      style={{ color: getColor(item) }}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, [type === 'sku' ? 'sku' : 'batch_id']: id, ...(type === 'sku' && { batch_id: "" }) }));
                        setDropdowns({ sku: false, batch: false });
                      }}
                    >
                      {getLabel(item)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dispatch-stock-container page-with-navbar">
      <div className="dispatch-stock-header">
        <p className="dispatch-stock-label">Dispatch</p>
      </div>
      
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="dispatch-stock-form">
          {status.msg && <div className={`status-message ${status.type}`}>{status.msg}</div>}

          {/* SKU Dropdown */}
          {renderDropdown('sku', 'SKU', skuLoading, skuList, selectedSku, getSkuLabel, getSkuColor, 'Select a SKU')}
          <div className="sku-legend" style={{marginTop: '-10px', marginBottom: '15px'}}>
            <span className="legend-item legend-low-stock">● Low Stock</span>
            <span className="legend-item legend-expiring">● Expiring Soon</span>
            <span className="legend-item legend-critical">● Both</span>
          </div>

          {/* Batch Dropdown */}
          {renderDropdown('batch', 'Batch', batchLoading, batchList, selectedBatch, getBatchLabel, getBatchColor, 'Select a batch')}

          {/* Client Input */}
          <div className="form-input-group">
            <label>Client</label>
            <input type="text" name="client_name" placeholder="e.g Juan De La Cruz" value={formData.client_name} onChange={handleChange} required />
          </div>

          {/* Quantity Input */}
          <div className="form-input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" placeholder="0.00" step="0.01" value={formData.quantity} onChange={handleChange} required />
          </div>

          <button type="submit" className="dispatch-button" onClick={createRipple}>
            Dispatch
          </button>
        </form>
      </div>
    </div>
  );
};

export default DispatchStock;