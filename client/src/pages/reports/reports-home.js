import React from "react";
import { useNavigate } from "react-router-dom";
import generateReportIcon from "../../assets/icons/generate_report_icon.svg";
import viewReportIcon from "../../assets/icons/view_inventory_icon.svg";
import "./reports-home.css";

const ReportsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="reports-home-container page-with-navbar">
      <div className="reports-home-header">
        <p className="reports-home-label">Reports</p>
      </div>

      <div className="reports-home-content">
        <button
          className="reports-home-card"
          onClick={() => navigate("/reports/generate")}
        >
          <img src={generateReportIcon} alt="Generate Report" className="reports-home-card-icon" />
          <div className="reports-home-card-text">
            <span className="reports-home-card-title">Generate Report</span>
            <span className="reports-home-card-desc">Create a new report for a date range</span>
          </div>
        </button>

        <button
          className="reports-home-card"
          onClick={() => navigate("/reports/view")}
        >
          <img src={viewReportIcon} alt="View Reports" className="reports-home-card-icon" />
          <div className="reports-home-card-text">
            <span className="reports-home-card-title">View Reports</span>
            <span className="reports-home-card-desc">Browse, edit, export, or delete reports</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ReportsHome;