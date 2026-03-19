const express = require("express");
const router = express.Router();
const {
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
  getBatches,
  getSkuDropdown,
  getSkuDropdownDispatch,
} = require("../controllers/inventoryController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, viewInventory);
router.get("/total", authenticateToken, getInventoryTotal);
router.get("/categories", authenticateToken, getInventoryCategories);
router.get("/expiring", authenticateToken, getExpiringBatches);
router.get("/low-stock", authenticateToken, getLowStockQuantity);
router.get("/low-stock-items", authenticateToken, getLowStockItems);
router.get("/expiring-items", authenticateToken, getExpiringItems);
router.get("/expired-items", authenticateToken, getExpiredItems);
router.get("/expired-count", authenticateToken, getExpiredCount);
router.get("/batches/:sku", authenticateToken, getBatches);
router.post("/auto-expire", authenticateToken, authorizeRole("admin"), autoExpireBatches);
router.get("/sku-dropdown", authenticateToken, getSkuDropdown);
router.get("/sku-dropdown/dispatch", authenticateToken, getSkuDropdownDispatch);

module.exports = router;