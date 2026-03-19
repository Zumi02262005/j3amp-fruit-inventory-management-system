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

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("View inventory error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getInventoryTotal = async (req, res) => {
  try {
    const query = `
    SELECT SUM(remaining_quantity) AS grand_total 
    FROM batches 
    WHERE status = 'active'
    `;

    const [[{ grand_total }]] = await promisePool.execute(query);

    res.json({
      success: true,
      data: grand_total,
    });
  } catch (error) {
    console.error("Stock calculation error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getInventoryCategories = async (req, res) => {
  try {
    const [[{ total_categories }]] = await promisePool.execute(
      `SELECT COUNT(DISTINCT category) as total_categories 
      FROM inventory 
      WHERE status = 'active'`,
    );

    res.json({
      success: true,
      data: total_categories,
    });
  } catch (error) {
    console.error("Category count error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getExpiringBatches = async (req, res) => {
  try {
    const [[{ expiring_count }]] = await promisePool.execute(
      `SELECT COUNT(*) AS expiring_count 
      FROM batches 
      WHERE status = 'active' 
      AND expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
    );
    res.json({
      success: true,
      data: expiring_count,
    });
  } catch (error) {
    console.error("Expiring batches error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getLowStockQuantity = async (req, res) => {
  try {
    const [[{ low_stock_count}]] = await promisePool.execute(
      `SELECT COUNT(*) AS low_stock_count FROM (
      SELECT 
      inventory.sku,
      inventory.reorder_point,
      COALESCE(SUM(batches.remaining_quantity), 0) AS total_stock 
      FROM inventory 
      LEFT JOIN batches ON inventory.sku = batches.sku AND batches.status = 'active' 
      WHERE inventory.status = 'active' 
      GROUP BY inventory.sku, inventory.reorder_point 
      HAVING total_stock <= inventory.reorder_point OR total_stock IS NULL
      ) AS low_stock_items`
    );
    res.json({
      success: true,
      data: low_stock_count,
    });
  } catch (error) {
    console.error("Low stock count error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        inventory.sku,
        inventory.product_name,
        inventory.reorder_point,
        SUM(batches.remaining_quantity) AS total_stock
        FROM inventory
        LEFT JOIN batches ON inventory.sku = batches.sku AND batches.status = 'active'
        WHERE inventory.status = 'active'
        GROUP BY inventory.sku, inventory.product_name, inventory.reorder_point
        HAVING total_stock <= inventory.reorder_point OR total_stock IS NULL`,
    );
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Low stock items error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getExpiringItems = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
      batches.batch_id, 
      batches.sku, 
      batches.expiration_date, 
      inventory.product_name 
      FROM batches 
      INNER JOIN inventory ON batches.sku = inventory.sku 
      WHERE DATEDIFF(expiration_date, CURDATE()) <= 7 
      AND batches.status = 'active'`,
    );
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Expiring items error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getBatches = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU parameter is required for batch details",
      });
    }

    const [rows] = await promisePool.execute(
      `SELECT 
      batches.batch_id, 
      batches.sku, 
      batches.expiration_date, 
      batches.remaining_quantity, 
      batches.received_date, 
      batches.supplier_name, 
      batches.received_by, 
      inventory.product_name,
      inventory.category, 
      inventory.supplier, 
      inventory.reorder_point 
      FROM batches 
      INNER JOIN inventory ON batches.sku = inventory.sku 
      WHERE inventory.status = 'active' AND batches.status = 'active' AND batches.sku = ?
      `, [ sku ]
    );
    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Retrieving batches error: ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ---- SKU Dropdown (for dispatch and receive forms) ----
// Returns all active SKUs with stock status and expiry status for color coding
const getSkuDropdown = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT
        i.sku,
        i.product_name,
        i.category,
        i.reorder_point,
        COALESCE(SUM(b.remaining_quantity), 0) AS total_stock,
        MIN(b.expiration_date) AS nearest_expiry,
        DATEDIFF(MIN(b.expiration_date), CURDATE()) AS days_until_expiry,
        -- low_stock flag: true if total stock is at or below reorder point
        CASE 
          WHEN COALESCE(SUM(b.remaining_quantity), 0) <= i.reorder_point THEN 1
          ELSE 0
        END AS is_low_stock,
        -- expiring_soon flag: true if nearest batch expires within 7 days
        CASE
          WHEN MIN(b.expiration_date) IS NOT NULL 
            AND DATEDIFF(MIN(b.expiration_date), CURDATE()) <= 7 THEN 1
          ELSE 0
        END AS is_expiring_soon
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

// ---- SKU Dropdown for Dispatch only ----
// Same as above but only includes SKUs that actually have stock available
const getSkuDropdownDispatch = async (req, res) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT
        i.sku,
        i.product_name,
        i.category,
        i.reorder_point,
        COALESCE(SUM(b.remaining_quantity), 0) AS total_stock,
        MIN(b.expiration_date) AS nearest_expiry,
        DATEDIFF(MIN(b.expiration_date), CURDATE()) AS days_until_expiry,
        CASE 
          WHEN COALESCE(SUM(b.remaining_quantity), 0) <= i.reorder_point THEN 1
          ELSE 0
        END AS is_low_stock,
        CASE
          WHEN MIN(b.expiration_date) IS NOT NULL 
            AND DATEDIFF(MIN(b.expiration_date), CURDATE()) <= 7 THEN 1
          ELSE 0
        END AS is_expiring_soon
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

module.exports = {
  viewInventory,
  getInventoryTotal,
  getInventoryCategories,
  getExpiringBatches,
  getLowStockQuantity,
  getLowStockItems,
  getExpiringItems,
  getBatches,
  getSkuDropdown,
  getSkuDropdownDispatch,
};
