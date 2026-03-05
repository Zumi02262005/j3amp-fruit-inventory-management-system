import React, { useState } from "react";
import { inventoryAPI } from "../../services/api";
import "./receive-stock.css";

const ReceiveStock = () => {
  const [formData, setFormData] = useState({
    sku: "",
    quantity: "",
    expiration_date: "",
    supplier_name: "",
  });

  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", msg: "Updating inventory..." });

    try {
      const response = await inventoryAPI.receiveStock(formData);

      if (response.data.success) {
        setStatus({
          type: "success",
          msg: `Successfully received ${formData.quantity}kg for ${formData.sku}`,
        });
        setFormData({
          sku: "",
          quantity: "",
          expiration_date: "",
          supplier_name: "",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        msg:
          err.response?.data?.message || "Failed to receive stock. Check SKU.",
      });
    }
  };

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
            <input
              type="text"
              name="sku"
              placeholder="e.g. 55379"
              value={formData.sku}
              onChange={handleChange}
              required
            />
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

          <button type="submit" className="receive-button">
            Receive
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReceiveStock;
