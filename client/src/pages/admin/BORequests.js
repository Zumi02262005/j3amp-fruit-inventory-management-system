import React, { useState, useEffect, useCallback } from "react";
import { boAPI } from "../../services/api";
import "./BORequests.css";

const BORequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject'
  const [actionStatus, setActionStatus] = useState({ type: "", msg: "" });

  const fetchRequests = useCallback(async () => {
    try {
      const response = await boAPI.getAllRequests();
      setRequests(response.data.data);
    } catch (err) {
      console.error("Failed to fetch BO requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    document.body.style.overflow = confirmTarget ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [confirmTarget]);

  const handleConfirm = async () => {
    setActionStatus({ type: "loading", msg: "Processing..." });
    try {
      if (confirmAction === "approve") {
        await boAPI.approveRequest(confirmTarget.request_id);
        setActionStatus({ type: "success", msg: "Request approved. Stock updated." });
      } else {
        await boAPI.rejectRequest(confirmTarget.request_id);
        setActionStatus({ type: "success", msg: "Request rejected." });
      }
      await fetchRequests();
      setTimeout(() => {
        setConfirmTarget(null);
        setConfirmAction(null);
        setActionStatus({ type: "", msg: "" });
      }, 1200);
    } catch (err) {
      setActionStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to process request.",
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":  return <span className="bo-badge bo-badge--pending">Pending</span>;
      case "approved": return <span className="bo-badge bo-badge--approved">Approved</span>;
      case "rejected": return <span className="bo-badge bo-badge--rejected">Rejected</span>;
      default: return null;
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const resolvedRequests = requests.filter((r) => r.status !== "pending");

  if (loading) return <div className="loader">Loading BO requests...</div>;

  return (
    <div className="bo-requests-container page-with-navbar">
      <div className="bo-requests-header">
        <p className="bo-requests-label">BO Requests</p>
      </div>

      <div className="bo-requests-content">

        {/* Pending */}
        <div className="bo-requests-section bo-section--pending">
          <p className="bo-section-label">Pending ({pendingRequests.length})</p>
          <div className="bo-request-list">
            {pendingRequests.length === 0 ? (
              <div className="bo-request-card">
                <p><strong>No pending requests</strong></p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div className="bo-request-card" key={req.request_id}>
                  <div className="bo-request-top">
                    <p className="bo-request-sku">{req.sku}</p>
                    {getStatusBadge(req.status)}
                  </div>
                  <ul className="bo-request-details">
                    <li><strong>{req.product_name}</strong></li>
                    <li>Batch #{req.batch_id}</li>
                    <li>Quantity: {parseFloat(req.quantity).toFixed(2)} kg</li>
                    <li>Requested by: {req.requested_by_username}</li>
                    <li>Date: {new Date(req.requested_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</li>
                    <li className="bo-reason"><strong>Reason: </strong>{req.reason}</li>
                  </ul>
                  <div className="bo-request-actions">
                    <button
                      className="bo-approve-btn"
                      onClick={() => { setConfirmTarget(req); setConfirmAction("approve"); setActionStatus({ type: "", msg: "" }); }}
                    >
                      Approve
                    </button>
                    <button
                      className="bo-reject-btn"
                      onClick={() => { setConfirmTarget(req); setConfirmAction("reject"); setActionStatus({ type: "", msg: "" }); }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resolved */}
        {resolvedRequests.length > 0 && (
          <div className="bo-requests-section bo-section--resolved">
            <p className="bo-section-label">Resolved ({resolvedRequests.length})</p>
            <div className="bo-request-list">
              {resolvedRequests.map((req) => (
                <div className="bo-request-card bo-request-card--resolved" key={req.request_id}>
                  <div className="bo-request-top">
                    <p className="bo-request-sku">{req.sku}</p>
                    {getStatusBadge(req.status)}
                  </div>
                  <ul className="bo-request-details">
                    <li><strong>{req.product_name}</strong></li>
                    <li>Batch #{req.batch_id}</li>
                    <li>Quantity: {parseFloat(req.quantity).toFixed(2)} kg</li>
                    <li>Requested by: {req.requested_by_username}</li>
                    <li className="bo-reason"><strong>Reason: </strong>{req.reason}</li>
                    {req.approved_by_username && (
                      <li>Resolved by: {req.approved_by_username}</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div className="modal-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="bo-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bo-confirm-title">
              {confirmAction === "approve" ? "Approve Request?" : "Reject Request?"}
            </h3>
            <p className="bo-confirm-msg">
              {confirmAction === "approve"
                ? `This will deduct ${parseFloat(confirmTarget.quantity).toFixed(2)} kg from Batch #${confirmTarget.batch_id} (${confirmTarget.sku}).`
                : `This will reject the BO request for Batch #${confirmTarget.batch_id}.`}
            </p>
            <p className="bo-confirm-reason">
              <strong>Reason: </strong>{confirmTarget.reason}
            </p>
            {actionStatus.msg && (
              <div className={`bo-action-status ${actionStatus.type}`}>{actionStatus.msg}</div>
            )}
            <div className="bo-confirm-actions">
              <button className="bo-cancel-btn" onClick={() => setConfirmTarget(null)}>
                Cancel
              </button>
              <button
                className={confirmAction === "approve" ? "bo-approve-btn" : "bo-reject-btn"}
                onClick={handleConfirm}
                disabled={actionStatus.type === "loading"}
              >
                {actionStatus.type === "loading" ? "Processing..." : confirmAction === "approve" ? "Yes, Approve" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BORequests;