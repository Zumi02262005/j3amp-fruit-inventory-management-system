//logger.jsx
//This module contains the functionalities regarding activity logging
const { promisePool } = require("../config/database");

// Inserts a new activity log into the database or falls back to console logging if the database query fails
const logActivity = async (userId, action, details) => {
  try {
    await promisePool.execute(
      `INSERT INTO activity_logs (user_id, action, details) 
       VALUES (?, ?, ?)`,
      [userId, action, details],
    );
    console.log(
      `📝 Activity logged: ${action} for user ${userId || "unknown"}`,
    );
  } catch (error) {
    console.warn("⚠️ Failed to log activity to database:", error.message);
    console.log(`📝 Activity (console only): ${action} - ${details}`);
  }
};

// Retrieves the 10 most recent activity logs across the system for admin viewing
const recentActivity = async (req, res) => {
  if (!req.user || req.user.role !== 'admin'){
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }
  try {
    const query = `
    SELECT a.log_id, a.action, a.details, a.log_date,
           COALESCE(u.username, 'Deleted User') AS username
    FROM activity_logs a
    LEFT JOIN users u ON a.user_id = u.user_id
    ORDER BY a.log_date DESC 
    LIMIT 10
    `;

    const [activity_logs] = await promisePool.execute(query);

    res.json({
      success: true,
      data: activity_logs,
    });
  } catch (error) {
    console.error("View recent activity error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Retrieves the 10 most recent stock receiving logs for a specific user
const recentReceipts = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  const { role, userId } = req.user;
  const targetUserId = req.params.userId || userId;

  if (role !== 'admin' && parseInt(targetUserId) !== parseInt(userId)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  try {
    const [rows] = await promisePool.execute(
      `SELECT log_id, user_id, action, details, log_date
       FROM activity_logs
       WHERE action = 'RECEIVE STOCK'
       AND user_id = ?
       ORDER BY log_date DESC
       LIMIT 10`,
      [targetUserId]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("Recent receipts error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Retrieves the complete history of activity logs across the system for admin viewing
const allActivities = async (req, res) => {
  if (!req.user || req.user.role !== 'admin'){
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }
  try {
    const query = `
    SELECT a.log_id, a.user_id, a.action, a.details, a.log_date 
    FROM activity_logs a 
    ORDER BY a.log_date DESC 
    `;

    const [all_logs] = await promisePool.execute(query);

    res.json({
      success: true,
      data: all_logs,
    });
  } catch (error) {
    console.error("View recent activity error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

// Retrieves the 10 most recent stock dispatching logs for a specific user
const recentDispatches = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { role, userId } = req.user;
  const targetUserId = req.params.userId || userId;

  if (role !== 'admin' && parseInt(targetUserId) !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const [rows] = await promisePool.execute(
      `SELECT log_id, user_id, action, details, log_date
       FROM activity_logs
       WHERE action = 'DISPATCH STOCK'
       AND user_id = ?
       ORDER BY log_date DESC
       LIMIT 10`,
      [targetUserId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Recent dispatches error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Retrieves the comprehensive details of a specific activity log entry by its ID
const logsDetails = async (req, res) => {
  try {
    const { log_id } = req.params;
    if (!log_id) {
      return res.status(400).json({ success: false, message: "log_id parameter is required" });
    }

    const [rows] = await promisePool.execute(
      `SELECT a.log_id, a.action, a.details, a.log_date,
              COALESCE(u.username, 'Deleted User') AS username
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.user_id
       WHERE a.log_id = ?`,
      [log_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Log details error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  logActivity,
  recentActivity,
  recentReceipts,
  recentDispatches,
  allActivities,
  logsDetails,
};