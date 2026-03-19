const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { recentActivity, recentReceipts} = require("../utils/logger");

router.get("/recent-activity", authenticateToken, recentActivity);
router.get("/recent-receipts", authenticateToken, recentReceipts);

module.exports = router;