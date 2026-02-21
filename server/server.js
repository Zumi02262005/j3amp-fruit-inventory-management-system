// Main entry point for the Express server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database configuration - Using promisePool to fix the await error
const { promisePool, testConnection } = require('./config/database'); 
const authRoutes = require('./routes/authRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// --- START OF REPORTING SYSTEM ---

// 1. Total Stock Report (Using 'products' table from schema)
app.get('/api/reports/total-stock', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT name as fruit_name, status as total_quantity FROM products'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching stock report", error: err.message });
    }
});

// 2. Expiring Soon Report (Using 'batches' table from schema)
app.get('/api/reports/expiring-soon', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM batches WHERE expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching expiring items", error: err.message });
    }
});

// 3. Activity Logs (Using 'activity_logs' and 'user_id' from schema)
app.get('/api/reports/activity', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT a.*, u.username FROM activity_logs a JOIN users u ON a.user_id = u.user_id ORDER BY a.created_at DESC LIMIT 10'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching activity", error: err.message });
    }
});

// --- END OF REPORTING SYSTEM ---

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'J3AMP Inventory Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
console.log("query type:", promisePool.query.constructor.name);