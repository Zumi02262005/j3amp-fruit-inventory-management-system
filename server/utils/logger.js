const { promisePool } = require('../config/database');

const logActivity = async (userId, action, details, ipAddress, userAgent) => {
  try {
    // Check if activity_logs table exists
    // If not, just log to console (we'll create table in Phase 2)
    await promisePool.execute(
      `INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, action, details, ipAddress || 'unknown', userAgent || 'unknown']
    );
    console.log(`📝 Activity logged: ${action} for user ${userId || 'unknown'}`);
  } catch (error) {
    // Don't crash if logging fails - just log to console
    console.warn('⚠️ Failed to log activity to database:', error.message);
    console.log(`📝 Activity (console only): ${action} - ${details}`);
  }
};

module.exports = { logActivity };