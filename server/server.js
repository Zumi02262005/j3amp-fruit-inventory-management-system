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
const userRoutes = require("./routes/userRoutes");
const alertRoutes = require("./routes/alertRoutes");

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

// Base Routes
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

// API Route Registration
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/users", userRoutes);
app.use("/api/alerts", alertRoutes);

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

// Start server configuration
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection FIRST
    await testConnection();

    // Start server AFTER database connects
    app.listen(PORT, () => {
      console.log(`Database connection successful!`);
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
