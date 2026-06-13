const prisma = require('../lib/prisma');

/**
 * GET /api/vendors
 */
const getAll = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { products: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch vendors.' });
  }
};

/**
 * GET /api/vendors/:id
 */
const getById = async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { products: true, purchaseOrders: true },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found.' });
    }

    return res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch vendor.' });
  }
};

/**
 * POST /api/vendors
 */
const create = async (req, res) => {
  try {
    const { name, contact, email } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Vendor name is required.' });
    }

    const vendor = await prisma.vendor.create({
      data: { name, contact, email },
    });

    return res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create vendor.' });
  }
};

/**
 * PUT /api/vendors/:id
 */
const update = async (req, res) => {
  try {
    const { name, contact, email } = req.body;

    const vendor = await prisma.vendor.update({
      where: { id: parseInt(req.params.id) },
      data: { name, contact, email },
    });

    return res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Update vendor error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Vendor not found.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to update vendor.' });
  }
};

/**
 * DELETE /api/vendors/:id
 */
const deleteVendor = async (req, res) => {
  try {
    await prisma.vendor.delete({
      where: { id: parseInt(req.params.id) },
    });

    return res.json({ success: true, data: { message: 'Vendor deleted successfully.' } });
  } catch (error) {
    console.error('Delete vendor error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Vendor not found.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to delete vendor.' });
  }
};

module.exports = { getAll, getById, create, update, delete: deleteVendor };
