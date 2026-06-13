const prisma = require('../lib/prisma');

/**
 * GET /api/audit-logs
 */
const getAll = async (req, res) => {
  try {
    const { module, action, startDate, endDate } = req.query;

    const where = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        changedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
};

module.exports = { getAll };
