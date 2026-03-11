const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Debugging logs to verify imports
console.log("DEBUG: Checking imports for userRoutes.js");
console.log("authenticateToken is:", typeof authenticateToken);
console.log("getAllUsers is:", typeof getAllUsers);
console.log("createUser is:", typeof createUser);
console.log("updateUser is:", typeof updateUser);

router.get('/', authenticateToken, getAllUsers);
router.post('/add', authenticateToken, createUser);
router.put('/:id', authenticateToken, updateUser);

module.exports = router;