const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  getUserActivityLogs,
  getOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
  getOwnActivityLogs,
} = require("../controllers/userController");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

// All routes require login
router.use(authenticateToken);

// ---- Any logged in user ----
router.get("/profile/me", getOwnProfile);
router.put("/profile/me", updateOwnProfile);
router.patch("/profile/change-password", changeOwnPassword);
router.get("/profile/my-logs", getOwnActivityLogs);

// ---- Admin only ----
router.get("/", authorizeRole("admin"), getAllUsers);
router.get("/:id", authorizeRole("admin"), getUserById);
router.post("/", authorizeRole("admin"), createUser);
router.put("/:id", authorizeRole("admin"), updateUser);
router.patch("/:id/deactivate", authorizeRole("admin"), deactivateUser);
router.patch("/:id/reactivate", authorizeRole("admin"), reactivateUser);
router.patch("/:id/reset-password", authorizeRole("admin"), resetUserPassword);
router.get("/:id/logs", authorizeRole("admin"), getUserActivityLogs);

module.exports = router;