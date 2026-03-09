const express = require("express");
const router = express.Router();
const { viewInventory, getInventoryTotal, getInventoryCategories, getExpiringBatches, getLowStockItems, getExpiringItems, getBatches, getSkuDropdown, getSkuDropdownDispatch, } = require("../controllers/inventoryController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Inventory routes
router.get("/", authenticateToken, viewInventory);
router.get("/total", authenticateToken, getInventoryTotal);
router.get("/categories", authenticateToken, getInventoryCategories);
router.get("/expiring", authenticateToken, getExpiringBatches);
router.get("/low-stock-items", authenticateToken, getLowStockItems);
router.get("/expiring-items", authenticateToken, getExpiringItems);
router.get("/batches/:sku", authenticateToken, getBatches);

// SKU Dropdown routes (for receive and dispatch forms)
router.get("/sku-dropdown", authenticateToken, getSkuDropdown);
router.get("/sku-dropdown/dispatch", authenticateToken, getSkuDropdownDispatch);

module.exports = router;
