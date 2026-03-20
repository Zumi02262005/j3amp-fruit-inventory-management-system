const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { recentActivity, recentReceipts, recentDispatches, allActivities, logsDetails} = require("../utils/logger");

router.get("/recent-activity", authenticateToken, recentActivity);
router.get("/recent-receipts", authenticateToken, recentReceipts);
router.get("/recent-dispatches", authenticateToken, recentDispatches);
router.get("/all-activities", authenticateToken, allActivities);
router.get("/logs-details", authenticateToken, logsDetails);

module.exports = router;