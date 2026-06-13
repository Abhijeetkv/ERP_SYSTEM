const inventoryService = require('../services/inventoryService');

/**
 * GET /api/stock-ledger
 */
const getStockLedger = async (req, res) => {
  try {
    const { productId, movementType, startDate, endDate, reference } = req.query;

    const filters = {};
    if (productId) filters.productId = parseInt(productId);
    if (movementType) filters.movementType = movementType;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (reference) filters.reference = reference;

    const ledger = await inventoryService.getStockLedger(filters);
    return res.json({ success: true, data: ledger });
  } catch (error) {
    console.error('Get stock ledger error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stock ledger.' });
  }
};

/**
 * POST /api/stock-ledger/adjust
 */
const adjustStock = async (req, res) => {
  try {
    const result = await inventoryService.adjustStock({
      ...req.body,
      userId: req.user.id,
    });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Adjust stock error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to adjust stock.' });
  }
};

module.exports = { getStockLedger, adjustStock };
