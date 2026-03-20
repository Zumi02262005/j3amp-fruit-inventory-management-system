const { promisePool } = require("../config/database");

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

const recentActivity = async (req, res) => {
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

module.exports = {
  logActivity,
  recentActivity,
  recentReceipts,
  recentDispatches,
  allActivities,
};
