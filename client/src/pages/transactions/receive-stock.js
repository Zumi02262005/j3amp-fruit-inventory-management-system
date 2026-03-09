import React, { useState, useEffect} from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./receive-stock.css";

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

  // Load SKU dropdown on mount
  useEffect(() => {
    const fetchSkus = async () => {
      try {
        const response = await inventoryAPI.getSkuDropdown();
        setSkuList(response.data.data);
      } catch (err) {
        console.error("Failed to load SKU list:", err);
      } finally {
        setSkuLoading(false);
      }
    };
    fetchSkus();
  }, []);

  const getSkuOptionClass = (item) => {
  if (item.is_low_stock && item.is_expiring_soon) return "sku-critical";
  if (item.is_expiring_soon) return "sku-expiring";
  if (item.is_low_stock) return "sku-low-stock";
  return "";
};

const getSkuLabel = (item) => {
  const warnings = [];
  if (item.is_low_stock) warnings.push("Low Stock");
  if (item.is_expiring_soon) warnings.push("Expiring Soon");
  const suffix = warnings.length > 0 ? ` — ⚠ ${warnings.join(", ")}` : "";
  return `${item.sku} — ${item.product_name}${suffix}`;
};

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
            {skuLoading ? (
              <select disabled>
                <option>Loading SKUs...</option>
              </select>
            ) : (
              <select
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="sku-select"
              >
                <option value="">Select a SKU</option>
                {skuList.map((item) => (
                  <option
                    key={item.sku}
                    value={item.sku}
                    className={getSkuOptionClass(item)}
                  >
                    {getSkuLabel(item)}
                  </option>
                ))}
              </select>
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

          <button type="submit" className="receive-button">
            Receive
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReceiveStock;
