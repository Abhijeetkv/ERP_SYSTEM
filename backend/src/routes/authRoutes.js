const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe);

module.exports = router;
