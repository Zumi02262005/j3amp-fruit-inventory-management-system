// admin-logs.jsx
// This page displays the activity logs of the everyone, exclusive for the admin only
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI } from "../../services/api";
import "./admin-logs.css";

// --- Formatting Helpers ---
const fmt = (val) => parseFloat(val || 0).toFixed(2);
const fmtDate = (d) => new Date(d).toLocaleDateString();

const AdminLogs = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await transactionAPI.getAllTransactions();
        setTransactions(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve transactions: ", err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <div className="loader">Loading logs...</div>;

  return (
    <div className="logs-home-container page-with-navbar">
      <p className="logs-home-label">Logs</p>
      
      <div className="logs-content">
        <div className="recent-activity-admin">
          <p className="recent-activity-label">All Transactions</p>
          
          <div className="log-list">
            {transactions.length === 0 ? (
              <div className="log-card">
                <p><strong>No transactions found</strong></p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const type = transaction.destination ? "DISPATCH" : "RECEIVE";

                return (
                  <div className="log-card" key={transaction.transaction_id}>
                    <p className="log-action">{type}</p>
                    <ul className="log-details">
                      <li><strong>{transaction.product_name}</strong> — Batch {transaction.batch_id}</li>
                      <li>Quantity: {fmt(transaction.quantity)} kg</li>
                      <li>By: {transaction.username}</li>
                      {transaction.supplier && <li>Supplier: {transaction.supplier}</li>}
                      {transaction.destination && <li>Destination: {transaction.destination}</li>}
                      {transaction.notes && <li>{transaction.notes}</li>}
                      <li>{fmtDate(transaction.transaction_date)}</li>
                    </ul>
                    
                    <div className="view-details-container">
                      <span
                        className="view-details-link"
                        onClick={() => navigate(`/inventory/${transaction.sku}`)}
                      >
                        View Details &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;