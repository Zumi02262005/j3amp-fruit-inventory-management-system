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
  if (req.user.role !== 'admin' || !req.user){
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

module.exports = { 
  logActivity,
  recentActivity,
};
