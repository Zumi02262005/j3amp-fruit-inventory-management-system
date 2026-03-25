// reports-generate.jsx
// This page handles the generation of reports only accessible by the admin.
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../services/api";
import "./reports-generate.css";

// Hook to create a material-style ripple effect on buttons
const useRipple = () => useCallback((e) => {
  const btn = e.currentTarget;
  const circle = document.createElement("span");
  const rect = btn.getBoundingClientRect();
  
  circle.className = "ripple-circle";
  circle.style.left = `${e.clientX - rect.left}px`;
  circle.style.top  = `${e.clientY - rect.top}px`;
  
  btn.appendChild(circle);
  circle.addEventListener("animationend", () => circle.remove());
}, []);

const ReportsGenerate = () => {
  const navigate = useNavigate();
  const createRipple = useRipple();

  // State for form inputs and UI status
  const [formData, setFormData] = useState({ start_date: "", end_date: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });

  // Handle input changes and clear any existing status messages
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status.msg) setStatus({ type: "", msg: "" });
  };

  // Handle form submission, validation, and API call
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { start_date, end_date } = formData;

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return setStatus({ type: "error", msg: "Start date cannot be later than end date." });
    }

    setStatus({ type: "loading", msg: "Generating report..." });

    try {
      await reportsAPI.generateReport({ start_date, end_date });
      setStatus({ type: "success", msg: "Report generated successfully!" });
      setFormData({ start_date: "", end_date: "" });
      
      // Delay navigation so the user can see the success message
      setTimeout(() => navigate("/reports/view"), 1500);
    } catch (err) {
      setStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Failed to generate report. Please try again." 
      });
    }
  };

  // Configuration for date fields to keep JSX DRY
  const dateFields = [
    { name: "start_date", label: "Start Date" },
    { name: "end_date", label: "End Date" }
  ];

  const isLoading = status.type === "loading";

  return (
    <div className="reports-generate-container page-with-navbar">
      
      {/* Header section with back navigation */}
      <div className="reports-generate-header">
        <button className="reports-generate-back" onClick={() => navigate("/reports")}>
          ← Back to Reports
        </button>
        <p className="reports-generate-label">Generate Report</p>
      </div>

      <div className="form-wrapper">
        <form onSubmit={handleSubmit} className="reports-generate-form">
          
          {/* Status Message Display */}
          {status.msg && <div className={`status-message ${status.type}`}>{status.msg}</div>}

          {/* Dynamically render date inputs */}
          {dateFields.map(({ name, label }) => (
            <div className="form-input-group" key={name}>
              <label htmlFor={name}>{label}</label>
              <input
                type="date"
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="generate-button"
            disabled={isLoading}
            onClick={createRipple}
          >
            {isLoading ? "Generating..." : "Generate Report"}
          </button>
          
        </form>
      </div>
    </div>
  );
};

export default ReportsGenerate;