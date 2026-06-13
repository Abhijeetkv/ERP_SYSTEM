const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/audit-logs
router.get('/', auditController.getAll);

module.exports = router;
