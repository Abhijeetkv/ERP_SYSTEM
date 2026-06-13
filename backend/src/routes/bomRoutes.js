const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const bomController = require('../controllers/bomController');

// All routes require authentication and specific roles
router.use(authenticate);
router.use(authorize('ADMIN', 'MANUFACTURING_USER', 'BUSINESS_OWNER'));

// GET /api/boms
router.get('/', bomController.getAll);

// GET /api/boms/:id
router.get('/:id', bomController.getById);

// POST /api/boms
router.post('/', bomController.create);

// PUT /api/boms/:id
router.put('/:id', bomController.update);

// DELETE /api/boms/:id
router.delete('/:id', bomController.delete);

module.exports = router;
