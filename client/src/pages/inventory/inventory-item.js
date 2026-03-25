// inventory-item.jsx
// This page displays the details and the batches of a specific SKU
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { inventoryAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./inventory-item.css";

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

// Formatting and logic helpers
const fmt = (val) => parseFloat(val || 0).toFixed(2);
const fmtDate = (d) => new Date(d).toLocaleDateString();
const getStockStatus = (total, reorderPoint) => {
  if (total === 0) return "No Stock";
  if (total <= (reorderPoint || 0)) return "Low Stock Warning";
  return "Good Stock Level";
};

// Form Configurations
const EDIT_INFO_FIELDS = [
  { name: "product_name", label: "Product Name", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "supplier", label: "Supplier", type: "text" },
  { name: "reorder_point", label: "Reorder Point (kg)", type: "number", step: "0.01", min: "0" },
];

const EDIT_BATCH_FIELDS = [
  { name: "remaining_quantity", label: "Remaining Quantity (kg)", type: "number", step: "0.01", min: "0" },
  { name: "expiration_date", label: "Expiration Date", type: "date" },
  { name: "supplier_name", label: "Supplier", type: "text" },
];

const InventoryItem = () => {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createRipple = useRipple();

  const [batches, setBatches] = useState([]);
  const [inventoryInfo, setInventoryInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ product_name: "", category: "", supplier: "", reorder_point: "" });
  const [editStatus, setEditStatus] = useState({ type: "", msg: "" });

  const [showEditBatch, setShowEditBatch] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({ remaining_quantity: "", expiration_date: "", supplier_name: "" });
  const [batchStatus, setBatchStatus] = useState({ type: "", msg: "" });

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivateStatus, setDeactivateStatus] = useState({ type: "", msg: "" });

  const fetchBatchData = useCallback(async () => {
    try {
      const response = await inventoryAPI.getBatches(sku);
      setBatches(response.data.data);

      if (response.data.data.length > 0) {
        setInventoryInfo(response.data.data[0]);
      } else {
        // Fallback: fetch inventory info directly from inventory list if no active batches
        const invResponse = await inventoryAPI.getInventory();
        const item = invResponse.data.data.find((i) => i.sku === sku);
        if (item) setInventoryInfo(item);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => { fetchBatchData(); }, [fetchBatchData]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    document.body.style.overflow = (showEdit || showEditBatch || showDeactivate) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showEdit, showEditBatch, showDeactivate]);

  // --- Handlers for Item Info ---
  const openEditModal = () => {
    if (!inventoryInfo) return;
    setEditForm({
      product_name: inventoryInfo.product_name || "",
      category: inventoryInfo.category || "",
      supplier: inventoryInfo.supplier || "",
      reorder_point: inventoryInfo.reorder_point || "50",
    });
    setEditStatus({ type: "", msg: "" });
    setShowEdit(true);
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

  // --- Handlers for Batches ---
  const openEditBatchModal = (batch) => {
    setSelectedBatch(batch);
    setBatchForm({
      remaining_quantity: fmt(batch.remaining_quantity),
      expiration_date: new Date(batch.expiration_date).toISOString().split("T")[0],
      supplier_name: batch.supplier_name || "",
    });
    setBatchStatus({ type: "", msg: "" });
    setShowEditBatch(true);
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

  // --- Handlers for Deactivation ---
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

  // Generic change handler for forms
  const handleChange = (setter) => (e) => setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // --- Render ---
  if (loading) return <div className="inventory-item-container page-with-navbar"><div className="loader">Loading item details...</div></div>;
  if (!inventoryInfo) return <div className="inventory-item-container page-with-navbar"><div className="error-bar">SKU not found</div></div>;

  const totalStock = batches.reduce((sum, batch) => sum + parseFloat(batch.remaining_quantity || 0), 0);

  return (
    <div className="inventory-item-container page-with-navbar">
      <p className="inventory-item-label">Inventory</p>
      
      <div className="back-to-inventory">
        <span className="back-to-inventory-link" onClick={() => navigate(-1)}>← Back to inventory</span>
      </div>
      
      <div className="inventory-item-content">
        {/* General Details */}
        <div className="general-details-container">
          <p>SKU: {sku}</p>
          <ul className="general-details-list">
            <li>{inventoryInfo?.product_name}</li>
            <li><strong>Category: </strong>{inventoryInfo?.category}</li>
            <li><strong>Supplier: </strong>{inventoryInfo?.supplier}</li>
          </ul>
        </div>

        {/* Admin Actions */}
        {user?.role === "admin" && (
          <div className="admin-item-actions">
            <button className="admin-action-card" onClick={(e) => { createRipple(e); openEditModal(); }}>
              <p className="admin-action-card-text"><strong>Edit Info</strong></p>
            </button>
            <button className="admin-action-card deactivate-card" onClick={(e) => { createRipple(e); setShowDeactivate(true); }}>
              <p className="admin-action-card-text"><strong>Deactivate SKU</strong></p>
            </button>
          </div>
        )}

        {/* Stock Summary */}
        <div className="stock-details-container">
          <p>Current Stock Summary</p>
          <ul className="stock-details-list">
            <li><strong>Total Quantity: </strong>{fmt(totalStock)} kg</li>
            <li><strong>Reorder Point: </strong>{fmt(inventoryInfo?.reorder_point)} kg</li>
            <li><strong>Status: </strong>{getStockStatus(totalStock, inventoryInfo?.reorder_point)}</li>
          </ul>
        </div>

        {/* Batch Details */}
        <div className="batch-details">
          <p className="batch-details-label">Batch Details</p>
          <div className="batch-details-list">
            {batches.length === 0 ? (
              <div className="batch-details-card"><p style={{ color: "#999", textAlign: "center" }}>No active batches</p></div>
            ) : (
              batches.map((batch) => (
                <div className="batch-details-card" key={batch.batch_id}>
                  <p className="batch-details-id"># {batch.batch_id}</p>
                  <ul className="batch-details-info">
                    <li><strong>Quantity: </strong>{fmt(batch.remaining_quantity)} kg</li>
                    <li><strong>Received date: </strong>{fmtDate(batch.received_date)}</li>
                    <li><strong>Expires: </strong>{fmtDate(batch.expiration_date)}</li>
                    <li><strong>Supplier: </strong>{batch.supplier_name}</li>
                    <li><strong>Received by: </strong>{batch.received_by}</li>
                  </ul>
                  {user?.role === "admin" && (
                    <div className="batch-card-actions">
                      <button className="edit-batch-btn" onClick={() => openEditBatchModal(batch)}>Edit Batch →</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Edit Info Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Edit Info — {sku}</h3>
              <button className="inv-modal-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            {editStatus.msg && <div className={`inv-modal-status ${editStatus.type}`}>{editStatus.msg}</div>}
            <form onSubmit={handleEditSubmit} className="inv-modal-form">
              {EDIT_INFO_FIELDS.map(({ name, label, type, step, min }) => (
                <div className="inv-modal-input-group" key={name}>
                  <label>{label}</label>
                  <input type={type} name={name} value={editForm[name]} onChange={handleChange(setEditForm)} step={step} min={min} required />
                </div>
              ))}
              <button type="submit" className="inv-modal-submit-btn" onClick={createRipple}>Save Changes</button>
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
            {batchStatus.msg && <div className={`inv-modal-status ${batchStatus.type}`}>{batchStatus.msg}</div>}
            <form onSubmit={handleBatchSubmit} className="inv-modal-form">
              {EDIT_BATCH_FIELDS.map(({ name, label, type, step, min }) => (
                <div className="inv-modal-input-group" key={name}>
                  <label>{label}</label>
                  <input type={type} name={name} value={batchForm[name]} onChange={handleChange(setBatchForm)} step={step} min={min} required />
                </div>
              ))}
              <button type="submit" className="inv-modal-submit-btn" onClick={createRipple}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivate && (
        <div className="modal-overlay" onClick={() => setShowDeactivate(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Deactivate SKU</h3>
              <button className="inv-modal-close" onClick={() => setShowDeactivate(false)}>✕</button>
            </div>
            {deactivateStatus.msg && <div className={`inv-modal-status ${deactivateStatus.type}`}>{deactivateStatus.msg}</div>}
            <div className="inv-modal-form">
              <p style={{ color: "#000", fontSize: "0.9rem" }}>
                Are you sure you want to deactivate <strong>{inventoryInfo?.product_name}</strong> ({sku})? It will no longer appear in the inventory.
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