const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const salesController = require('../controllers/salesController');

// All routes require authentication and specific roles
router.use(authenticate);
router.use(authorize('ADMIN', 'SALES_USER', 'BUSINESS_OWNER'));

// GET /api/sales-orders
router.get('/', salesController.getAll);

// GET /api/sales-orders/:id
router.get('/:id', salesController.getById);

// POST /api/sales-orders
router.post('/', salesController.create);

// PUT /api/sales-orders/:id
router.put('/:id', salesController.update);

// DELETE /api/sales-orders/:id
router.delete('/:id', salesController.delete);

// POST /api/sales-orders/:id/confirm
router.post('/:id/confirm', salesController.confirm);

// POST /api/sales-orders/:id/deliver
router.post('/:id/deliver', salesController.deliver);

// POST /api/sales-orders/:id/cancel
router.post('/:id/cancel', salesController.cancel);

module.exports = router;
