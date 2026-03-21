import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../services/api";
import "./reports-generate.css";

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

const ReportsGenerate = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
  });
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus({ type: "", msg: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { start_date, end_date } = formData;

    if (new Date(start_date) > new Date(end_date)) {
      setStatus({ type: "error", msg: "Start date cannot be later than end date." });
      return;
    }

    setStatus({ type: "loading", msg: "Generating report..." });

    try {
      await reportsAPI.generateReport({ start_date, end_date });
      setStatus({ type: "success", msg: "Report generated successfully!" });
      setFormData({ start_date: "", end_date: "" });
      setTimeout(() => navigate("/reports/view"), 1500);
    } catch (err) {
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to generate report. Please try again.",
      });
    }
  };

  return (
    <div className="reports-generate-container page-with-navbar">
      <div className="reports-generate-header">
        <button className="reports-generate-back" onClick={() => navigate("/reports")}>
          ← Back to Reports
        </button>
        <p className="reports-generate-label">Generate Report</p>
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="reports-generate-form">

          {status.msg && (
            <div className={`status-message ${status.type}`}>{status.msg}</div>
          )}

          <div className="form-input-group">
            <label htmlFor="start_date">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-input-group">
            <label htmlFor="end_date">End Date</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="generate-button"
            disabled={status.type === "loading"}
            onClick={createRipple}
          >
            {status.type === "loading" ? "Generating..." : "Generate Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportsGenerate;