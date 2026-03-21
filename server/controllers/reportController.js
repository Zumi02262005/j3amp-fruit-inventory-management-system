const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");

// ---- Generate Report ----
const generateReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;
    const userId = req.user.userId;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "start_date and end_date are required",
      });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "start_date must not be later than end_date",
      });
    }

    // Gross Sales = total quantity dispatched in range
    const [[{ gross_sales }]] = await promisePool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS gross_sales
       FROM transactions
       WHERE transaction_type = 'dispatch'
       AND DATE(transaction_date) BETWEEN ? AND ?`,
      [start_date, end_date]
    );

    // Deliveries = total quantity received in range
    const [[{ deliveries }]] = await promisePool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS deliveries
       FROM transactions
       WHERE transaction_type = 'receive'
       AND DATE(transaction_date) BETWEEN ? AND ?`,
      [start_date, end_date]
    );

    // Ending Inventory = reconstruct stock at end_date
    // = current active stock + dispatches after end_date - receipts after end_date
    const [[{ current_stock }]] = await promisePool.execute(
      `SELECT COALESCE(SUM(remaining_quantity), 0) AS current_stock
       FROM batches
       WHERE status = 'active'`
    );

    const [[{ dispatches_after }]] = await promisePool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS dispatches_after
       FROM transactions
       WHERE transaction_type = 'dispatch'
       AND DATE(transaction_date) > ?`,
      [end_date]
    );

    const [[{ receipts_after }]] = await promisePool.execute(
      `SELECT COALESCE(SUM(quantity), 0) AS receipts_after
       FROM transactions
       WHERE transaction_type = 'receive'
       AND DATE(transaction_date) > ?`,
      [end_date]
    );

    const ending_inventory =
      parseFloat(current_stock) +
      parseFloat(dispatches_after) -
      parseFloat(receipts_after);

    // Beginning Inventory = ending - deliveries + gross_sales
    const beginning_inventory =
      ending_inventory - parseFloat(deliveries) + parseFloat(gross_sales);

    // Stock Difference = ending - beginning
    const stock_difference = ending_inventory - beginning_inventory;

    // Average Offtake = gross_sales / number of days in range
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)
      ) + 1
    );
    const average_offtake = parseFloat(gross_sales) / days;

    const [result] = await promisePool.execute(
      `INSERT INTO reports 
        (start_date, end_date, gross_sales, beginning_inventory, ending_inventory, deliveries, stock_difference, average_offtake, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        start_date,
        end_date,
        gross_sales,
        beginning_inventory,
        ending_inventory,
        deliveries,
        stock_difference,
        average_offtake,
        userId,
      ]
    );

    await logActivity(
      userId,
      "REPORT_GENERATED",
      `Admin generated report from ${start_date} to ${end_date}`
    );

    res.status(201).json({
      success: true,
      message: "Report generated successfully",
      data: { report_id: result.insertId },
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Get All Reports ----
const getAllReports = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        r.report_id,
        r.start_date,
        r.end_date,
        r.gross_sales,
        r.beginning_inventory,
        r.ending_inventory,
        r.deliveries,
        r.stock_difference,
        r.average_offtake,
        r.created_at,
        COALESCE(u.username, 'Deleted User') AS created_by_username
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.user_id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Get Single Report ----
const getReport = async (req, res) => {
  try {
    const { report_id } = req.params;

    const [[report]] = await promisePool.execute(
      `SELECT 
        r.*,
        COALESCE(u.username, 'Deleted User') AS created_by_username
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.user_id
       WHERE r.report_id = ?`,
      [report_id]
    );

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Get Transactions within Report's Date Range (for View Full Report) ----
const getReportTransactions = async (req, res) => {
  try {
    const { report_id } = req.params;

    const [[report]] = await promisePool.execute(
      `SELECT start_date, end_date FROM reports WHERE report_id = ?`,
      [report_id]
    );

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const [transactions] = await promisePool.execute(
      `SELECT
        t.transaction_id,
        t.transaction_type,
        t.sku,
        t.batch_id,
        t.quantity,
        t.destination,
        t.supplier,
        t.notes,
        t.transaction_date,
        COALESCE(u.username, 'Deleted User') AS username,
        COALESCE(i.product_name, t.sku) AS product_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.user_id
       LEFT JOIN inventory i ON t.sku = i.sku
       WHERE DATE(t.transaction_date) BETWEEN ? AND ?
       ORDER BY t.transaction_date DESC`,
      [report.start_date, report.end_date]
    );

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Get report transactions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Update Report ----
const updateReport = async (req, res) => {
  try {
    const { report_id } = req.params;
    const {
      gross_sales,
      beginning_inventory,
      ending_inventory,
      deliveries,
      stock_difference,
      average_offtake,
    } = req.body;

    const [existing] = await promisePool.execute(
      `SELECT report_id FROM reports WHERE report_id = ?`,
      [report_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    await promisePool.execute(
      `UPDATE reports
       SET gross_sales = ?,
           beginning_inventory = ?,
           ending_inventory = ?,
           deliveries = ?,
           stock_difference = ?,
           average_offtake = ?
       WHERE report_id = ?`,
      [
        gross_sales,
        beginning_inventory,
        ending_inventory,
        deliveries,
        stock_difference,
        average_offtake,
        report_id,
      ]
    );

    await logActivity(
      req.user.userId,
      "REPORT_UPDATED",
      `Admin updated report #${report_id}`
    );

    res.json({ success: true, message: "Report updated successfully" });
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- Delete Report ----
const deleteReport = async (req, res) => {
  try {
    const { report_id } = req.params;

    const [existing] = await promisePool.execute(
      `SELECT report_id FROM reports WHERE report_id = ?`,
      [report_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    await promisePool.execute(`DELETE FROM reports WHERE report_id = ?`, [report_id]);

    await logActivity(
      req.user.userId,
      "REPORT_DELETED",
      `Admin deleted report #${report_id}`
    );

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  generateReport,
  getAllReports,
  getReport,
  getReportTransactions,
  updateReport,
  deleteReport,
};