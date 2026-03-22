import React, { useState, useEffect } from "react";
import { inventoryAPI, boAPI } from "../../services/api";
import "./BatchWriteOff.css";

const BatchWriteOff = () => {
  const [formData, setFormData] = useState({
    sku: "",
    batch_id: "",
    quantity: "",
    reason: "",
  });

  const [skuList, setSkuList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [skuLoading, setSkuLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // Load all SKUs with stock (active + expired batches)
  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const response = await inventoryAPI.getInventory();
        setSkuList(response.data.data);
      } catch (err) {
        console.error("Failed to load SKUs:", err);
      } finally {
        setSkuLoading(false);
      }
    };
    fetchSkus();
  }, []);

  // Load batches (active + expired) when SKU selected
  useEffect(() => {
    if (!formData.sku) {
      setBatchList([]);
      setFormData((prev) => ({ ...prev, batch_id: "" }));
      return;
    }
    const fetchBatches = async () => {
      setBatchLoading(true);
      try {
        // Get active batches
        const activeRes = await inventoryAPI.getBatches(formData.sku);
        // Get expired items for this SKU
        const expiredRes = await inventoryAPI.getExpiredItems();
        const expiredForSku = expiredRes.data.data.filter(
          (b) => b.sku === formData.sku
        );
        const combined = [
          ...activeRes.data.data,
          ...expiredForSku.map((b) => ({ ...b, isExpired: true })),
        ];
        setBatchList(combined);
      } catch (err) {
        console.error("Failed to load batches:", err);
        setBatchList([]);
      } finally {
        setBatchLoading(false);
      }
    };
    fetchBatches();
  }, [formData.sku]);

  // Close dropdowns on outside click
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      setStatus({ type: "error", msg: "Please provide a reason for the write-off." });
      return;
    }
    setStatus({ type: "loading", msg: "Submitting request..." });
    try {
      await boAPI.submitRequest({
        batch_id: formData.batch_id,
        sku: formData.sku,
        quantity: formData.quantity,
        reason: formData.reason,
      });
      setStatus({
        type: "success",
        msg: "BO request submitted. Awaiting admin approval.",
      });
      setFormData({ sku: "", batch_id: "", quantity: "", reason: "" });
      setBatchList([]);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to submit request.",
      });
    }
  };

  const selectedSku = skuList.find((i) => i.sku === formData.sku);
  const selectedBatch = batchList.find(
    (b) => b.batch_id === parseInt(formData.batch_id)
  );

  const getBatchLabel = (batch) => {
    const expiry = new Date(batch.expiration_date).toLocaleDateString();
    const tag = batch.isExpired ? " — EXPIRED" : "";
    return `Batch #${batch.batch_id} — ${parseFloat(batch.remaining_quantity).toFixed(2)} kg — Expires: ${expiry}${tag}`;
  };

  const getBatchColor = (batch) => batch.isExpired ? "#b71c1c" : "inherit";

  return (
    <div className="bo-container page-with-navbar">
      <div className="bo-form-header">
        <p className="bo-label">BO Request</p>
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="bo-form">
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
                  style={{ color: selectedSku ? "#333" : "#999" }}
                >
                  {selectedSku ? `${selectedSku.sku} — ${selectedSku.product_name}` : "Select a SKU"}
                  <span className="sku-dropdown-arrow">▾</span>
                </div>
                {skuDropdownOpen && (
                  <div className="sku-dropdown-list">
                    {skuList.map((item) => (
                      <div
                        key={item.sku}
                        className="sku-dropdown-item"
                        onClick={() => {
                          setFormData({ ...formData, sku: item.sku, batch_id: "" });
                          setSkuDropdownOpen(false);
                        }}
                      >
                        {item.sku} — {item.product_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                    {batchList.length === 0 ? (
                      <div className="sku-dropdown-item" style={{ color: "#999" }}>No batches available</div>
                    ) : (
                      batchList.map((batch) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
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

          {/* Reason */}
          <div className="form-input-group">
            <label>Reason for Write-Off</label>
            <textarea
              name="reason"
              placeholder="Explain why this stock is being thrown away..."
              value={formData.reason}
              onChange={handleChange}
              required
              className="bo-reason-textarea"
              rows={4}
            />
          </div>

          <button type="submit" className="bo-submit-btn" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Submitting..." : "Submit BO Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BatchWriteOff;