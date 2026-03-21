const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");
const {  generateReport,  getAllReports,  getReport,  getReportTransactions,  updateReport,  deleteReport   } = require("../controllers/reportController");

// All report routes are admin-only
router.get("/", authenticateToken, authorizeRole("admin"), getAllReports);
router.get("/:report_id", authenticateToken, authorizeRole("admin"), getReport);
router.get("/:report_id/transactions", authenticateToken, authorizeRole("admin"), getReportTransactions);
router.post("/generate", authenticateToken, authorizeRole("admin"), generateReport);
router.put("/:report_id", authenticateToken, authorizeRole("admin"), updateReport);
router.delete("/:report_id", authenticateToken, authorizeRole("admin"), deleteReport);

module.exports = router;