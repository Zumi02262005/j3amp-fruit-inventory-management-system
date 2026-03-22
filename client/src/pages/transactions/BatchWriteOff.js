import React, { useState, useEffect } from "react";
import { inventoryAPI } from "../../services/api";
import "./BatchWriteOff.css";

const BatchWriteOff = () => {
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  useEffect(() => {
    const fetchExpired = async () => {
      try {
        const response = await inventoryAPI.getExpiredItems();
        setExpiredBatches(response.data.data);
      } catch (err) {
        console.error("Failed to fetch expired batches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpired();
  }, []);

  const handleCheckbox = (batchId) => {
    setSelectedIds((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === expiredBatches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(expiredBatches.map((b) => b.batch_id));
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setStatus({ type: "loading", msg: "Writing off batches..." });
    try {
      await inventoryAPI.writeOffBatches({ batch_ids: selectedIds });
      setStatus({
        type: "success",
        msg: `${selectedIds.length} batch(es) successfully written off.`,
      });
      // Remove written off batches from the list
      setExpiredBatches((prev) =>
        prev.filter((b) => !selectedIds.includes(b.batch_id))
      );
      setSelectedIds([]);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to write off batches.",
      });
    }
  };

  if (loading) return <div className="loader">Loading expired batches...</div>;

  return (
    <div className="bo-container page-with-navbar">

      {/* Header */}
      <div className="bo-header">
        <p className="bo-label">Batch Write-Off</p>
        {selectedIds.length > 0 && (
          <button
            className="bo-confirm-btn"
            onClick={() => setShowConfirm(true)}
          >
            Confirm ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Status message */}
      {status.msg && (
        <div className={`bo-status ${status.type}`}>{status.msg}</div>
      )}

      <div className="bo-content">
        {expiredBatches.length === 0 ? (
          <div className="bo-empty">
            <p>No expired batches to write off 🎉</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="bo-select-all">
              <label className="bo-checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedIds.length === expiredBatches.length}
                  onChange={handleSelectAll}
                  className="bo-checkbox"
                />
                <span>Select All ({expiredBatches.length})</span>
              </label>
            </div>

            {/* Batch list */}
            <div className="bo-expired-section">
              <p className="bo-expired-label">Expired Batches</p>
              <div className="bo-batch-list">
                {expiredBatches.map((batch) => (
                  <div
                    key={batch.batch_id}
                    className={`bo-batch-card ${selectedIds.includes(batch.batch_id) ? "selected" : ""}`}
                    onClick={() => handleCheckbox(batch.batch_id)}
                  >
                    <div className="bo-batch-top">
                      <div>
                        <p className="bo-batch-sku">{batch.sku}</p>
                        <p className="bo-batch-name">{batch.product_name}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(batch.batch_id)}
                        onChange={() => handleCheckbox(batch.batch_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bo-checkbox"
                      />
                    </div>
                    <ul className="bo-batch-details">
                      <li>Batch #{batch.batch_id}</li>
                      <li>Expired: {new Date(batch.expiration_date).toLocaleDateString()}</li>
                      <li>Remaining: {parseFloat(batch.remaining_quantity).toFixed(2)} kg</li>
                      <li>Supplier: {batch.supplier_name}</li>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation popup */}
      {showConfirm && (
        <div className="bo-modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="bo-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bo-modal-title">Confirm Write-Off</h3>
            <p className="bo-modal-msg">
              Are you sure you want to write off{" "}
              <strong>{selectedIds.length}</strong> batch(es)?
              This action cannot be undone.
            </p>
            <div className="bo-modal-actions">
              <button
                className="bo-modal-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button className="bo-modal-confirm" onClick={handleConfirm}>
                Yes, Write Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchWriteOff;