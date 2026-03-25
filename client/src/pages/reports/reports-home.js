// reports-home.jsx
// This page displays the two reports functions the admin can access: generate reports and view reports.
import React from "react";
import { useNavigate } from "react-router-dom";
import generateReportIcon from "../../assets/icons/generate_report_icon.svg";
import viewReportIcon from "../../assets/icons/view_inventory_icon.svg";
import "./reports-home.css";

const ReportsHome = () => {
  const navigate = useNavigate();

  // Configuration array for report menu options
  // Makes it easy to add new report features later without duplicating JSX
  const menuOptions = [
    {
      title: "Generate Report",
      desc: "Create a new report for a date range",
      icon: generateReportIcon,
      path: "/reports/generate",
    },
    {
      title: "View Reports",
      desc: "Browse, edit, export, or delete reports",
      icon: viewReportIcon,
      path: "/reports/view",
    },
  ];

  return (
    <div className="reports-home-container page-with-navbar">
      
      {/* Header section */}
      <div className="reports-home-header">
        <p className="reports-home-label">Reports</p>
      </div>

      {/* Render menu options dynamically */}
      <div className="reports-home-content">
        {menuOptions.map((option, index) => (
          <button
            key={index}
            className="reports-home-card"
            onClick={() => navigate(option.path)}
          >
            <img src={option.icon} alt={option.title} className="reports-home-card-icon" />
            <div className="reports-home-card-text">
              <span className="reports-home-card-title">{option.title}</span>
              <span className="reports-home-card-desc">{option.desc}</span>
            </div>
          </button>
        ))}
      </div>
      
    </div>
  );
};

export default ReportsHome;