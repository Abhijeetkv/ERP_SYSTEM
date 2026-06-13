const prisma = require('../lib/prisma');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({ module, action, referenceId, changedById, beforeData, afterData }) => {
  return prisma.auditLog.create({
    data: {
      module,
      action,
      referenceId: referenceId || null,
      changedById,
      beforeData: beforeData || null,
      afterData: afterData || null,
    },
  });
};

module.exports = { createAuditLog };
