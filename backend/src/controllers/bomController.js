const bomService = require('../services/bomService');

/**
 * GET /api/boms
 */
const getAll = async (req, res) => {
  try {
    const boms = await bomService.getAllBoms();
    return res.json({ success: true, data: boms });
  } catch (error) {
    console.error('Get BoMs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch BoMs.' });
  }
};

/**
 * GET /api/boms/:id
 */
const getById = async (req, res) => {
  try {
    const bom = await bomService.getBomById(parseInt(req.params.id));
    if (!bom) {
      return res.status(404).json({ success: false, error: 'BoM not found.' });
    }
    return res.json({ success: true, data: bom });
  } catch (error) {
    console.error('Get BoM error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch BoM.' });
  }
};

/**
 * POST /api/boms
 */
const create = async (req, res) => {
  try {
    const { productId, notes, components, operations } = req.body;

    if (!productId || !components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and at least one component are required.',
      });
    }

    const bom = await bomService.createBom({
      productId,
      notes,
      components,
      operations: operations || [],
      userId: req.user.id,
    });

    return res.status(201).json({ success: true, data: bom });
  } catch (error) {
    console.error('Create BoM error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create BoM.' });
  }
};

/**
 * PUT /api/boms/:id
 */
const update = async (req, res) => {
  try {
    const bom = await bomService.updateBom(parseInt(req.params.id), {
      ...req.body,
      userId: req.user.id,
    });
    return res.json({ success: true, data: bom });
  } catch (error) {
    console.error('Update BoM error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to update BoM.' });
  }
};

/**
 * DELETE /api/boms/:id
 */
const deleteBom = async (req, res) => {
  try {
    const result = await bomService.deleteBom(parseInt(req.params.id), req.user.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Delete BoM error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to delete BoM.' });
  }
};

module.exports = { getAll, getById, create, update, delete: deleteBom };
