const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");

// ---- Outbound: Submit BO request ----
const submitBORequest = async (req, res) => {
  const { batch_id, sku, quantity, reason } = req.body;
  const userId = req.user.userId;

  if (!batch_id || !sku || !quantity || !reason) {
    return res.status(400).json({
      success: false,
      message: "batch_id, sku, quantity, and reason are required",
    });
  }

  try {
    // Verify batch exists and has enough stock
    const [batch] = await promisePool.execute(
      `SELECT batch_id, remaining_quantity, status FROM batches WHERE batch_id = ? AND sku = ?`,
      [batch_id, sku]
    );

    if (batch.length === 0) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    if (batch[0].status !== 'active' && batch[0].status !== 'expired') {
      return res.status(400).json({ success: false, message: "Batch is already depleted" });
    }

    if (parseFloat(quantity) > parseFloat(batch[0].remaining_quantity)) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock. Available: ${batch[0].remaining_quantity} kg`,
      });
    }

    // Check if there's already a pending request for this batch
    const [existing] = await promisePool.execute(
      `SELECT request_id FROM bo_requests WHERE batch_id = ? AND status = 'pending'`,
      [batch_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A pending request already exists for this batch",
      });
    }

    const [result] = await promisePool.execute(
      `INSERT INTO bo_requests (batch_id, sku, quantity, reason, requested_by)
       VALUES (?, ?, ?, ?, ?)`,
      [batch_id, sku, quantity, reason, userId]
    );

    await logActivity(
      userId,
      "BO_REQUEST_SUBMITTED",
      `Outbound submitted BO request for Batch #${batch_id} (${sku}) — ${quantity} kg. Reason: ${reason}`
    );

    res.status(201).json({
      success: true,
      message: "BO request submitted successfully. Awaiting admin approval.",
      data: { request_id: result.insertId },
    });
  } catch (error) {
    console.error("Submit BO request error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Admin: Get all BO requests ----
const getAllBORequests = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        r.request_id,
        r.batch_id,
        r.sku,
        r.quantity,
        r.reason,
        r.status,
        r.requested_at,
        r.resolved_at,
        i.product_name,
        COALESCE(u1.username, 'Deleted User') AS requested_by_username,
        COALESCE(u2.username, NULL) AS approved_by_username
       FROM bo_requests r
       LEFT JOIN inventory i ON r.sku = i.sku
       LEFT JOIN users u1 ON r.requested_by = u1.user_id
       LEFT JOIN users u2 ON r.approved_by = u2.user_id
       ORDER BY 
         FIELD(r.status, 'pending', 'approved', 'rejected'),
         r.requested_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get BO requests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Admin: Get pending BO request count (for badge) ----
const getPendingBOCount = async (req, res) => {
  try {
    const [[{ count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS count FROM bo_requests WHERE status = 'pending'`
    );
    res.json({ success: true, data: count });
  } catch (error) {
    console.error("Get pending BO count error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Admin: Approve BO request ----
const approveBORequest = async (req, res) => {
  const { request_id } = req.params;
  const adminId = req.user.userId;

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // Get request details
    const [requests] = await connection.execute(
      `SELECT * FROM bo_requests WHERE request_id = ? AND status = 'pending'`,
      [request_id]
    );

    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Request not found or already resolved",
      });
    }

    const request = requests[0];

    // Get current batch
    const [batches] = await connection.execute(
      `SELECT remaining_quantity, status FROM batches WHERE batch_id = ?`,
      [request.batch_id]
    );

    if (batches.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const currentQty = parseFloat(batches[0].remaining_quantity);
    const throwQty = parseFloat(request.quantity);

    if (throwQty > currentQty) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${currentQty} kg`,
      });
    }

    const newQty = currentQty - throwQty;
    const newStatus = newQty === 0 ? "depleted" : batches[0].status;

    // Deduct from batch
    await connection.execute(
      `UPDATE batches SET remaining_quantity = ?, status = ? WHERE batch_id = ?`,
      [newQty, newStatus, request.batch_id]
    );

    // Mark request as approved
    await connection.execute(
      `UPDATE bo_requests 
       SET status = 'approved', approved_by = ?, resolved_at = NOW()
       WHERE request_id = ?`,
      [adminId, request_id]
    );

    await logActivity(
      adminId,
      "BO_REQUEST_APPROVED",
      `Admin approved BO request #${request_id} — Batch #${request.batch_id} (${request.sku}): ${throwQty} kg thrown away. Reason: ${request.reason}`
    );

    await connection.commit();

    res.json({
      success: true,
      message: "BO request approved. Stock has been updated.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Approve BO request error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    connection.release();
  }
};

// ---- Admin: Reject BO request ----
const rejectBORequest = async (req, res) => {
  const { request_id } = req.params;
  const adminId = req.user.userId;

  try {
    const [requests] = await promisePool.execute(
      `SELECT * FROM bo_requests WHERE request_id = ? AND status = 'pending'`,
      [request_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Request not found or already resolved",
      });
    }

    await promisePool.execute(
      `UPDATE bo_requests SET status = 'rejected', approved_by = ?, resolved_at = NOW() WHERE request_id = ?`,
      [adminId, request_id]
    );

    await logActivity(
      adminId,
      "BO_REQUEST_REJECTED",
      `Admin rejected BO request #${request_id}`
    );

    res.json({ success: true, message: "BO request rejected." });
  } catch (error) {
    console.error("Reject BO request error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  submitBORequest,
  getAllBORequests,
  getPendingBOCount,
  approveBORequest,
  rejectBORequest,
};