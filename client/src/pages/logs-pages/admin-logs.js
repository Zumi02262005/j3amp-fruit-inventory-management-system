import React, { useState, useEffect } from "react";
import { transactionAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "./admin-logs.css";

const LogCard = ({ transaction }) => {
  const navigate = useNavigate();
  const type = transaction.destination ? "DISPATCH" : "RECEIVE";

  return (
    <div className="log-card">
      <p className="log-action">{type}</p>
      <ul className="log-details">
        <li><strong>{transaction.sku}</strong> — Batch {transaction.batch_id}</li>
        <li>Quantity: {transaction.quantity} kg</li>
        <li>By: {transaction.username}</li>
        {transaction.supplier && <li>Supplier: {transaction.supplier}</li>}
        {transaction.destination && <li>Destination: {transaction.destination}</li>}
        {transaction.notes && <li>{transaction.notes}</li>}
        <li>{new Date(transaction.transaction_date).toLocaleDateString()}</li>
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
};

const AdminLogs = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await transactionAPI.getAllTransactions();
        setTransactions(response.data.data);
      } catch (err) {
        console.error("Failed to retrieve transactions: ", err);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, []);

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
              transactions.map((transaction) => (
                <LogCard key={transaction.transaction_id} transaction={transaction} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;