-- J3AMP FRUIT INVENTORY MANAGEMENT SYSTEM
-- Created 2026-02-13
USE railway;

-- Insert Admin User
-- Username: admin
-- Password: Admin@123
INSERT INTO users(username, password, full_name, email, phone, role, status)
VALUES (
    'admin',
    '$2b$10$aneamSqn4nolaohGb7t.reyklfYUN0rFnnsMx0ERz1mDlqgZfqxi2',
    'System Administrator',
    'admin@j3amp.com',
    '1234567880',
    'admin',
    'active'
);

-- Insert Inbound User
-- Username: inbound_user
-- Password: Admin@123
INSERT INTO users(username, password, full_name, email, phone, role, status)
VALUES (
    'inbound_user',
    '$2b$10$aneamSqn4nolaohGb7t.reyklfYUN0rFnnsMx0ERz1mDlqgZfqxi2',
    'Inbound User',
    'inbound_user@j3amp.com',
    '1234567881',
    'inbound',
    'active'
);

INSERT INTO inventory(sku, product_name, category, supplier, reorder_point, created_by)
VALUES 
('55379', 'Pineapple', 'Tropical', 'Tropical Fruits Company', 50.00, 1),
('55380', 'B Saba', 'Tropical', 'Tropical Fruits Company', 100.00, 1);