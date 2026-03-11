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
    user_id INT,
    action_type VARCHAR(100), 
    description TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the Users Table (Renamed 'id' to 'user_id' for code compatibility)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100), 
    password VARCHAR(255) NOT NULL, 
    role ENUM('admin', 'inbound', 'outbound') NOT NULL, 
    status ENUM('Active', 'Inactive') DEFAULT 'Active', 
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Data
INSERT INTO inventory (product_code, name, category, status) 
VALUES 
('APP-01', 'Red Apples', 'Pome', 'Active'),
('MNG-01', 'Carabao Mango', 'Tropical', 'Active');

