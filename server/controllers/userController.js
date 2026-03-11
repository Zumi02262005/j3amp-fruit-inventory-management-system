const { promisePool } = require('../config/database');
const bcrypt = require('bcrypt'); // Added bcrypt import

// GET ALL USERS
const getAllUsers = async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve user list' });
    }
};

// CREATE USER
const createUser = async (req, res) => {
    const { username, password, email, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, and role are required" });
    }

    try {
        // Hash the password before saving it to the database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await promisePool.query(
            'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email || null, role, 'Active']
        );

        res.status(201).json({ success: true, message: "User created successfully" });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Username already exists" });
        }
        res.status(500).json({ success: false, message: "Server error during creation" });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, status } = req.body;

    try {
        const [result] = await promisePool.query(
            'UPDATE users SET username = ?, email = ?, role = ?, status = ? WHERE id = ?',
            [username, email, role, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: "Server error during update" });
    }
};

module.exports = { getAllUsers, createUser, updateUser };