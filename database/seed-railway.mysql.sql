-- J3AMP FRUIT INVENTORY MANAGEMENT SYSTEM
-- Created 2026-02-13
USE railway;

-- Insert Admin User
-- Username: admin
-- Password: Admin@123
INSERT INTO users(username, password, full_name, email, phone, role)
VALUES (
    'admin',
    '$2b$10$aneamSqn4nolaohGb7t.reyklfYUN0rFnnsMx0ERz1mDlqgZfqxi2',
    'System Administrator',
    'admin@j3amp.com',
    '1234567880',
    'admin'
);