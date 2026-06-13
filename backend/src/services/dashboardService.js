const prisma = require('../lib/prisma');

/**
 * Get all dashboard data in a single call
 */
const getDashboardData = async () => {
  // Sales Orders by Status
  const salesOrdersByStatus = await prisma.salesOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  // Pending Deliveries
  const pendingDeliveries = await prisma.salesOrder.count({
    where: {
      status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] },
    },
  });

  // Purchase Orders by Status
  const purchaseOrdersByStatus = await prisma.purchaseOrder.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  // Pending Receipts
  const pendingReceipts = await prisma.purchaseOrder.count({
    where: {
      status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
    },
  });

  // Active Manufacturing Orders
  const activeManufacturingOrders = await prisma.manufacturingOrder.count({
    where: {
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
    },
  });

  // Low Stock Alerts
  const lowStockAlerts = await prisma.$queryRaw`
    SELECT id, name, sku, on_hand_qty as "onHandQty", reorder_point as "reorderPoint"
    FROM products
    WHERE on_hand_qty <= reorder_point
    ORDER BY on_hand_qty ASC
  `;

  // Recent Audit Logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      changedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return {
    salesOrdersByStatus: salesOrdersByStatus.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    pendingDeliveries,
    purchaseOrdersByStatus: purchaseOrdersByStatus.map((p) => ({
      status: p.status,
      count: p._count.id,
    })),
    pendingReceipts,
    activeManufacturingOrders,
    lowStockAlerts,
    recentAuditLogs,
  };
};

module.exports = { getDashboardData };
