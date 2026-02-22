-- J3AMP Fruit Inventory Management System
-- Created 2026-02-13
-- Authors: Juan Carlos Pajarillo, Gabriel Manzano Gutierrez, Marc Kevin Katsuya, Joshua Lawrence Patron

-- Database Creation
USE railway;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Table Creation
-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role ENUM('admin', 'inbound', 'outbound') NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NULL,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 1. Create Products Table (Added 'status' or 'total_quantity' for your report)
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'In Stock', -- Your report uses this for quantity currently
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Batches Table (For the "Expiring Soon" report)
CREATE TABLE IF NOT EXISTS batches (
    batch_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    quantity INT NOT NULL,
    expiry_date DATE NOT NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 3. Create Activity Logs Table (Fixed the columns for your logger)
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);



