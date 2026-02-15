const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../config/database');
const { logActivity } = require('../utils/logger');

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const [users] = await promisePool.execute(
      'SELECT * FROM users WHERE username = ? AND status = "active"',
      [username]
    );

    if (users.length === 0) {
      // Log failed login attempt
      await logActivity(
        null,
        'LOGIN_FAILED',
        `Failed login attempt for username: ${username}`,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Log failed login attempt
      await logActivity(
        user.user_id,
        'LOGIN_FAILED',
        `Failed login attempt - incorrect password`,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await promisePool.execute(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Log successful login
    await logActivity(
      user.user_id,
      'LOGIN_SUCCESS',
      `User logged in successfully`,
      req.ip,
      req.headers['user-agent']
    );

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Log logout
    await logActivity(
      req.user.userId,
      'LOGOUT',
      `User logged out`,
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const [users] = await promisePool.execute(
      `SELECT user_id, username, full_name, email, phone, role, status, last_login 
       FROM users WHERE user_id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  logout,
  getCurrentUser
};