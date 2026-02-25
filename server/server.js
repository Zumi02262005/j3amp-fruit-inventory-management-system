// Main entry point for the Express server
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { promisePool, testConnection } = require('./config/database'); 
const authRoutes = require('./routes/authRoutes');

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

// START OF REPORTING SYSTEM 

// Total Stock Report 
app.get('/api/reports/total-stock', async (req, res) => {
    try {
        // This calculates the SUM of all batches for each fruit
        const [rows] = await promisePool.query(`
            SELECT 
                i.product_name as fruit_name, 
                SUM(b.remaining_quantity) as total_quantity 
            FROM inventory i
            LEFT JOIN batches b ON i.sku = b.sku
            GROUP BY i.sku
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching stock report", error: err.message });
    }
});

// Expiring Soon Report 
app.get('/api/reports/expiring-soon', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM batches WHERE expiration_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching expiring items", error: err.message });
    }
});

// Activity Logs
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


// INBOUND MODULE: RECEIVE STOCK 

app.post('/api/inventory/receive', async (req, res) => {
    const { sku, quantity, expiration_date, supplier_name, received_by } = req.body;

    try {
        // Create a new batch for this shipment
        await promisePool.query(
            'INSERT INTO batches (sku, quantity, remaining_quantity, expiration_date, supplier_name, received_by) VALUES (?, ?, ?, ?, ?, ?)',
            [sku, quantity, quantity, expiration_date, supplier_name, received_by]
        );

        // Log the activity
        await promisePool.query(
            'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
            [received_by, 'RECEIVE_STOCK', `Received ${quantity} units of ${sku}`]
        );

        res.json({ success: true, message: "Stock received and logged!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// Standard Routes
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
const startServer = async () => {
  try {
    await testConnection();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

startServer();