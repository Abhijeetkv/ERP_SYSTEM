const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// All routes require authentication and specific roles
router.use(authenticate);
router.use(authorize('ADMIN', 'BUSINESS_OWNER'));

// GET /api/dashboard
router.get('/', dashboardController.getData);

module.exports = router;
