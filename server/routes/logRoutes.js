const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { recentActivity } = require("../utils/logger");

router.get("/recent-activity", authenticateToken, recentActivity);

module.exports = router;