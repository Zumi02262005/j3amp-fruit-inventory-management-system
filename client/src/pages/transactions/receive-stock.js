import React, { useState, useEffect, useCallback } from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./receive-stock.css";

/* ── Ripple helper ── */
const useRipple = () => {
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const circle = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    circle.className = "ripple-circle";
    circle.style.left = `${e.clientX - rect.left}px`;
    circle.style.top  = `${e.clientY - rect.top}px`;
    btn.appendChild(circle);
    circle.addEventListener("animationend", () => circle.remove());
  }, []);
  return createRipple;
};

const ReceiveStock = () => {
  const [formData, setFormData] = useState({
    sku: "",
    quantity: "",
    expiration_date: "",
    supplier_name: "",
  });

  const [skuList, setSkuList] = useState([]);
  const [skuLoading, setSkuLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const createRipple = useRipple();

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const response = await inventoryAPI.getSkuDropdown();
        setSkuList(response.data.data);
      } catch (err) {
        console.error("Failed to load SKU list:", err);
        setStatus({ type: "error", msg: "Failed to load SKU list." });
      } finally {
        setSkuLoading(false);
      }
    };
    fetchSkus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-sku-dropdown")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSkuColor = (item) => {
    if (item.is_low_stock && item.is_expiring_soon) return "#a855f7";
    if (item.is_expiring_soon) return "#ef4444";
    if (item.is_low_stock) return "#f97316";
    return "inherit";
  };

  const getSkuLabel = (item) => `${item.sku} — ${item.product_name}`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Updating inventory..." });
    try {
      const response = await transactionAPI.receiveStock(formData);
      if (response.data.success) {
        setStatus({
          type: "success",
          msg: `Successfully received ${formData.quantity}kg for ${formData.sku}`,
        });
        setFormData({ sku: "", quantity: "", expiration_date: "", supplier_name: "" });
      }
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to receive stock. Check SKU.",
      });
    }
  };

  const selectedItem = skuList.find((i) => i.sku === formData.sku);

  return (
    <div className="receive-stock-container page-with-navbar">
      <div className="receive-stock-header">
        <p className="receive-stock-label">Receive</p>
      </div>
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="receive-stock-form">
          {status.msg && (
            <div className={`status-message ${status.type}`}>{status.msg}</div>
          )}

          <div className="form-input-group">
            <label>SKU</label>
            {skuLoading ? (
              <div className="custom-sku-dropdown">
                <div className="sku-dropdown-selected disabled">Loading SKUs...</div>
              </div>
            ) : (
              <div className="custom-sku-dropdown">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  required
                  readOnly
                  style={{ display: "none" }}
                />
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
              </div>
            )}
            <div className="sku-legend">
              <span className="legend-item legend-low-stock">● Low Stock</span>
              <span className="legend-item legend-expiring">● Expiring Soon</span>
              <span className="legend-item legend-critical">● Both</span>
            </div>
          </div>

          <div className="form-input-group">
            <label>Quantity (kg)</label>
            <input
              type="number"
              name="quantity"
              placeholder="0.00"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-input-group">
            <label>Expiration Date</label>
            <input
              type="date"
              name="expiration_date"
              value={formData.expiration_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-input-group">
            <label>Supplier</label>
            <input
              type="text"
              name="supplier_name"
              placeholder="Supplier name"
              value={formData.supplier_name}
              onChange={handleChange}
            />
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