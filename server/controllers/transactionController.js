const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");
const { runAlertGeneration } = require("./alertController");

// Receive Stock
const receiveStock = async (req, res) => {
  const { sku, quantity, expiration_date, supplier_name, quality_notes } =
    req.body;
  const userId = req.user.userId;

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const batchQuery = `
            INSERT INTO batches 
            (sku, quantity, remaining_quantity, expiration_date, received_by, received_date, supplier_name, quality_notes) 
            VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?)`;

    const [batchResult] = await connection.execute(batchQuery, [
      sku,
      quantity,
      quantity,
      expiration_date,
      userId,
      supplier_name,
      quality_notes || null,
    ]);

    const newBatchId = batchResult.insertId;

    const transactionQuery = `
            INSERT INTO transactions 
            (transaction_type, user_id, sku, batch_id, quantity, supplier, notes) 
            VALUES ('receive', ?, ?, ?, ?, ?, ?)`;

    await connection.execute(transactionQuery, [
      userId,
      sku,
      newBatchId,
      quantity,
      supplier_name,
      `Initial stock receipt for batch ${newBatchId}`,
    ]);

    await logActivity(
      userId,
      "RECEIVE STOCK",
      `Received ${quantity} units of ${sku} (Batch: ${newBatchId})`,
    );

    await connection.commit();
    
    // Auto-generate alerts after stock change
    await runAlertGeneration();

    res.status(201).json({
      success: true,
      message: "Stock received successfully",
      data: { batchId: newBatchId, sku, quantity },
    });
  } catch (error) {
    await logActivity(
      userId,
      "RECEIVE STOCK",
      `Receiving ${quantity} units of ${sku} (Batch: ${newBatchId}) Failure`,
    );
    await connection.rollback();
    console.error("Detailed SQL Error: ", error); // Look at your terminal for this!
    res.status(500).json({
      success: false,
      message: "Failed to receive stock. Database rolled back",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

//Dispacth Stock
const dispatchStock = async (req, res) => {
  const { sku, batch_id, client_name, quantity } = req.body;
  const userId = req.user.userId;
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

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

    const [queue] = await connection.execute(
      `SELECT batch_id, remaining_quantity, expiration_date 
       FROM batches 
       WHERE sku = ? AND status = 'active' AND remaining_quantity > 0 
       AND (expiration_date > ? OR (expiration_date = ? AND batch_id = ?)) 
       ORDER BY expiration_date ASC, batch_id ASC`,
      [sku, requestedBatch[0].expiration_date, requestedBatch[0].expiration_date, batch_id]
    );

    const totalAvailable = queue.reduce((sum, b) => sum + parseFloat(b.remaining_quantity), 0); // ✅ fix #1
    if (totalAvailable < quantity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient Stock. Available: ${totalAvailable} kg across all batches for SKU ${sku}.`, // ✅ fix #1
      });
    }

    let remaining = parseFloat(quantity);
    for (const batch of queue) {
      if (remaining <= 0) break;

      const available = parseFloat(batch.remaining_quantity); // ✅ fix #2
      const toDeduct = Math.min(available, remaining);
      const newQty = available - toDeduct;

      await connection.execute( // ✅ fix #3
        `UPDATE batches 
         SET remaining_quantity = ?, status = IF(? = 0, 'depleted', 'active') 
         WHERE batch_id = ?`,
        [newQty, newQty, batch.batch_id]
      );

      await connection.execute(
        `INSERT INTO transactions 
         (transaction_type, user_id, sku, batch_id, quantity, destination, notes) 
         VALUES ('dispatch', ?, ?, ?, ?, ?, ?)`,
        [userId, sku, batch.batch_id, toDeduct, client_name, `Dispatched from batch ${batch.batch_id} for client ${client_name}`]
      );

      remaining -= toDeduct;
    }

    await logActivity(
      userId,
      "DISPATCH STOCK",
      `Dispatched ${quantity} units of ${sku} starting from Batch ${batch_id} (FIFO)`
    );

    await connection.commit();

    // Auto-generate alerts after stock change
    await runAlertGeneration();

    res.status(201).json({
      success: true,
      message: "Stock dispatched successfully",
      data: { startingBatchId: batch_id, sku, quantity },
    });

  } catch (error) {
    await logActivity(
      userId,
      "DISPATCH STOCK FAIL",
      `Dispatch ${quantity} units of ${sku} starting from Batch ${batch_id} Failure`
    );

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

module.exports = {
  receiveStock,
  dispatchStock,
};
