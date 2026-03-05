// Main entry point for the Express server
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import database configuration
const { testConnection } = require("./config/database");
// Import routes
const authRoutes = require("./routes/authRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const logRoutes = require("./routes/logRoutes");

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "J3AMP Inventory Management System API",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// Use auth routes
app.use("/api/auth", authRoutes);
// Use inventory routes
app.use("/api/inventory", inventoryRoutes);
// Use transaction routes
app.use("/api/transactions", transactionRoutes);
// Use logs routes
app.use("/api/logs", logRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection FIRST
    await testConnection();

    // Start server AFTER database connects
    // ✅ dynamic — works everywhere
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
