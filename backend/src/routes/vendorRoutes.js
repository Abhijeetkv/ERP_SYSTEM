const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const vendorController = require('../controllers/vendorController');

// All routes require authentication
router.use(authenticate);

// GET /api/vendors
router.get('/', vendorController.getAll);

// GET /api/vendors/:id
router.get('/:id', vendorController.getById);

// POST /api/vendors (Admin only)
router.post('/', authorize('ADMIN'), vendorController.create);

// PUT /api/vendors/:id (Admin only)
router.put('/:id', authorize('ADMIN'), vendorController.update);

// DELETE /api/vendors/:id (Admin only)
router.delete('/:id', authorize('ADMIN'), vendorController.delete);

module.exports = router;
