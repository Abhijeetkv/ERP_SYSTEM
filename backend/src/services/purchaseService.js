const prisma = require('../lib/prisma');
const auditService = require('./auditService');
const inventoryService = require('./inventoryService');

const poIncludes = {
  lines: {
    include: {
      product: true,
    },
  },
  vendor: true,
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
};

/**
 * Get all purchase orders
 */
const getAllPurchaseOrders = async () => {
  return prisma.purchaseOrder.findMany({
    include: poIncludes,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get single purchase order by ID
 */
const getPurchaseOrderById = async (id) => {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: poIncludes,
  });
};

/**
 * Create a new purchase order with lines
 */
const createPurchaseOrder = async ({ vendorId, lines, createdById }) => {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        vendorId,
        createdById,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            unitCost: line.unitCost,
          })),
        },
      },
      include: poIncludes,
    });

    await tx.auditLog.create({
      data: {
        module: 'PURCHASE',
        action: 'CREATE',
        referenceId: po.id,
        changedById: createdById,
        afterData: { vendorId, lines },
      },
    });

    return po;
  });
};

/**
 * Update a draft purchase order
 */
const updatePurchaseOrder = async (id, data) => {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!existing) throw new Error('Purchase order not found.');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT orders can be updated.');

  return prisma.$transaction(async (tx) => {
    const updateData = {};
    if (data.vendorId) updateData.vendorId = data.vendorId;

    if (Object.keys(updateData).length > 0) {
      await tx.purchaseOrder.update({
        where: { id },
        data: updateData,
      });
    }

    if (data.lines) {
      await tx.purchaseOrderLine.deleteMany({ where: { poId: id } });
      await tx.purchaseOrderLine.createMany({
        data: data.lines.map((line) => ({
          poId: id,
          productId: line.productId,
          qty: line.qty,
          unitCost: line.unitCost,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        module: 'PURCHASE',
        action: 'UPDATE',
        referenceId: id,
        changedById: data.userId || existing.createdById,
        beforeData: existing,
        afterData: data,
      },
    });

    return tx.purchaseOrder.findUnique({
      where: { id },
      include: poIncludes,
    });
  });
};

/**
 * Delete a draft purchase order
 */
const deletePurchaseOrder = async (id, userId) => {
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });

  if (!existing) throw new Error('Purchase order not found.');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT orders can be deleted.');

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        module: 'PURCHASE',
        action: 'DELETE',
        referenceId: id,
        changedById: userId || existing.createdById,
        beforeData: existing,
      },
    });
  });

  return { message: 'Purchase order deleted successfully.' };
};

/**
 * Confirm a purchase order
 */
const confirmPurchaseOrder = async (id, userId) => {
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });

  if (!existing) throw new Error('Purchase order not found.');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT orders can be confirmed.');

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    await tx.auditLog.create({
      data: {
        module: 'PURCHASE',
        action: 'CONFIRM',
        referenceId: id,
        changedById: userId,
        beforeData: { status: 'DRAFT' },
        afterData: { status: 'CONFIRMED' },
      },
    });
  });

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: poIncludes,
  });
};

/**
 * Receive purchase order lines (partial or full)
 */
const receivePurchaseOrder = async (id, receiveLines, userId) => {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } },
  });

  if (!po) throw new Error('Purchase order not found.');
  if (!['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status)) {
    throw new Error('Order must be CONFIRMED or PARTIALLY_RECEIVED to receive.');
  }

  await prisma.$transaction(async (tx) => {
    for (const { lineId, receiveQty } of receiveLines) {
      const line = po.lines.find((l) => l.id === lineId);
      if (!line) throw new Error(`Purchase order line ${lineId} not found.`);

      const remainingQty = line.qty - line.receivedQty;
      if (receiveQty > remainingQty) {
        throw new Error(
          `Cannot receive ${receiveQty} units for line ${lineId}. Remaining: ${remainingQty}`
        );
      }

      // Update received qty
      await tx.purchaseOrderLine.update({
        where: { id: lineId },
        data: { receivedQty: { increment: receiveQty } },
      });

      // Increase on-hand
      await tx.product.update({
        where: { id: line.productId },
        data: { onHandQty: { increment: receiveQty } },
      });

      // Stock ledger entry
      await tx.stockLedger.create({
        data: {
          productId: line.productId,
          movementType: 'PURCHASE_RECEIPT',
          qtyChange: receiveQty,
          reference: `PO-${id}`,
          referenceType: 'PURCHASE_ORDER',
          createdById: userId,
        },
      });
    }

    // Check if all lines fully received
    const updatedLines = await tx.purchaseOrderLine.findMany({ where: { poId: id } });
    const allReceived = updatedLines.every((l) => l.receivedQty >= l.qty);
    const newStatus = allReceived ? 'FULLY_RECEIVED' : 'PARTIALLY_RECEIVED';

    await tx.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
    });

    await tx.auditLog.create({
      data: {
        module: 'PURCHASE',
        action: 'RECEIVE',
        referenceId: id,
        changedById: userId,
        afterData: { receiveLines, newStatus },
      },
    });
  });

  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: poIncludes,
  });
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  confirmPurchaseOrder,
  receivePurchaseOrder,
};
