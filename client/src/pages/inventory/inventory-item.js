import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./inventory-item.css";

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

const InventoryItem = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    product_name: "",
    category: "",
    supplier: "",
    reorder_point: "",
  });
  const [editStatus, setEditStatus] = useState({ type: "", msg: "" });

  const [showEditBatch, setShowEditBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    remaining_quantity: "",
    expiration_date: "",
    supplier_name: "",
  });
  const [batchStatus, setBatchStatus] = useState({ type: "", msg: "" });

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivateStatus, setDeactivateStatus] = useState({ type: "", msg: "" });

  const createRipple = useRipple();

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchBatchData();
  }, [sku]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = showEdit || showEditBatch || showDeactivate;
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showEdit, showEditBatch, showDeactivate]);

  const openEditModal = () => {
    if (!productInfo) return;
    setEditForm({
      product_name: productInfo.product_name || "",
      category: productInfo.category || "",
      supplier: productInfo.supplier || "",
      reorder_point: productInfo.reorder_point || "50",
    });
    setEditStatus({ type: "", msg: "" });
    setShowEdit(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditStatus({ type: "loading", msg: "Saving changes..." });
    try {
      await inventoryAPI.updateInventoryItem(sku, editForm);
      setEditStatus({ type: "success", msg: "Item updated successfully!" });
      await fetchBatchData();
      setTimeout(() => setShowEdit(false), 1000);
    } catch (err) {
      setEditStatus({ type: "error", msg: err.response?.data?.message || "Failed to update item." });
    }
  };

  const openEditBatchModal = (batch) => {
    setSelectedBatch(batch);
    const expDate = new Date(batch.expiration_date).toISOString().split("T")[0];
    setBatchForm({
      remaining_quantity: parseFloat(batch.remaining_quantity).toFixed(2),
      expiration_date: expDate,
      supplier_name: batch.supplier_name || "",
    });
    setBatchStatus({ type: "", msg: "" });
    setShowEditBatch(true);
  };

  const handleBatchChange = (e) => {
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setBatchStatus({ type: "loading", msg: "Updating batch..." });
    try {
      await inventoryAPI.updateBatch(selectedBatch.batch_id, batchForm);
      setBatchStatus({ type: "success", msg: "Batch updated successfully!" });
      await fetchBatchData();
      setTimeout(() => setShowEditBatch(false), 1000);
    } catch (err) {
      setBatchStatus({ type: "error", msg: err.response?.data?.message || "Failed to update batch." });
    }
  };

  const handleDeactivate = async () => {
    setDeactivateStatus({ type: "loading", msg: "Deactivating..." });
    try {
      await inventoryAPI.deactivateSku(sku);
      setDeactivateStatus({ type: "success", msg: "SKU deactivated." });
      setTimeout(() => navigate("/inventory-home"), 1200);
    } catch (err) {
      setDeactivateStatus({ type: "error", msg: err.response?.data?.message || "Failed to deactivate." });
    }
  };

  if (loading) return (
    <div className="inventory-item-container page-with-navbar">
      <div className="loader">Loading item details...</div>
    </div>
  );

  const productInfo = batches.length > 0 ? batches[0] : null;
  const totalStock = batches.reduce(
    (sum, batch) => sum + parseFloat(batch.remaining_quantity || 0),
    0,
  );

  if (batches.length === 0)
    return (
      <div className="inventory-item-container page-with-navbar">
        <div className="error-bar">No active batches found</div>
      </div>
    );

  return (
    <div className="inventory-item-container page-with-navbar">
      <p className="inventory-item-label">Inventory</p>
      <div className="back-to-inventory">
        <span className="back-to-inventory-link" onClick={() => navigate(-1)}>
          ← Back to inventory
        </span>
      </div>
      <div className="inventory-item-content">

        {/* General Details */}
        <div className="general-details-container">
          <p>SKU: {sku}</p>
          <ul className="general-details-list">
            <li>{productInfo?.product_name}</li>
            <li><strong>Category: </strong>{productInfo?.category}</li>
            <li><strong>Supplier: </strong>{productInfo?.supplier}</li>
          </ul>
        </div>

        {/* Admin Actions */}
        {user?.role === "admin" && (
          <div className="admin-item-actions">
            <button
              className="admin-action-card"
              onClick={(e) => { createRipple(e); openEditModal(); }}
            >
              <p className="admin-action-card-text"><strong>Edit Info</strong></p>
            </button>
            <button
              className="admin-action-card deactivate-card"
              onClick={(e) => { createRipple(e); setShowDeactivate(true); }}
            >
              <p className="admin-action-card-text"><strong>Deactivate SKU</strong></p>
            </button>
          </div>
        )}

        {/* Stock Summary */}
        <div className="stock-details-container">
          <p>Current Stock Summary</p>
          <ul className="stock-details-list">
            <li><strong>Total Quantity: </strong>{totalStock.toFixed(2)}</li>
            <li><strong>Reorder Point: </strong>{parseFloat(productInfo?.reorder_point).toFixed(2)}</li>
            <li>
              <strong>Status: </strong>
              {totalStock <= productInfo?.reorder_point ? "Low Stock Warning" : "Good Stock Level"}
            </li>
          </ul>
        </div>

        {/* Batch Details */}
        <div className="batch-details">
          <p className="batch-details-label">Batch Details</p>
          <div className="batch-details-list">
            {batches.map((batch) => (
              <div className="batch-details-card" key={batch.batch_id}>
                <p className="batch-details-id"># {batch.batch_id}</p>
                <ul className="batch-details-info">
                  <li><strong>Quantity: </strong>{parseFloat(batch.remaining_quantity).toFixed(2)} kg</li>
                  <li><strong>Received date: </strong>{new Date(batch.received_date).toLocaleDateString()}</li>
                  <li><strong>Expires: </strong>{new Date(batch.expiration_date).toLocaleDateString()}</li>
                  <li><strong>Supplier: </strong>{batch.supplier_name}</li>
                  <li><strong>Received by: </strong>{batch.received_by}</li>
                </ul>
                {user?.role === "admin" && (
                  <div className="batch-card-actions">
                    <button className="edit-batch-btn" onClick={() => openEditBatchModal(batch)}>
                      Edit Batch →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Info Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Edit Info — {sku}</h3>
              <button className="inv-modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            {editStatus.msg && (
              <div className={`inv-modal-status ${editStatus.type}`}>{editStatus.msg}</div>
            )}
            <form onSubmit={handleEditSubmit} className="inv-modal-form">
              <div className="inv-modal-input-group">
                <label>Product Name</label>
                <input type="text" name="product_name" value={editForm.product_name} onChange={handleEditChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Category</label>
                <input type="text" name="category" value={editForm.category} onChange={handleEditChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Supplier</label>
                <input type="text" name="supplier" value={editForm.supplier} onChange={handleEditChange} required />
              </div>
              <div className="inv-modal-input-group">
                <label>Reorder Point (kg)</label>
                <input type="number" name="reorder_point" value={editForm.reorder_point} onChange={handleEditChange} step="0.01" min="0" required />
              </div>
              <button type="submit" className="inv-modal-submit-btn" onClick={createRipple}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditBatch && selectedBatch && (
        <div className="modal-overlay" onClick={() => setShowEditBatch(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Edit Batch #{selectedBatch.batch_id}</h3>
              <button className="inv-modal-close" onClick={() => setShowEditBatch(false)}>✕</button>
            </div>
            {batchStatus.msg && (
              <div className={`inv-modal-status ${batchStatus.type}`}>{batchStatus.msg}</div>
            )}
            <form onSubmit={handleBatchSubmit} className="inv-modal-form">
              <div className="inv-modal-input-group">
                <label>Remaining Quantity (kg)</label>
                <input
                  type="number"
                  name="remaining_quantity"
                  value={batchForm.remaining_quantity}
                  onChange={handleBatchChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="inv-modal-input-group">
                <label>Expiration Date</label>
                <input
                  type="date"
                  name="expiration_date"
                  value={batchForm.expiration_date}
                  onChange={handleBatchChange}
                  required
                />
              </div>
              <div className="inv-modal-input-group">
                <label>Supplier</label>
                <input
                  type="text"
                  name="supplier_name"
                  value={batchForm.supplier_name}
                  onChange={handleBatchChange}
                  required
                />
              </div>
              <button type="submit" className="inv-modal-submit-btn" onClick={createRipple}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivate && (
        <div className="modal-overlay" onClick={() => setShowDeactivate(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Deactivate SKU</h3>
              <button className="inv-modal-close" onClick={() => setShowDeactivate(false)}>✕</button>
            </div>
            {deactivateStatus.msg && (
              <div className={`inv-modal-status ${deactivateStatus.type}`}>{deactivateStatus.msg}</div>
            )}
            <div className="inv-modal-form">
              <p style={{ color: "#000", fontSize: "0.9rem" }}>
                Are you sure you want to deactivate <strong>{productInfo?.product_name}</strong> ({sku})?
                It will no longer appear in the inventory.
              </p>
              <button className="inv-modal-deactivate-btn" onClick={(e) => { createRipple(e); handleDeactivate(); }}>
                Yes, Deactivate
              </button>
              <button className="inv-modal-cancel-btn" onClick={(e) => { createRipple(e); setShowDeactivate(false); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryItem;