//transactionController.jsx
//This module contains the functionalities regarding dispatching and receiving stock
const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");
const { runAlertGeneration } = require("./alertController");

// Receive Stock
const receiveStock = async (req, res) => {
  const { sku, quantity, expiration_date, supplier_name, quality_notes } = req.body;
  const userId = req.user.userId;

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const [[product]] = await connection.execute(
      `SELECT product_name FROM inventory WHERE sku = ?`, [sku]
    );
    const productName = product?.product_name || sku;

    const [batchResult] = await connection.execute(
      `INSERT INTO batches 
       (sku, quantity, remaining_quantity, expiration_date, received_by, received_date, supplier_name, quality_notes) 
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
      [sku, quantity, quantity, expiration_date, userId, supplier_name, quality_notes || null]
    );

    const newBatchId = batchResult.insertId;

    await connection.execute(
      `INSERT INTO transactions 
       (transaction_type, user_id, sku, batch_id, quantity, supplier, notes) 
       VALUES ('receive', ?, ?, ?, ?, ?, ?)`,
      [userId, sku, newBatchId, quantity, supplier_name, `Initial stock receipt for batch ${newBatchId}`]
    );

    await logActivity(
      userId,
      "RECEIVE STOCK",
      `Received ${quantity} units of ${productName} (Batch ${newBatchId}) from ${supplier_name || "Unknown Supplier"}`
    );

    await connection.commit();
    await runAlertGeneration();

    res.status(201).json({
      success: true,
      message: "Stock received successfully",
      data: { batchId: newBatchId, sku, quantity },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Detailed SQL Error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to receive stock. Database rolled back",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Dispatch Stock — strictly per batch, quantity cannot exceed selected batch
const dispatchStock = async (req, res) => {
  const { sku, batch_id, client_name, quantity } = req.body;
  const userId = req.user.userId;
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const [[product]] = await connection.execute(
      `SELECT product_name FROM inventory WHERE sku = ?`, [sku]
    );
    const productName = product?.product_name || sku;

    // Get the selected batch
    const [requestedBatch] = await connection.execute(
      `SELECT batch_id, remaining_quantity, expiration_date 
       FROM batches WHERE batch_id = ? AND sku = ? AND status = 'active'`,
      [batch_id, sku]
    );

    if (requestedBatch.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Batch not found or already depleted.",
      });
    }

    const batchAvailable = parseFloat(requestedBatch[0].remaining_quantity);
    const requestedQty = parseFloat(quantity);

    // Validate against selected batch only
    if (requestedQty > batchAvailable) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in Batch #${batch_id}. Available: ${batchAvailable} kg. Requested: ${requestedQty} kg.`,
      });
    }

    const newQty = batchAvailable - requestedQty;

    await connection.execute(
      `UPDATE batches 
       SET remaining_quantity = ?, status = IF(? = 0, 'depleted', 'active') 
       WHERE batch_id = ?`,
      [newQty, newQty, batch_id]
    );

    await connection.execute(
      `INSERT INTO transactions 
       (transaction_type, user_id, sku, batch_id, quantity, destination, notes) 
       VALUES ('dispatch', ?, ?, ?, ?, ?, ?)`,
      [userId, sku, batch_id, requestedQty, client_name, `Dispatched from batch ${batch_id}`]
    );

    await logActivity(
      userId,
      "DISPATCH STOCK",
      `Dispatched ${requestedQty} units of ${productName} (Batch ${batch_id}) to ${client_name}`
    );

    await connection.commit();
    await runAlertGeneration();

    res.status(201).json({
      success: true,
      message: "Stock dispatched successfully",
      data: { batchId: batch_id, sku, quantity: requestedQty },
    });

  } catch (error) {
    await connection.rollback();
    console.error("Detailed SQL Error: ", error);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch stock. Database rolled back",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

//Gets all of the transactions
const getAllTransactions = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        t.user_id, t.sku, t.batch_id, t.quantity, t.transaction_date,
        COALESCE(u.username, 'Deleted User') AS username,
        COALESCE(i.product_name, t.sku) AS product_name,
        CASE WHEN t.destination IS NULL THEN t.supplier ELSE NULL END AS supplier,
        CASE WHEN t.supplier IS NULL THEN t.destination ELSE NULL END AS destination,
        t.notes
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN inventory i ON t.sku = i.sku
      ORDER BY t.transaction_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get all transactions error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getAllTransactions, receiveStock, dispatchStock };