// reports-view.jsx
// This page displays all of the generated reports by the admin.
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../services/api";
import "./reports-view.css";

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

// Formatting helpers
const fmt = (val) => parseFloat(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

// Single source of truth for report metrics to keep the view, form, and export DRY
const REPORT_METRICS = [
  { key: "beginning_inventory", label: "Beginning Inventory", unit: "kg" },
  { key: "ending_inventory", label: "Ending Inventory", unit: "kg" },
  { key: "gross_sales", label: "Offtake", unit: "kg" },
  { key: "deliveries", label: "Deliveries", unit: "kg" },
  { key: "stock_difference", label: "Stock Difference", unit: "kg" },
  { key: "average_offtake", label: "Average Offtake", unit: "kg/day" },
  { key: "thrown_away_stock", label: "Thrown Away Stock", unit: "kg" },
];

const ReportsView = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editStatus, setEditStatus] = useState({ type: "", msg: "" });
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ type: "", msg: "" });

  // Lock body scroll when any modal is open
  useEffect(() => {
    document.body.style.overflow = (editTarget || deleteTarget) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [editTarget, deleteTarget]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await reportsAPI.getAllReports();
      if (res.data.success) setReports(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Handle Edit Operations
  const openEdit = (report) => {
    setEditTarget(report);
    const initialForm = {};
    REPORT_METRICS.forEach(({ key }) => { initialForm[key] = report[key]; });
    setEditForm(initialForm);
    setEditStatus({ type: "", msg: "" });
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditStatus({ type: "loading", msg: "Saving changes..." });
    try {
      await reportsAPI.updateReport(editTarget.report_id, editForm);
      setEditStatus({ type: "success", msg: "Report updated successfully!" });
      await fetchReports();
      setTimeout(() => setEditTarget(null), 1200);
    } catch (err) {
      setEditStatus({ type: "error", msg: err.response?.data?.message || "Failed to update report." });
    }
  };

  // Handle Delete Operations
  const handleDelete = async () => {
    setDeleteStatus({ type: "loading", msg: "Deleting..." });
    try {
      await reportsAPI.deleteReport(deleteTarget.report_id);
      setDeleteStatus({ type: "success", msg: "Report deleted." });
      await fetchReports();
      setTimeout(() => setDeleteTarget(null), 900);
    } catch (err) {
      setDeleteStatus({ type: "error", msg: err.response?.data?.message || "Failed to delete report." });
    }
  };

  // Dynamically generate the print/export HTML
  const handleExport = (report) => {
    const tableRows = REPORT_METRICS.map(({ label, key, unit }) => 
      `<tr><td>${label}</td><td>${fmt(report[key])} ${unit}</td></tr>`
    ).join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head>
        <title>Report — ${fmtDate(report.start_date)} to ${fmtDate(report.end_date)}</title>
        <style>
          body { font-family: Inter, sans-serif; padding: 40px; color: #000; }
          h1 { color: #ff6200; font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 13px; margin-bottom: 28px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #ff6200; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; }
          td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
          tr:last-child td { border-bottom: none; }
          .footer { margin-top: 32px; font-size: 11px; color: #aaa; }
        </style>
      </head><body>
        <h1>Inventory Report</h1>
        <p class="subtitle">${fmtDate(report.start_date)} — ${fmtDate(report.end_date)}<br/>Generated by: ${report.created_by_username || "Admin"}</p>
        <table>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p class="footer">Exported on ${fmtDate(new Date())}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Helper for inline button actions
  const triggerAction = (e, actionFn, arg) => {
    createRipple(e);
    actionFn(arg);
  };

  if (loading) return <div className="reports-view-loader">Loading reports...</div>;
  if (error)   return <div className="reports-view-error">{error}</div>;

  return (
    <div className="reports-view-container page-with-navbar">
      <div className="reports-view-header">
        <button className="reports-view-back" onClick={() => navigate("/reports")}>← Back to Reports</button>
        <p className="reports-view-label">All Reports</p>
      </div>
      
      <div className="reports-view-content">
        {reports.length === 0 ? (
          <div className="reports-view-empty">
            <p>No reports found.</p>
            <button className="reports-view-empty-btn" onClick={() => navigate("/reports/generate")}>Generate your first report</button>
          </div>
        ) : (
          reports.map((report) => (
            <div className="report-card" key={report.report_id}>
              <p className="report-card-date">{fmtDate(report.start_date)} — {fmtDate(report.end_date)}</p>
              
              <ul className="report-card-details">
                {REPORT_METRICS.map(({ key, label, unit }) => (
                  <li key={key}>{label}: <strong>{fmt(report[key])} {unit}</strong></li>
                ))}
              </ul>

              <div className="report-card-actions">
                <button className="report-action-btn report-action-btn--edit" onClick={(e) => triggerAction(e, openEdit, report)}>Edit</button>
                <button className="report-action-btn report-action-btn--export" onClick={(e) => triggerAction(e, handleExport, report)}>Export PDF</button>
                <button className="report-action-btn report-action-btn--delete" onClick={(e) => triggerAction(e, (r) => { setDeleteTarget(r); setDeleteStatus({ type: "", msg: "" }); }, report)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3>Edit Report</h3>
              <button className="rpt-modal-close" onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <p className="rpt-modal-subheading">{fmtDate(editTarget.start_date)} — {fmtDate(editTarget.end_date)}</p>
            {editStatus.msg && <div className={`rpt-modal-status ${editStatus.type}`}>{editStatus.msg}</div>}
            
            <form onSubmit={handleEditSubmit} className="rpt-modal-form">
              {REPORT_METRICS.map(({ key, label, unit }) => (
                <div className="rpt-modal-input-group" key={key}>
                  <label>{label} ({unit})</label>
                  <input type="number" step="0.01" name={key} value={editForm[key] || ""} onChange={handleEditChange} required />
                </div>
              ))}
              <button type="submit" className="rpt-modal-submit-btn" onClick={createRipple} disabled={editStatus.type === "loading"}>
                {editStatus.type === "loading" ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="rpt-modal rpt-modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3>Delete Report</h3>
              <button className="rpt-modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p className="rpt-modal-confirm-text">
              Are you sure you want to delete the report for <strong>{fmtDate(deleteTarget.start_date)} — {fmtDate(deleteTarget.end_date)}</strong>? This cannot be undone.
            </p>
            {deleteStatus.msg && <div className={`rpt-modal-status ${deleteStatus.type}`}>{deleteStatus.msg}</div>}
            <div className="rpt-modal-confirm-actions">
              <button className="rpt-modal-cancel-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="rpt-modal-delete-btn" onClick={handleDelete} disabled={deleteStatus.type === "loading"}>
                {deleteStatus.type === "loading" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;