import React, {useState } from "react";
import { inventoryAPI } from "../../services/api";
import "./dispatch-stock.css";

const DispatchStock = () => {
    const [formData, setFormData] = useState({
        sku: "",
        batch_id: "",
        client_name: "",
        quantity: "",
    });

    const [status, setStatus] = useState({ type: "", msg: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: "loading", msg: "Updating inventory..." });

        try {
            const response = await inventoryAPI.dispatchStock(formData);

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
                        <input type="text" name="sku" placeholder="e.g. 55379" value={formData.sku} onChange={handleChange} required />
                    </div>

                    <div className="form-input-group">
                        <label>Batch</label>
                        <input type="number" name="batch_id" placeholder="0" value={formData.batch_id} onChange={handleChange} required />
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