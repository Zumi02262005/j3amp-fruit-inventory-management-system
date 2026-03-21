const bcrypt = require("bcrypt");
const { promisePool } = require("../config/database");
const { logActivity } = require("../utils/logger");

// ---- ADMIN: Get all users ----
const getAllUsers = async (req, res) => {
  try {
    const [users] = await promisePool.execute(
      `SELECT user_id, username, full_name, email, phone, role, status, created_at, last_login
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Get single user by ID ----
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await promisePool.execute(
      `SELECT user_id, username, full_name, email, phone, role, status, created_at, last_login
       FROM users WHERE user_id = ?`,
      [id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Create new user ----
const createUser = async (req, res) => {
  try {
    const { username, password, full_name, email, phone, role } = req.body;

    if (!username || !password || !full_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, password, full name, email, and role are required",
      });
    }

    // Check if username or email already exists
    const [existing] = await promisePool.execute(
      "SELECT user_id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await promisePool.execute(
      `INSERT INTO users (username, password, full_name, email, phone, role, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [username, hashedPassword, full_name, email, phone || null, role, req.user.userId]
    );

    await logActivity(
      req.user.userId,
      "USER_CREATED",
      `Admin created new user: ${username} with role: ${role}`
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { userId: result.insertId },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Update any user ----
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, full_name, email, phone, role, status } = req.body;

    const [existing] = await promisePool.execute(
      "SELECT user_id, username FROM users WHERE user_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if new username is taken by another user
    if (username && username !== existing[0].username) {
      const [taken] = await promisePool.execute(
        "SELECT user_id FROM users WHERE username = ? AND user_id != ?",
        [username, id]
      );
      if (taken.length > 0) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }
    }

    await promisePool.execute(
      `UPDATE users SET username = ?, full_name = ?, email = ?, phone = ?, role = ?, status = ?
       WHERE user_id = ?`,
      [username || existing[0].username, full_name, email, phone || null, role, status, id]
    );

    await logActivity(
      req.user.userId,
      "USER_UPDATED",
      `Admin updated user: ${existing[0].username}${username && username !== existing[0].username ? ` → ${username}` : ""}`
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Deactivate user ----
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const [existing] = await promisePool.execute(
      "SELECT user_id, username FROM users WHERE user_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await promisePool.execute(
      'UPDATE users SET status = "inactive" WHERE user_id = ?',
      [id]
    );

    await logActivity(
      req.user.userId,
      "USER_DEACTIVATED",
      `Admin deactivated user: ${existing[0].username}`
    );

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Reactivate user ----
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await promisePool.execute(
      "SELECT user_id, username FROM users WHERE user_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await promisePool.execute(
      'UPDATE users SET status = "active" WHERE user_id = ?',
      [id]
    );

    await logActivity(
      req.user.userId,
      "USER_REACTIVATED",
      `Admin reactivated user: ${existing[0].username}`
    );

    res.json({ success: true, message: "User reactivated successfully" });
  } catch (error) {
    console.error("Reactivate user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Reset another user's password ----
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const [existing] = await promisePool.execute(
      "SELECT user_id, username FROM users WHERE user_id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await promisePool.execute(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, id]
    );

    await logActivity(
      req.user.userId,
      "PASSWORD_RESET",
      `Admin reset password for user: ${existing[0].username}`
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ADMIN: Get activity logs for a specific user ----
const getUserActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await promisePool.execute(
      `SELECT * FROM activity_logs WHERE user_id = ?
      ORDER BY log_date DESC LIMIT ${limit} OFFSET ${offset}`,
      [id]
    );

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get user activity logs error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ANY USER: View own profile ----
const getOwnProfile = async (req, res) => {
  try {
    const [users] = await promisePool.execute(
      `SELECT user_id, username, full_name, email, phone, role, status, last_login, created_at
       FROM users WHERE user_id = ?`,
      [req.user.userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error("Get own profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ANY USER: Update own profile ----
const updateOwnProfile = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: "Full name and email are required" });
    }

    await promisePool.execute(
      "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE user_id = ?",
      [full_name, email, phone || null, req.user.userId]
    );

    await logActivity(
      req.user.userId,
      "PROFILE_UPDATED",
      `User updated their own profile`
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update own profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ANY USER: Change own password ----
const changeOwnPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    const [users] = await promisePool.execute(
      "SELECT password FROM users WHERE user_id = ?",
      [req.user.userId]
    );

    const isPasswordValid = await bcrypt.compare(current_password, users[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await promisePool.execute(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, req.user.userId]
    );

    await logActivity(
      req.user.userId,
      "PASSWORD_CHANGED",
      `User changed their own password`
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---- ANY USER: View own activity logs ----
const getOwnActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await promisePool.execute(
      `SELECT * FROM activity_logs WHERE user_id = ?
      ORDER BY log_date DESC LIMIT ${limit} OFFSET ${offset}`,
      [req.user.userId]
    );

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get own activity logs error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
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
};