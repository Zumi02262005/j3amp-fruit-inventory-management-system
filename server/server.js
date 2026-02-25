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

// --- PHASE 2: INVENTORY & REPORTING SYSTEM ---

// 1. GET CURRENT INVENTORY (Matches your inventory & batches tables)
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT 
                i.product_code, 
                i.name, 
                b.supplier_name as supplier, 
                SUM(b.quantity) as stock_level, 
                i.status
            FROM inventory i
            LEFT JOIN batches b ON i.product_code = b.product_code
            GROUP BY i.product_code, i.name, b.supplier_name, i.status
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching inventory", error: err.message });
    }
});

// 2. RECEIVE STOCK (Matches your batches & activity_logs tables)
app.post('/api/inventory/receive', async (req, res) => {
    const { product_code, quantity, expiry_date, supplier_name, batch_number, user_id } = req.body;

    try {
        // Create new batch in 'batches' table
        await promisePool.query(
            'INSERT INTO batches (product_code, quantity, batch_number, expiry_date, supplier_name) VALUES (?, ?, ?, ?, ?)',
            [product_code, quantity, batch_number || `BAT-${Date.now()}`, expiry_date, supplier_name]
        );

        // Log the activity in 'activity_logs' table (Matches your action_type & description)
        await promisePool.query(
            'INSERT INTO activity_logs (user_id, action_type, description) VALUES (?, ?, ?)',
            [user_id || 'admin', 'STOCK_IN', `Received ${quantity} units of ${product_code}`]
        );

        res.json({ success: true, message: "Stock received and logged!" });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. REPORTS: Total Stock Summary
app.get('/api/reports/total-stock', async (req, res) => {
    try {
        const [rows] = await promisePool.query(`
            SELECT 
                i.name as fruit_name, 
                SUM(b.quantity) as total_quantity 
            FROM inventory i
            LEFT JOIN batches b ON i.product_code = b.product_code
            GROUP BY i.product_code, i.name
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error fetching stock report", error: err.message });
    }
});

// 4. REPORTS: Expiring Soon (Uses your 'expiry_date' column)
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

// --- END OF PHASE 2 ROUTES ---

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

// Global Error handler
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