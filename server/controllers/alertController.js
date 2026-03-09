const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");

// ---- Get all active alerts ----
const getActiveAlerts = async (req, res) => {
  try {
    const [alerts] = await promisePool.execute(
      `SELECT 
        a.alert_id,
        a.alert_type,
        a.sku,
        a.batch_id,
        a.message,
        a.priority,
        a.status,
        a.triggered_at,
        i.product_name
       FROM alerts a
       LEFT JOIN inventory i ON a.sku = i.sku
       WHERE a.status = 'active'
       ORDER BY 
         FIELD(a.priority, 'critical', 'high', 'medium', 'low'),
         a.triggered_at DESC`
    );

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Get active alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Get all alerts (including cleared) ----
const getAllAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [alerts] = await promisePool.execute(
      `SELECT 
        a.alert_id,
        a.alert_type,
        a.sku,
        a.batch_id,
        a.message,
        a.priority,
        a.status,
        a.triggered_at,
        a.cleared_at,
        i.product_name,
        u.username AS cleared_by_username
       FROM alerts a
       LEFT JOIN inventory i ON a.sku = i.sku
       LEFT JOIN users u ON a.cleared_by = u.user_id
       ORDER BY a.triggered_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Get all alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Get alert count (for notification badge) ----
const getAlertCount = async (req, res) => {
  try {
    const [[{ count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS count FROM alerts WHERE status = 'active'`
    );

    res.json({ success: true, data: count });
  } catch (error) {
    console.error("Get alert count error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Clear a single alert ----
const clearAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await promisePool.execute(
      "SELECT alert_id FROM alerts WHERE alert_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    await promisePool.execute(
      `UPDATE alerts 
       SET status = 'cleared', cleared_at = NOW(), cleared_by = ?
       WHERE alert_id = ?`,
      [req.user.userId, id]
    );

    await logActivity(
      req.user.userId,
      "ALERT_CLEARED",
      `User cleared alert ID: ${id}`
    );

    res.json({ success: true, message: "Alert cleared successfully" });
  } catch (error) {
    console.error("Clear alert error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Clear all active alerts ----
const clearAllAlerts = async (req, res) => {
  try {
    await promisePool.execute(
      `UPDATE alerts 
       SET status = 'cleared', cleared_at = NOW(), cleared_by = ?
       WHERE status = 'active'`,
      [req.user.userId]
    );

    await logActivity(
      req.user.userId,
      "ALL_ALERTS_CLEARED",
      `User cleared all active alerts`
    );

    res.json({ success: true, message: "All alerts cleared successfully" });
  } catch (error) {
    console.error("Clear all alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Generate alerts (checks low stock + expiring batches) ----
// This is called automatically after receive/dispatch, or manually by admin
const generateAlerts = async (req, res) => {
  try {
    const generated = await runAlertGeneration();
    res.json({
      success: true,
      message: `${generated} new alert(s) generated`,
      data: { generated },
    });
  } catch (error) {
    console.error("Generate alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Core alert generation logic (reusable internally) ----
const runAlertGeneration = async () => {
  let generated = 0;

  // 1. Low stock alerts
  const [lowStockItems] = await promisePool.execute(
    `SELECT 
      i.sku,
      i.product_name,
      i.reorder_point,
      COALESCE(SUM(b.remaining_quantity), 0) AS total_stock
     FROM inventory i
     LEFT JOIN batches b ON i.sku = b.sku AND b.status = 'active'
     WHERE i.status = 'active'
     GROUP BY i.sku, i.product_name, i.reorder_point
     HAVING total_stock <= i.reorder_point OR total_stock IS NULL`
  );

  for (const item of lowStockItems) {
    // Avoid duplicate active alerts for same SKU
    const [existing] = await promisePool.execute(
      `SELECT alert_id FROM alerts 
       WHERE sku = ? AND alert_type = 'low_stock' AND status = 'active'`,
      [item.sku]
    );

    if (existing.length === 0) {
      const priority = item.total_stock === 0 ? "critical" : "high";
      await promisePool.execute(
        `INSERT INTO alerts (alert_type, sku, message, priority, status)
         VALUES ('low_stock', ?, ?, ?, 'active')`,
        [
          item.sku,
          `Low stock: ${item.product_name} has ${item.total_stock} units remaining (reorder point: ${item.reorder_point})`,
          priority,
        ]
      );
      generated++;
    }
  }

  // 2. Expiring batch alerts (within 7 days)
  const [expiringBatches] = await promisePool.execute(
    `SELECT 
      b.batch_id,
      b.sku,
      b.expiration_date,
      b.remaining_quantity,
      i.product_name,
      DATEDIFF(b.expiration_date, CURDATE()) AS days_until_expiry
     FROM batches b
     INNER JOIN inventory i ON b.sku = i.sku
     WHERE b.status = 'active'
     AND b.expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
  );

  for (const batch of expiringBatches) {
    // Avoid duplicate active alerts for same batch
    const [existing] = await promisePool.execute(
      `SELECT alert_id FROM alerts 
       WHERE batch_id = ? AND alert_type = 'expiring' AND status = 'active'`,
      [batch.batch_id]
    );

    if (existing.length === 0) {
      const priority = batch.days_until_expiry <= 2 ? "critical" : "medium";
      await promisePool.execute(
        `INSERT INTO alerts (alert_type, sku, batch_id, message, priority, status)
         VALUES ('expiring', ?, ?, ?, ?, 'active')`,
        [
          batch.sku,
          batch.batch_id,
          `Expiring soon: ${batch.product_name} (Batch #${batch.batch_id}) expires in ${batch.days_until_expiry} day(s) with ${batch.remaining_quantity} units remaining`,
          priority,
        ]
      );
      generated++;
    }
  }

  return generated;
};

module.exports = {
  getActiveAlerts,
  getAllAlerts,
  getAlertCount,
  clearAlert,
  clearAllAlerts,
  generateAlerts,
  runAlertGeneration,
};