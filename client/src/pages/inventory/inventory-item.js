import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import "./inventory-item.css";

const InventoryItem = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        const response = await inventoryAPI.getBatches(sku);
        setBatches(response.data.data);
      } catch (err) {
        console.error("Failed to fetch batches", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBatchData();
  }, [sku]);

  if (loading) return <div className="loader">Loading item details...</div>;
  const productInfo = batches.length > 0 ? batches[0] : null;
  const totalStock = batches.reduce(
    (sum, batch) => sum + parseFloat(batch.remaining_quantity || 0),
    0,
  );

  if (batches.length === 0)
    return <div className="error-bar">No active batches found</div>;

  return (
    <div className="inventory-item-container page-with-navbar">
      <p className="inventory-item-label">Inventory</p>
      <div className="back-to-inventory">
        <span className="back-to-inventory-link" onClick={() => navigate(-1)}>
            ← Back to inventory
        </span>
      </div>
      <div className="inventory-item-content">
        <div className="general-details-container">
          <p>SKU: {sku}</p>
          <ul className="general-details-list">
            <li>{productInfo?.product_name}</li>
            <li>
              <strong>Category: </strong>
              {productInfo?.category}
            </li>
            <li>
              <strong>Supplier: </strong>
              {productInfo?.supplier}
            </li>
          </ul>
        </div>

        <div className="stock-details-container">
          <p>Current Stock Summary</p>
          <ul className="stock-details-list">
            <li>
              <strong>Total Quantity: </strong>
              {totalStock.toFixed(2)}
            </li>
            <li>
              <strong>Reorder Point: </strong>
              {parseFloat(productInfo?.reorder_point).toFixed(2)}
            </li>
            <li>
              <strong>Status: </strong>
              {totalStock <= productInfo?.reorder_point
                ? "Low Stock Warning"
                : "Good Stock Level"}
            </li>
          </ul>
        </div>

        <div className="batch-details">
          <p className="batch-details-label">Batch Details</p>
          <div className="batch-details-list">
            {batches.length === 0 ? (
              <div className="batch-details-card">
                <p>
                  <strong>No batches</strong>
                </p>
              </div>
            ) : (
              batches.map((batch) => (
                <div className="batch-details-card" key={batch.batch_id}>
                  <p className="batch-details-id"># {batch.batch_id}</p>
                  <ul className="batch-details-info">
                    <li>
                      <strong>Quantity: </strong>
                      {parseFloat(batch.remaining_quantity).toFixed(2)} kg
                    </li>
                    <li>
                      <strong>Received date: </strong>
                      {new Date(batch.received_date).toLocaleDateString()}
                    </li>
                    <li>
                      <strong>Expires: </strong>
                      {new Date(batch.expiration_date).toLocaleDateString()}
                    </li>
                    <li>
                      <strong>Supplier: </strong>
                      {batch.supplier_name}
                    </li>
                    <li>
                      <strong>Received by: </strong>
                      {batch.received_by}
                    </li>
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    /*<div className="inventory-item-container page-with-navbar">
            <button onClick={() => navigate(-1)}>&larr; Back</button>

            <h2>Product: {batches[0]?.product_name || sku}</h2>
            <h3>Total Stock: {totalStock.toFixed(2)} kg</h3>

            <table>
                <thead>
                    <tr>
                        <th>Batch ID</th>
                        <th>Expiration Date</th>
                        <th>Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {batches.map(batch => (
                        <tr key={batch.batch_id}>
                            <td>{batch.batch_id}</td>
                            <td>{new Date(batch.expiration_date).toLocaleDateString()}</td>
                            <td>{parseFloat(batch.remaining_quantity).toFixed(2)} kg</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>*/
  );
};

export default InventoryItem;
