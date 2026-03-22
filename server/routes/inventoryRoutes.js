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
  createSku,
  updateInventoryItem,
  deactivateSku,
  updateBatch,
  getNoStockCount,
  writeOffBatches,
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
router.get("/sku-dropdown", authenticateToken, getSkuDropdown);
router.get("/sku-dropdown/dispatch", authenticateToken, getSkuDropdownDispatch);
router.post("/auto-expire", authenticateToken, authorizeRole("admin"), autoExpireBatches);
router.post("/", authenticateToken, authorizeRole("admin"), createSku);
router.put("/:sku", authenticateToken, authorizeRole("admin"), updateInventoryItem);
router.patch("/:sku/deactivate", authenticateToken, authorizeRole("admin"), deactivateSku);
router.patch("/batches/:batch_id", authenticateToken, authorizeRole("admin"), updateBatch);
router.get("/no-stock", authenticateToken, getNoStockCount);
router.patch("/write-off", authenticateToken, authorizeRole("outbound", "admin"), writeOffBatches);

module.exports = router;