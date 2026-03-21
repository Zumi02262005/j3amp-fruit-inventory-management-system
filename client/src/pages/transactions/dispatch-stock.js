import React, { useState, useEffect, useCallback } from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./dispatch-stock.css";

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

const DispatchStock = () => {
  const [formData, setFormData] = useState({
    sku: "",
    batch_id: "",
    client_name: "",
    quantity: "",
  });

  const [skuList, setSkuList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [skuLoading, setSkuLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);

  const createRipple = useRipple();

  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const response = await inventoryAPI.getSkuDropdownDispatch();
        setSkuList(response.data.data);
      } catch (err) {
        console.error("Failed to load SKU list:", err);
      } finally {
        setSkuLoading(false);
      }
    };
    fetchSkus();
  }, []);

  useEffect(() => {
    if (!formData.sku) {
      setBatchList([]);
      setFormData((prev) => ({ ...prev, batch_id: "" }));
      return;
    }
    const fetchBatches = async () => {
      setBatchLoading(true);
      try {
        const response = await inventoryAPI.getBatches(formData.sku);
        setBatchList(response.data.data);
      } catch (err) {
        console.error("Failed to load batches:", err);
        setBatchList([]);
      } finally {
        setBatchLoading(false);
      }
    };
    fetchBatches();
  }, [formData.sku]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".custom-sku-dropdown")) {
        setSkuDropdownOpen(false);
        setBatchDropdownOpen(false);
      }
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

  const getSkuLabel = (item) => {
    const warnings = [];
    if (item.is_low_stock) warnings.push("Low Stock");
    if (item.is_expiring_soon) warnings.push("Expiring Soon");
    const suffix = warnings.length > 0 ? ` — ⚠ ${warnings.join(", ")}` : "";
    return `${item.sku} — ${item.product_name} (${item.total_stock} kg)${suffix}`;
  };

  const getBatchColor = (batch) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(batch.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 ? "#ef4444" : "inherit";
  };

  const getBatchLabel = (batch) => {
    const expiry = new Date(batch.expiration_date).toLocaleDateString();
    return `Batch #${batch.batch_id} — ${batch.remaining_quantity} kg — Expires: ${expiry}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Updating inventory..." });
    try {
      const response = await transactionAPI.dispatchStock(formData);
      if (response.data.success) {
        setStatus({
          type: "success",
          msg: `Successfully dispatched ${formData.quantity} kg for ${formData.sku}`,
        });
        setFormData({ sku: "", batch_id: "", client_name: "", quantity: "" });
      }
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to dispatch stock. Check SKU.",
      });
    }
  };

  const selectedSku = skuList.find((i) => i.sku === formData.sku);
  const selectedBatch = batchList.find((b) => b.batch_id === parseInt(formData.batch_id));

  return (
    <div className="dispatch-stock-container page-with-navbar">
      <div className="dispatch-stock-header">
        <p className="dispatch-stock-label">Dispatch</p>
      </div>
      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="dispatch-stock-form">
          {status.msg && (
            <div className={`status-message ${status.type}`}>{status.msg}</div>
          )}

          {/* SKU Dropdown */}
          <div className="form-input-group">
            <label>SKU</label>
            {skuLoading ? (
              <div className="custom-sku-dropdown">
                <div className="sku-dropdown-selected disabled">Loading SKUs...</div>
              </div>
            ) : (
              <div className="custom-sku-dropdown">
                <input type="text" name="sku" value={formData.sku} required readOnly style={{ display: "none" }} />
                <div
                  className={`sku-dropdown-selected ${skuDropdownOpen ? "open" : ""}`}
                  onClick={() => setSkuDropdownOpen(!skuDropdownOpen)}
                  style={{ color: selectedSku ? getSkuColor(selectedSku) : "#999" }}
                >
                  {selectedSku ? getSkuLabel(selectedSku) : "Select a SKU"}
                  <span className="sku-dropdown-arrow">▾</span>
                </div>
                {skuDropdownOpen && (
                  <div className="sku-dropdown-list">
                    {skuList.map((item) => (
                      <div
                        key={item.sku}
                        className="sku-dropdown-item"
                        style={{ color: getSkuColor(item) }}
                        onClick={() => {
                          setFormData({ ...formData, sku: item.sku, batch_id: "" });
                          setSkuDropdownOpen(false);
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

          {/* Batch Dropdown */}
          <div className="form-input-group">
            <label>Batch</label>
            {batchLoading ? (
              <div className="custom-sku-dropdown">
                <div className="sku-dropdown-selected disabled">Loading batches...</div>
              </div>
            ) : (
              <div className="custom-sku-dropdown">
                <input type="text" name="batch_id" value={formData.batch_id} required readOnly style={{ display: "none" }} />
                <div
                  className={`sku-dropdown-selected ${!formData.sku ? "disabled" : ""} ${batchDropdownOpen ? "open" : ""}`}
                  onClick={() => { if (formData.sku) setBatchDropdownOpen(!batchDropdownOpen); }}
                  style={{ color: selectedBatch ? getBatchColor(selectedBatch) : "#999" }}
                >
                  {!formData.sku ? "Select a SKU first" : selectedBatch ? getBatchLabel(selectedBatch) : "Select a batch"}
                  <span className="sku-dropdown-arrow">▾</span>
                </div>
                {batchDropdownOpen && (
                  <div className="sku-dropdown-list">
                    {batchList.map((batch) => (
                      <div
                        key={batch.batch_id}
                        className="sku-dropdown-item"
                        style={{ color: getBatchColor(batch) }}
                        onClick={() => {
                          setFormData({ ...formData, batch_id: batch.batch_id });
                          setBatchDropdownOpen(false);
                        }}
                      >
                        {getBatchLabel(batch)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Client */}
          <div className="form-input-group">
            <label>Client</label>
            <input
              type="text"
              name="client_name"
              placeholder="e.g Juan De La Cruz"
              value={formData.client_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Quantity */}
          <div className="form-input-group">
            <label>Quantity</label>
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

          <button type="submit" className="dispatch-button" onClick={createRipple}>
            Dispatch
          </button>
        </form>
      </div>
    </div>
  );
};

export default DispatchStock;