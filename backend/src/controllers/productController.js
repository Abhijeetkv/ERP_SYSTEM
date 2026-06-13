const productService = require('../services/productService');

/**
 * GET /api/products
 */
const getAll = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
};

/**
 * GET /api/products/:id
 */
const getById = async (req, res) => {
  try {
    const product = await productService.getProductById(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch product.' });
  }
};

/**
 * POST /api/products
 */
const create = async (req, res) => {
  try {
    const product = await productService.createProduct({
      ...req.body,
      createdById: req.user.id,
    });
    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to create product.' });
  }
};

/**
 * PUT /api/products/:id
 */
const update = async (req, res) => {
  try {
    const product = await productService.updateProduct(parseInt(req.params.id), {
      ...req.body,
      userId: req.user.id,
    });
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to update product.' });
  }
};

/**
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const result = await productService.deleteProduct(parseInt(req.params.id), req.user.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(400).json({ success: false, error: error.message || 'Failed to delete product.' });
  }
};

module.exports = { getAll, getById, create, update, delete: deleteProduct };
