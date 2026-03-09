import React, {useState, useEffect } from "react";
import { inventoryAPI, transactionAPI } from "../../services/api";
import "./dispatch-stock.css";

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
        return `${item.sku} — ${item.product_name} (${item.total_stock} kg)${suffix}`;
        };

        const getBatchLabel = (batch) => {
        const expiry = new Date(batch.expiration_date).toLocaleDateString();
        return `Batch #${batch.batch_id} — ${batch.remaining_quantity} kg — Expires: ${expiry}`;
        };

        const isBatchExpiring = (batch) => {
        const daysUntilExpiry = Math.ceil(
            (new Date(batch.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 7;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: "loading", msg: "Updating inventory..." });

        try {
            const response = await transactionAPI.dispatchStock(formData);

            if (response.data.success) {
                setStatus({
                    type: "success",
                    msg: `Successfully dispatched ${formData.quantity} kg for ${formData.sku}`
                });

                setFormData({
                    sku: "",
                    batch_id: "",
                    client_name: "",
                    quantity: ""
                });
            }
        } catch (err) {
            setStatus({
                type: "error",
                msg: err.response?.data?.message || "Failed to dispatch stock.Check SKU",
            });
        }
    };

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
                        <label>Batch</label>
                        {batchLoading ? (
                            <select disabled>
                            <option>Loading batches...</option>
                            </select>
                        ) : (
                            <select
                            name="batch_id"
                            value={formData.batch_id}
                            onChange={handleChange}
                            required
                            disabled={!formData.sku}
                            className="sku-select"
                            >
                            <option value="">
                                {formData.sku ? "Select a batch" : "Select a SKU first"}
                            </option>
                            {batchList.map((batch) => (
                                <option
                                key={batch.batch_id}
                                value={batch.batch_id}
                                className={isBatchExpiring(batch) ? "sku-expiring" : ""}
                                >
                                {getBatchLabel(batch)}
                                </option>
                            ))}
                            </select>
                        )}
                    </div>

                    <div className="form-input-group">
                        <label>Client</label>
                        <input type="text" name="client_name" placeholder="e.g Juan De La Cruz" value={formData.client_name} onChange={handleChange} required />
                    </div>

                    <div className="form-input-group">
                        <label>Quantity</label>
                        <input type="number" name="quantity" placeholder="0.00" value={formData.quantity} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="dispatch-button">
                        Dispatch
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DispatchStock;