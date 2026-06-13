const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// All routes require authentication
router.use(authenticate);

// GET /api/products — all authenticated users
router.get('/', productController.getAll);

// GET /api/products/:id — all authenticated users
router.get('/:id', productController.getById);

// POST /api/products — ADMIN only
router.post('/', authorize('ADMIN'), productController.create);

// PUT /api/products/:id — ADMIN only
router.put('/:id', authorize('ADMIN'), productController.update);

// DELETE /api/products/:id — ADMIN only
router.delete('/:id', authorize('ADMIN'), productController.delete);

module.exports = router;
