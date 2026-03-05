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
DROP TABLE IF EXISTS inventory;
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

-- Inventory Table
CREATE TABLE inventory (
    sku VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    supplier VARCHAR(100) NOT NULL,
    reorder_point DECIMAL(10, 2) DEFAULT 50.00 NOT NULL,
    created_by INT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Batches Table
CREATE TABLE batches (
    batch_id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    remaining_quantity DECIMAL(10, 2) NOT NULL,
    expiration_date DATE NOT NULL,
    received_by INT NOT NULL,
    received_date DATE NOT NULL,
    supplier_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_status ENUM('passed', 'failed') NOT NULL DEFAULT 'passed',
    quality_notes TEXT,
    status ENUM('active', 'depleted', 'expired') DEFAULT 'active' NOT NULL,
    FOREIGN KEY (sku) REFERENCES inventory(sku) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX index_expiration (expiration_date),
    INDEX index_status (quality_status)
);

-- Transactions Table
CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_type ENUM('receive', 'dispatch', 'adjustment') NOT NULL,
    user_id INT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    batch_id INT,
    quantity DECIMAL(10, 2) NOT NULL,
    destination VARCHAR(100),
    supplier VARCHAR(100),
    notes TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (sku) REFERENCES inventory(sku) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL,
    INDEX index_date (transaction_date),
    INDEX index_type (transaction_type)
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX index_log_date (log_date),
    INDEX index_action (action)
);

-- Alerts Table
CREATE TABLE alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('low_stock', 'expiring', 'critical') NOT NULL,
    sku VARCHAR(50),
    batch_id INT,
    message TEXT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' NOT NULL,
    status ENUM('active', 'cleared') DEFAULT 'active' NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_at TIMESTAMP NULL,
    cleared_by INT NULL,
    FOREIGN KEY (sku) REFERENCES inventory(sku) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (cleared_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX index_status (status),
    INDEX index_type(alert_type)
);