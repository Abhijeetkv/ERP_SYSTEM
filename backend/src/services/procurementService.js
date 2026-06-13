const prisma = require('../lib/prisma');
const auditService = require('./auditService');

/**
 * Trigger procurement based on product type (PURCHASE or MANUFACTURING)
 */
const triggerProcurement = async ({ productId, qty, reference, userId }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      vendor: true,
      boms: {
        include: {
          operations: true,
        },
        take: 1,
      },
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  if (product.procurementType === 'PURCHASE') {
    // ─── AUTO-CREATE PURCHASE ORDER ───
    if (!product.vendorId || !product.vendor) {
      throw new Error(`Product "${product.name}" has no vendor assigned for auto-procurement.`);
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        vendorId: product.vendorId,
        status: 'CONFIRMED',
        createdById: userId,
        lines: {
          create: [
            {
              productId: product.id,
              qty,
              unitCost: product.costPrice,
            },
          ],
        },
      },
      include: {
        lines: { include: { product: true } },
        vendor: true,
      },
    });

    await auditService.createAuditLog({
      module: 'PROCUREMENT',
      action: 'AUTO_PURCHASE_ORDER',
      referenceId: po.id,
      changedById: userId,
      afterData: {
        purchaseOrderId: po.id,
        productId: product.id,
        productName: product.name,
        qty,
        reference,
      },
    });

    return {
      type: 'PURCHASE',
      orderId: po.id,
      message: `Auto-created PO #${po.id} for ${qty} units of ${product.name}`,
    };
  } else if (product.procurementType === 'MANUFACTURING') {
    // ─── AUTO-CREATE MANUFACTURING ORDER ───
    const bom = product.boms[0];
    if (!bom) {
      throw new Error(`Product "${product.name}" has no BoM defined for manufacturing.`);
    }

    const mo = await prisma.manufacturingOrder.create({
      data: {
        productId: product.id,
        qty,
        bomId: bom.id,
        status: 'DRAFT',
        createdById: userId,
        workOrders: {
          create: bom.operations.map((op) => ({
            operationName: op.name,
            workCenter: op.workCenter,
            durationMins: op.durationMins,
            status: 'PENDING',
          })),
        },
      },
      include: {
        product: true,
        bom: true,
        workOrders: true,
      },
    });

    await auditService.createAuditLog({
      module: 'PROCUREMENT',
      action: 'AUTO_MANUFACTURING_ORDER',
      referenceId: mo.id,
      changedById: userId,
      afterData: {
        manufacturingOrderId: mo.id,
        productId: product.id,
        productName: product.name,
        qty,
        bomId: bom.id,
        reference,
      },
    });

    return {
      type: 'MANUFACTURING',
      orderId: mo.id,
      message: `Auto-created MO #${mo.id} for ${qty} units of ${product.name}`,
    };
  }

  throw new Error(`Unknown procurement type: ${product.procurementType}`);
};

module.exports = { triggerProcurement };
