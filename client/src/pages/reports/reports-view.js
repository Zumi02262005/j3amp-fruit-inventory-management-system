import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../services/api";
import "./reports-view.css";

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

const fmt = (val) => parseFloat(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

const ReportsView = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();
  const printRef = useRef();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ── Edit modal ── */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editStatus, setEditStatus] = useState({ type: "", msg: "" });

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState({ type: "", msg: "" });

  /* ── Lock scroll when any modal open ── */
  useEffect(() => {
    const anyOpen = editModalOpen || !!deleteTarget;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [editModalOpen, deleteTarget]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reportsAPI.getAllReports();
      if (res.data.success) setReports(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  /* ── Edit handlers ── */
  const openEdit = (report) => {
    setEditTarget(report);
    setEditForm({
      gross_sales:          report.gross_sales,
      beginning_inventory:  report.beginning_inventory,
      ending_inventory:     report.ending_inventory,
      deliveries:           report.deliveries,
      stock_difference:     report.stock_difference,
      average_offtake:      report.average_offtake,
    });
    setEditStatus({ type: "", msg: "" });
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditStatus({ type: "loading", msg: "Saving changes..." });
    try {
      await reportsAPI.updateReport(editTarget.report_id, editForm);
      setEditStatus({ type: "success", msg: "Report updated successfully!" });
      await fetchReports();
      setTimeout(() => setEditModalOpen(false), 1200);
    } catch (err) {
      setEditStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to update report.",
      });
    }
  };

  /* ── Delete handlers ── */
  const handleDelete = async () => {
    setDeleteStatus({ type: "loading", msg: "Deleting..." });
    try {
      await reportsAPI.deleteReport(deleteTarget.report_id);
      setDeleteStatus({ type: "success", msg: "Report deleted." });
      await fetchReports();
      setTimeout(() => setDeleteTarget(null), 900);
    } catch (err) {
      setDeleteStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to delete report.",
      });
    }
  };

  /* ── PDF Export ── */
  const handleExport = (report) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
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
        </head>
        <body>
          <h1>Inventory Report</h1>
          <p class="subtitle">
            ${fmtDate(report.start_date)} — ${fmtDate(report.end_date)}<br/>
            Generated by: ${report.created_by_username || "Admin"}
          </p>
          <table>
            <thead>
              <tr><th>Metric</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Gross Sales</td><td>₱ ${fmt(report.gross_sales)}</td></tr>
              <tr><td>Beginning Inventory</td><td>${fmt(report.beginning_inventory)} kg</td></tr>
              <tr><td>Ending Inventory</td><td>${fmt(report.ending_inventory)} kg</td></tr>
              <tr><td>Deliveries</td><td>${fmt(report.deliveries)} kg</td></tr>
              <tr><td>Stock Difference</td><td>${fmt(report.stock_difference)} kg</td></tr>
              <tr><td>Average Offtake</td><td>${fmt(report.average_offtake)} kg/day</td></tr>
            </tbody>
          </table>
          <p class="footer">Exported on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) return <div className="reports-view-loader">Loading reports...</div>;
  if (error)   return <div className="reports-view-error">{error}</div>;

  return (
    <div className="reports-view-container page-with-navbar">
      <div className="reports-view-header">
        <button className="reports-view-back" onClick={() => navigate("/reports")}>
          ← Back to Reports
        </button>
        <p className="reports-view-label">All Reports</p>
      </div>

      <div className="reports-view-content">
        {reports.length === 0 ? (
          <div className="reports-view-empty">
            <p>No reports found.</p>
            <button className="reports-view-empty-btn" onClick={() => navigate("/reports/generate")}>
              Generate your first report
            </button>
          </div>
        ) : (
          reports.map((report) => (
            <div className="report-card" key={report.report_id}>
              <p className="report-card-date">
                {fmtDate(report.start_date)} — {fmtDate(report.end_date)}
              </p>
              <ul className="report-card-details">
                <li>Gross Sales: <strong>₱ {fmt(report.gross_sales)}</strong></li>
                <li>Beginning Inventory: <strong>{fmt(report.beginning_inventory)} kg</strong></li>
                <li>Ending Inventory: <strong>{fmt(report.ending_inventory)} kg</strong></li>
                <li>Deliveries: <strong>{fmt(report.deliveries)} kg</strong></li>
                <li>Difference: <strong>{fmt(report.stock_difference)} kg</strong></li>
                <li>Average Offtake: <strong>{fmt(report.average_offtake)} kg/day</strong></li>
              </ul>

              <div className="report-card-actions">
                <button
                  className="report-action-btn report-action-btn--edit"
                  onClick={(e) => { createRipple(e); openEdit(report); }}
                >
                  Edit
                </button>
                <button
                  className="report-action-btn report-action-btn--export"
                  onClick={(e) => { createRipple(e); handleExport(report); }}
                >
                  Export PDF
                </button>
                <button
                  className="report-action-btn report-action-btn--delete"
                  onClick={(e) => { createRipple(e); setDeleteTarget(report); setDeleteStatus({ type: "", msg: "" }); }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editModalOpen && editTarget && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="rpt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3>Edit Report</h3>
              <button className="rpt-modal-close" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>
            <p className="rpt-modal-subheading">
              {fmtDate(editTarget.start_date)} — {fmtDate(editTarget.end_date)}
            </p>
            {editStatus.msg && (
              <div className={`rpt-modal-status ${editStatus.type}`}>{editStatus.msg}</div>
            )}
            <form onSubmit={handleEditSubmit} className="rpt-modal-form">
              {[
                { name: "gross_sales",         label: "Gross Sales (₱)" },
                { name: "beginning_inventory", label: "Beginning Inventory (kg)" },
                { name: "ending_inventory",    label: "Ending Inventory (kg)" },
                { name: "deliveries",          label: "Deliveries (kg)" },
                { name: "stock_difference",    label: "Stock Difference (kg)" },
                { name: "average_offtake",     label: "Average Offtake (kg/day)" },
              ].map(({ name, label }) => (
                <div className="rpt-modal-input-group" key={name}>
                  <label>{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    name={name}
                    value={editForm[name]}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              ))}
              <button
                type="submit"
                className="rpt-modal-submit-btn"
                onClick={createRipple}
                disabled={editStatus.type === "loading"}
              >
                {editStatus.type === "loading" ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="rpt-modal rpt-modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="rpt-modal-header">
              <h3>Delete Report</h3>
              <button className="rpt-modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p className="rpt-modal-confirm-text">
              Are you sure you want to delete the report for{" "}
              <strong>{fmtDate(deleteTarget.start_date)} — {fmtDate(deleteTarget.end_date)}</strong>?
              This action cannot be undone.
            </p>
            {deleteStatus.msg && (
              <div className={`rpt-modal-status ${deleteStatus.type}`}>{deleteStatus.msg}</div>
            )}
            <div className="rpt-modal-confirm-actions">
              <button
                className="rpt-modal-cancel-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="rpt-modal-delete-btn"
                onClick={handleDelete}
                disabled={deleteStatus.type === "loading"}
              >
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