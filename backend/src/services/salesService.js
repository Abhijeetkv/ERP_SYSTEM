const prisma = require('../lib/prisma');
const auditService = require('./auditService');
const inventoryService = require('./inventoryService');
const procurementService = require('./procurementService');

const soIncludes = {
  lines: {
    include: {
      product: true,
    },
  },
  createdBy: {
    select: { id: true, name: true, email: true, role: true },
  },
};

/**
 * Get all sales orders
 */
const getAllSalesOrders = async () => {
  return prisma.salesOrder.findMany({
    include: soIncludes,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get single sales order by ID
 */
const getSalesOrderById = async (id) => {
  return prisma.salesOrder.findUnique({
    where: { id },
    include: soIncludes,
  });
};

/**
 * Create a new sales order with lines
 */
const createSalesOrder = async ({ customerName, lines, createdById }) => {
  const order = await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.create({
      data: {
        customerName,
        createdById,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.unitPrice,
          })),
        },
      },
      include: soIncludes,
    });

    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'CREATE',
        referenceId: so.id,
        changedById: createdById,
        afterData: { customerName, lines },
      },
    });

    return so;
  });

  return order;
};

/**
 * Update a draft sales order
 */
const updateSalesOrder = async (id, data) => {
  const existing = await prisma.salesOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!existing) throw new Error('Sales order not found.');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT orders can be updated.');

  return prisma.$transaction(async (tx) => {
    // Update customer name if provided
    if (data.customerName) {
      await tx.salesOrder.update({
        where: { id },
        data: { customerName: data.customerName },
      });
    }

    // Replace lines if provided
    if (data.lines) {
      await tx.salesOrderLine.deleteMany({ where: { soId: id } });
      await tx.salesOrderLine.createMany({
        data: data.lines.map((line) => ({
          soId: id,
          productId: line.productId,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'UPDATE',
        referenceId: id,
        changedById: data.userId || existing.createdById,
        beforeData: existing,
        afterData: data,
      },
    });

    return tx.salesOrder.findUnique({
      where: { id },
      include: soIncludes,
    });
  });
};

/**
 * Delete a draft sales order
 */
const deleteSalesOrder = async (id, userId) => {
  const existing = await prisma.salesOrder.findUnique({ where: { id } });

  if (!existing) throw new Error('Sales order not found.');
  if (existing.status !== 'DRAFT') throw new Error('Only DRAFT orders can be deleted.');

  await prisma.$transaction(async (tx) => {
    await tx.salesOrder.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'DELETE',
        referenceId: id,
        changedById: userId || existing.createdById,
        beforeData: existing,
      },
    });
  });

  return { message: 'Sales order deleted successfully.' };
};

/**
 * Confirm a sales order — reserves stock, triggers procurement for MTO shortfalls
 */
const confirmSalesOrder = async (id, userId) => {
  // Phase 1: Validate and reserve stock within a transaction
  const so = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      lines: {
        include: { product: true },
      },
    },
  });

  if (!so) throw new Error('Sales order not found.');
  if (so.status !== 'DRAFT') throw new Error('Only DRAFT orders can be confirmed.');

  // Collect procurement needs
  const procurementNeeds = [];

  await prisma.$transaction(async (tx) => {
    for (const line of so.lines) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      const freeToUseQty = product.onHandQty - product.reservedQty;

      if (freeToUseQty >= line.qty) {
        // Sufficient stock — reserve
        await tx.product.update({
          where: { id: product.id },
          data: { reservedQty: { increment: line.qty } },
        });
      } else if (product.procurementStrategy === 'MTO') {
        // MTO — reserve what's available, procurement for shortfall
        if (freeToUseQty > 0) {
          await tx.product.update({
            where: { id: product.id },
            data: { reservedQty: { increment: freeToUseQty } },
          });
        }
        const shortfall = line.qty - freeToUseQty;
        procurementNeeds.push({
          productId: product.id,
          qty: shortfall,
        });
      } else {
        // MTS — insufficient stock error
        throw new Error(
          `Insufficient stock for product "${product.name}". Available: ${freeToUseQty}, Requested: ${line.qty}`
        );
      }
    }

    // Update status to CONFIRMED
    await tx.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });

    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'CONFIRM',
        referenceId: id,
        changedById: userId,
        afterData: { status: 'CONFIRMED' },
      },
    });
  });

  // Phase 2: Trigger procurement outside transaction
  const procurementNotifications = [];
  for (const need of procurementNeeds) {
    try {
      const result = await procurementService.triggerProcurement({
        productId: need.productId,
        qty: need.qty,
        reference: `SO-${id}`,
        userId,
      });
      procurementNotifications.push(result);
    } catch (error) {
      procurementNotifications.push({
        type: 'ERROR',
        productId: need.productId,
        message: error.message,
      });
    }
  }

  const updatedOrder = await prisma.salesOrder.findUnique({
    where: { id },
    include: soIncludes,
  });

  return { order: updatedOrder, procurementNotifications };
};

/**
 * Deliver sales order lines (partial or full)
 */
const deliverSalesOrder = async (id, deliveryLines, userId) => {
  const so = await prisma.salesOrder.findUnique({
    where: { id },
    include: { lines: { include: { product: true } } },
  });

  if (!so) throw new Error('Sales order not found.');
  if (!['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(so.status)) {
    throw new Error('Order must be CONFIRMED or PARTIALLY_DELIVERED to deliver.');
  }

  await prisma.$transaction(async (tx) => {
    for (const { lineId, deliverQty } of deliveryLines) {
      const line = so.lines.find((l) => l.id === lineId);
      if (!line) throw new Error(`Sales order line ${lineId} not found.`);

      const remainingQty = line.qty - line.deliveredQty;
      if (deliverQty > remainingQty) {
        throw new Error(
          `Cannot deliver ${deliverQty} units for line ${lineId}. Remaining: ${remainingQty}`
        );
      }

      // Update delivered qty
      await tx.salesOrderLine.update({
        where: { id: lineId },
        data: { deliveredQty: { increment: deliverQty } },
      });

      // Decrease on-hand and reserved
      await tx.product.update({
        where: { id: line.productId },
        data: {
          onHandQty: { decrement: deliverQty },
          reservedQty: { decrement: deliverQty },
        },
      });

      // Stock ledger entry
      await tx.stockLedger.create({
        data: {
          productId: line.productId,
          movementType: 'SALE',
          qtyChange: -deliverQty,
          reference: `SO-${id}`,
          referenceType: 'SALES_ORDER',
          createdById: userId,
        },
      });
    }

    // Check if all lines fully delivered
    const updatedLines = await tx.salesOrderLine.findMany({ where: { soId: id } });
    const allDelivered = updatedLines.every((l) => l.deliveredQty >= l.qty);
    const newStatus = allDelivered ? 'FULLY_DELIVERED' : 'PARTIALLY_DELIVERED';

    await tx.salesOrder.update({
      where: { id },
      data: { status: newStatus },
    });

    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'DELIVER',
        referenceId: id,
        changedById: userId,
        afterData: { deliveryLines, newStatus },
      },
    });
  });

  return prisma.salesOrder.findUnique({
    where: { id },
    include: soIncludes,
  });
};

/**
 * Cancel a sales order — releases reserved stock
 */
const cancelSalesOrder = async (id, userId) => {
  const so = await prisma.salesOrder.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!so) throw new Error('Sales order not found.');
  if (['CANCELLED', 'FULLY_DELIVERED'].includes(so.status)) {
    throw new Error('Cannot cancel a CANCELLED or FULLY_DELIVERED order.');
  }

  await prisma.$transaction(async (tx) => {
    for (const line of so.lines) {
      const unreserveQty = line.qty - line.deliveredQty;
      if (unreserveQty > 0) {
        await tx.product.update({
          where: { id: line.productId },
          data: { reservedQty: { decrement: unreserveQty } },
        });
      }
    }

    await tx.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await tx.auditLog.create({
      data: {
        module: 'SALES',
        action: 'CANCEL',
        referenceId: id,
        changedById: userId,
        beforeData: { status: so.status },
        afterData: { status: 'CANCELLED' },
      },
    });
  });

  return prisma.salesOrder.findUnique({
    where: { id },
    include: soIncludes,
  });
};

module.exports = {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  confirmSalesOrder,
  deliverSalesOrder,
  cancelSalesOrder,
};
