const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

// All routes require authentication
router.use(authenticate);

// GET /api/stock-ledger — all authenticated users
router.get('/', inventoryController.getStockLedger);

// POST /api/stock-ledger/adjust — ADMIN, INVENTORY_MANAGER only
router.post('/adjust', authorize('ADMIN', 'INVENTORY_MANAGER'), inventoryController.adjustStock);

module.exports = router;
