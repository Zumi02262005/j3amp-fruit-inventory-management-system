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
router.get("/active", getActiveAlerts);       // get active alerts (filtered by role)
router.get("/count", getAlertCount);          // get count for badge (filtered by role)

// ---- Admin only ----
router.get("/", authorizeRole("admin"), getAllAlerts);
router.post("/generate", authorizeRole("admin"), generateAlerts);
router.patch("/:id/clear", authorizeRole("admin"), clearAlert);       // clear single alert
router.patch("/clear-all", authorizeRole("admin"), clearAllAlerts);   // clear all (clears only their role's alerts)

module.exports = router;