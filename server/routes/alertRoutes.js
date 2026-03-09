const express = require("express");
const router = express.Router();
const {
  getActiveAlerts,
  getAllAlerts,
  getAlertCount,
  clearAlert,
  clearAllAlerts,
  generateAlerts,
} = require("../controllers/alertController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

// All routes require login
router.use(authenticateToken);

// ---- Any logged in user ----
router.get("/active", getActiveAlerts);         // get active alerts
router.get("/count", getAlertCount);            // get count for badge

// ---- Admin only ----
router.get("/", authorizeRole("admin"), getAllAlerts);                    // get all alerts including cleared
router.post("/generate", authorizeRole("admin"), generateAlerts);         // manually trigger alert generation
router.patch("/:id/clear", authorizeRole("admin"), clearAlert);           // clear single alert
router.patch("/clear-all", authorizeRole("admin"), clearAllAlerts);       // clear all alerts

module.exports = router;