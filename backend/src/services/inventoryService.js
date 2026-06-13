const prisma = require('../lib/prisma');
const auditService = require('./auditService');

/**
 * Create a stock ledger entry
 */
const createStockEntry = async ({ productId, movementType, qtyChange, reference, referenceType, createdById }) => {
  return prisma.stockLedger.create({
    data: {
      productId,
      movementType,
      qtyChange,
      reference: reference || null,
      referenceType: referenceType || null,
      createdById,
    },
    include: {
      product: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
};

/**
 * Get filtered stock ledger entries
 */
const getStockLedger = async (filters = {}) => {
  const where = {};

  if (filters.productId) {
    where.productId = parseInt(filters.productId);
  }

  if (filters.movementType) {
    where.movementType = filters.movementType;
  }

  if (filters.reference) {
    where.reference = { contains: filters.reference, mode: 'insensitive' };
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.createdAt.lte = new Date(filters.endDate);
    }
  }

  return prisma.stockLedger.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true, category: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Manual stock adjustment
 */
const adjustStock = async ({ productId, qtyChange, reason, userId }) => {
  return prisma.$transaction(async (tx) => {
    // Update product on-hand quantity
    await tx.product.update({
      where: { id: productId },
      data: {
        onHandQty: { increment: qtyChange },
      },
    });

    // Create stock ledger entry
    const stockEntry = await tx.stockLedger.create({
      data: {
        productId,
        movementType: 'ADJUSTMENT',
        qtyChange,
        reference: reason || 'Manual Adjustment',
        referenceType: 'ADJUSTMENT',
        createdById: userId,
      },
      include: {
        product: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        module: 'INVENTORY',
        action: 'ADJUSTMENT',
        referenceId: stockEntry.id,
        changedById: userId,
        afterData: { productId, qtyChange, reason },
      },
    });

    return stockEntry;
  });
};

module.exports = { createStockEntry, getStockLedger, adjustStock };
