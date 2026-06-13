const prisma = require('../lib/prisma');
const auditService = require('./auditService');

const bomIncludes = {
  product: true,
  components: {
    include: {
      componentProduct: true,
    },
  },
  operations: true,
};

/**
 * Get all BoMs
 */
const getAllBoms = async () => {
  return prisma.bom.findMany({
    include: bomIncludes,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get single BoM by ID
 */
const getBomById = async (id) => {
  return prisma.bom.findUnique({
    where: { id },
    include: bomIncludes,
  });
};

/**
 * Create a new BoM with components and operations
 */
const createBom = async ({ productId, notes, components, operations, userId }) => {
  const bom = await prisma.bom.create({
    data: {
      productId,
      notes: notes || null,
      components: {
        create: components.map((comp) => ({
          componentProductId: comp.componentProductId,
          qty: comp.qty,
        })),
      },
      operations: {
        create: (operations || []).map((op) => ({
          name: op.name,
          durationMins: op.durationMins,
          workCenter: op.workCenter,
        })),
      },
    },
    include: bomIncludes,
  });

  await auditService.createAuditLog({
    module: 'BOM',
    action: 'CREATE',
    referenceId: bom.id,
    changedById: userId,
    afterData: { productId, notes, components, operations },
  });

  return bom;
};

/**
 * Update a BoM — replace components and operations if provided
 */
const updateBom = async (id, data) => {
  return prisma.$transaction(async (tx) => {
    // Update bom fields
    const updateData = {};
    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (Object.keys(updateData).length > 0) {
      await tx.bom.update({
        where: { id },
        data: updateData,
      });
    }

    // Replace components if provided
    if (data.components) {
      await tx.bomComponent.deleteMany({ where: { bomId: id } });
      await tx.bomComponent.createMany({
        data: data.components.map((comp) => ({
          bomId: id,
          componentProductId: comp.componentProductId,
          qty: comp.qty,
        })),
      });
    }

    // Replace operations if provided
    if (data.operations) {
      await tx.bomOperation.deleteMany({ where: { bomId: id } });
      await tx.bomOperation.createMany({
        data: data.operations.map((op) => ({
          bomId: id,
          name: op.name,
          durationMins: op.durationMins,
          workCenter: op.workCenter,
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        module: 'BOM',
        action: 'UPDATE',
        referenceId: id,
        changedById: data.userId,
        afterData: data,
      },
    });

    return tx.bom.findUnique({
      where: { id },
      include: bomIncludes,
    });
  });
};

/**
 * Delete a BoM (cascade deletes components and operations)
 */
const deleteBom = async (id, userId) => {
  const existing = await prisma.bom.findUnique({ where: { id } });
  if (!existing) throw new Error('BoM not found.');

  await prisma.$transaction(async (tx) => {
    await tx.bom.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        module: 'BOM',
        action: 'DELETE',
        referenceId: id,
        changedById: userId,
        beforeData: existing,
      },
    });
  });

  return { message: 'BoM deleted successfully.' };
};

module.exports = {
  getAllBoms,
  getBomById,
  createBom,
  updateBom,
  deleteBom,
};
