const bcrypt = require("bcrypt");
const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");

// View Inventory
const viewInventory = async (req, res) => {
  try {
    const query = `
            SELECT 
                i.sku, 
                i.product_name, 
                i.category, 
                i.supplier,
                i.reorder_point,
                COALESCE(SUM(b.remaining_quantity), 0) AS total_stock
            FROM inventory i
            LEFT JOIN batches b ON i.sku = b.sku AND b.status = 'active'
            WHERE i.status = 'active'
            GROUP BY i.sku, i.product_name, i.category, i.supplier, i.reorder_point
        `;
    const [inventory] = await promisePool.execute(query);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error("View inventory error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getInventoryTotal = async (req, res) => {
  try {
    const [[{ grand_total }]] = await promisePool.execute(
      `SELECT SUM(remaining_quantity) AS grand_total FROM batches WHERE status = 'active'`
    );
    res.json({ success: true, data: grand_total });
  } catch (error) {
    console.error("Stock calculation error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getInventoryCategories = async (req, res) => {
  try {
    const [[{ total_categories }]] = await promisePool.execute(
      `SELECT COUNT(DISTINCT category) as total_categories FROM inventory WHERE status = 'active'`
    );
    res.json({ success: true, data: total_categories });
  } catch (error) {
    console.error("Category count error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getExpiringBatches = async (req, res) => {
  try {
    const [[{ expiring_count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS expiring_count 
      FROM batches 
      WHERE status = 'active' 
      AND expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
    );
    res.json({ success: true, data: expiring_count });
  } catch (error) {
    console.error("Expiring batches error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getLowStockQuantity = async (req, res) => {
  try {
    const [[{ low_stock_count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS low_stock_count FROM (
        SELECT inventory.sku, inventory.reorder_point,
        COALESCE(SUM(batches.remaining_quantity), 0) AS total_stock 
        FROM inventory 
        LEFT JOIN batches ON inventory.sku = batches.sku AND batches.status = 'active' 
        WHERE inventory.status = 'active' 
        GROUP BY inventory.sku, inventory.reorder_point 
        HAVING total_stock <= inventory.reorder_point OR total_stock IS NULL
      ) AS low_stock_items`
    );
    res.json({ success: true, data: low_stock_count });
  } catch (error) {
    console.error("Low stock count error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT inventory.sku, inventory.product_name, inventory.reorder_point,
        SUM(batches.remaining_quantity) AS total_stock
        FROM inventory
        LEFT JOIN batches ON inventory.sku = batches.sku AND batches.status = 'active'
        WHERE inventory.status = 'active'
        GROUP BY inventory.sku, inventory.product_name, inventory.reorder_point
        HAVING total_stock <= inventory.reorder_point OR total_stock IS NULL`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Low stock items error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getExpiringItems = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT batches.batch_id, batches.sku, batches.expiration_date, inventory.product_name 
      FROM batches 
      INNER JOIN inventory ON batches.sku = inventory.sku 
      WHERE DATEDIFF(expiration_date, CURDATE()) <= 7 
      AND batches.status = 'active'`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Expiring items error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getExpiredItems = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        batches.batch_id,
        batches.sku,
        batches.expiration_date,
        batches.remaining_quantity,
        batches.supplier_name,
        inventory.product_name,
        inventory.category
      FROM batches
      INNER JOIN inventory ON batches.sku = inventory.sku
      WHERE batches.status = 'expired'
      ORDER BY batches.expiration_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Expired items error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getExpiredCount = async (req, res) => {
  try {
    const [[{ expired_count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS expired_count FROM batches WHERE status = 'expired'`
    );
    res.json({ success: true, data: expired_count });
  } catch (error) {
    console.error("Expired count error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const runAutoExpire = async () => {
  try {
    const [result] = await promisePool.execute(
      `UPDATE batches 
       SET status = 'expired' 
       WHERE status = 'active' 
       AND expiration_date < CURDATE()`
    );
    console.log(`Auto-expire: ${result.affectedRows} batch(es) marked as expired`);
    return result.affectedRows;
  } catch (error) {
    console.error("Auto-expire error:", error);
    return 0;
  }
};

const autoExpireBatches = async (req, res) => {
  try {
    const expired = await runAutoExpire();
    res.json({
      success: true,
      message: `${expired} batch(es) marked as expired`,
      data: { expired },
    });
  } catch (error) {
    console.error("Auto-expire endpoint error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getBatches = async (req, res) => {
  try {
    const { sku } = req.params;
    if (!sku) {
      return res.status(400).json({ success: false, message: "SKU parameter is required" });
    }
    const [rows] = await promisePool.execute(
      `SELECT batches.batch_id, batches.sku, batches.expiration_date, 
      batches.remaining_quantity, batches.received_date, batches.supplier_name, 
      batches.received_by, inventory.product_name, inventory.category, 
      inventory.supplier, inventory.reorder_point 
      FROM batches 
      INNER JOIN inventory ON batches.sku = inventory.sku 
      WHERE inventory.status = 'active' AND batches.status = 'active' AND batches.sku = ?`,
      [sku]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Retrieving batches error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSkuDropdown = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT i.sku, i.product_name, i.category, i.reorder_point,
        COALESCE(SUM(b.remaining_quantity), 0) AS total_stock,
        MIN(b.expiration_date) AS nearest_expiry,
        DATEDIFF(MIN(b.expiration_date), CURDATE()) AS days_until_expiry,
        CASE WHEN COALESCE(SUM(b.remaining_quantity), 0) <= i.reorder_point THEN 1 ELSE 0 END AS is_low_stock,
        CASE WHEN MIN(b.expiration_date) IS NOT NULL AND DATEDIFF(MIN(b.expiration_date), CURDATE()) <= 7 THEN 1 ELSE 0 END AS is_expiring_soon
      FROM inventory i
      LEFT JOIN batches b ON i.sku = b.sku AND b.status = 'active'
      WHERE i.status = 'active'
      GROUP BY i.sku, i.product_name, i.category, i.reorder_point
      ORDER BY i.product_name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("SKU dropdown error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSkuDropdownDispatch = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT i.sku, i.product_name, i.category, i.reorder_point,
        COALESCE(SUM(b.remaining_quantity), 0) AS total_stock,
        MIN(b.expiration_date) AS nearest_expiry,
        DATEDIFF(MIN(b.expiration_date), CURDATE()) AS days_until_expiry,
        CASE WHEN COALESCE(SUM(b.remaining_quantity), 0) <= i.reorder_point THEN 1 ELSE 0 END AS is_low_stock,
        CASE WHEN MIN(b.expiration_date) IS NOT NULL AND DATEDIFF(MIN(b.expiration_date), CURDATE()) <= 7 THEN 1 ELSE 0 END AS is_expiring_soon
      FROM inventory i
      INNER JOIN batches b ON i.sku = b.sku AND b.status = 'active'
      WHERE i.status = 'active'
      GROUP BY i.sku, i.product_name, i.category, i.reorder_point
      HAVING total_stock > 0
      ORDER BY i.product_name ASC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("SKU dropdown dispatch error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Create new SKU ----
const createSku = async (req, res) => {
  try {
    const { sku, product_name, category, supplier, reorder_point } = req.body;

    if (!sku || !product_name || !category || !supplier) {
      return res.status(400).json({
        success: false,
        message: "SKU, product name, category, and supplier are required",
      });
    }

    const [existing] = await promisePool.execute(
      "SELECT sku FROM inventory WHERE sku = ?",
      [sku]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "SKU already exists" });
    }

    await promisePool.execute(
      `INSERT INTO inventory (sku, product_name, category, supplier, reorder_point, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [sku, product_name, category, supplier, reorder_point || 50.00, req.user.userId]
    );

    await logActivity(
      req.user.userId,
      "SKU_CREATED",
      `Admin created new SKU: ${sku} — ${product_name}`
    );

    res.status(201).json({ success: true, message: "SKU created successfully" });
  } catch (error) {
    console.error("Create SKU error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Update inventory item info ----
const updateInventoryItem = async (req, res) => {
  try {
    const { sku } = req.params;
    const { product_name, category, supplier, reorder_point } = req.body;

    if (!product_name || !category || !supplier) {
      return res.status(400).json({
        success: false,
        message: "Product name, category, and supplier are required",
      });
    }

    const [existing] = await promisePool.execute(
      "SELECT sku FROM inventory WHERE sku = ?",
      [sku]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "SKU not found" });
    }

    await promisePool.execute(
      `UPDATE inventory SET product_name = ?, category = ?, supplier = ?, reorder_point = ?
       WHERE sku = ?`,
      [product_name, category, supplier, reorder_point || 50.00, sku]
    );

    await logActivity(
      req.user.userId,
      "INVENTORY_UPDATED",
      `Admin updated inventory item: ${sku} — ${product_name}`
    );

    res.json({ success: true, message: "Inventory item updated successfully" });
  } catch (error) {
    console.error("Update inventory item error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Deactivate SKU ----
const deactivateSku = async (req, res) => {
  try {
    const { sku } = req.params;

    const [existing] = await promisePool.execute(
      "SELECT sku, product_name FROM inventory WHERE sku = ? AND status = 'active'",
      [sku]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "SKU not found or already inactive" });
    }

    await promisePool.execute(
      "UPDATE inventory SET status = 'inactive' WHERE sku = ?",
      [sku]
    );

    await logActivity(
      req.user.userId,
      "SKU_DEACTIVATED",
      `Admin deactivated SKU: ${sku} — ${existing[0].product_name}`
    );

    res.json({ success: true, message: "SKU deactivated successfully" });
  } catch (error) {
    console.error("Deactivate SKU error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Update full batch info ----
const updateBatch = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const { remaining_quantity, expiration_date, supplier_name } = req.body;

    if (remaining_quantity === undefined || !expiration_date || !supplier_name) {
      return res.status(400).json({
        success: false,
        message: "remaining_quantity, expiration_date, and supplier_name are required",
      });
    }

    const [existing] = await promisePool.execute(
      "SELECT batch_id, sku, remaining_quantity FROM batches WHERE batch_id = ?",
      [batch_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const newStatus = parseFloat(remaining_quantity) === 0 ? "depleted" : "active";

    await promisePool.execute(
      `UPDATE batches 
       SET remaining_quantity = ?, expiration_date = ?, supplier_name = ?, status = ?
       WHERE batch_id = ?`,
      [remaining_quantity, expiration_date, supplier_name, newStatus, batch_id]
    );

    await logActivity(
      req.user.userId,
      "BATCH_UPDATED",
      `Admin updated Batch #${batch_id} (SKU: ${existing[0].sku}) — qty: ${existing[0].remaining_quantity} → ${remaining_quantity}, expiry: ${expiration_date}, supplier: ${supplier_name}`
    );

    res.json({ success: true, message: "Batch updated successfully" });
  } catch (error) {
    console.error("Update batch error: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  viewInventory,
  getInventoryTotal,
  getInventoryCategories,
  getExpiringBatches,
  getLowStockQuantity,
  getLowStockItems,
  getExpiringItems,
  getExpiredItems,
  getExpiredCount,
  autoExpireBatches,
  runAutoExpire,
  getBatches,
  getSkuDropdown,
  getSkuDropdownDispatch,
  createSku,
  updateInventoryItem,
  deactivateSku,
  updateBatch,
};