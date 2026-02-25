-- 1. Create the Products Table 
CREATE TABLE IF NOT EXISTS inventory (
    product_code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

-- 2. Create the Batches Table 
CREATE TABLE IF NOT EXISTS batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(50),
    quantity DECIMAL(10, 2) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    supplier_name VARCHAR(100),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES inventory(product_code)
);

-- 3. Create the Activity Logs Table 
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    action_type VARCHAR(100), -- e.g., 'STOCK_IN', 'STOCK_OUT', 'LOGIN'
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the Users Table 
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, 
    role ENUM('admin', 'inbound', 'outbound') NOT NULL
);

ALTER TABLE activity_logs ADD COLUMN ip_address VARCHAR(45) AFTER description;