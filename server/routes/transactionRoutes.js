const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/authMiddleware");
const { receiveStock } = require("../controllers/transactionController");
const { dispatchStock } = require("../controllers/transactionController");

// Retrieve Transactions
router.get("/", authenticateToken);

// Receive Stock
router.post(
  "/receive",
  authenticateToken,
  authorizeRole("inbound"),
  receiveStock,
);

// Dispatch Stock
router.post(
  "/dispatch",
  authenticateToken,
  authorizeRole("outbound"),
  dispatchStock
);

module.exports = router;
