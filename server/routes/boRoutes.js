const express = require("express");
const router = express.Router();
const {
  submitBORequest,
  getAllBORequests,
  getPendingBOCount,
  approveBORequest,
  rejectBORequest,
} = require("../controllers/boController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

router.use(authenticateToken);

// ---- Outbound ----
router.post("/", authorizeRole("outbound"), submitBORequest);

// ---- Admin ----
router.get("/", authorizeRole("admin"), getAllBORequests);
router.get("/pending-count", authorizeRole("admin"), getPendingBOCount);
router.patch("/:request_id/approve", authorizeRole("admin"), approveBORequest);
router.patch("/:request_id/reject", authorizeRole("admin"), rejectBORequest);

module.exports = router;