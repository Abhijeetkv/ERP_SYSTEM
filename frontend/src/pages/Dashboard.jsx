import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiTruck,
  FiSettings,
  FiAlertTriangle,
  FiActivity,
  FiRefreshCw,
  FiPackage,
  FiClipboard,
  FiUsers,
  FiDollarSign,
  FiBox,
  FiTool,
  FiClock,
} from 'react-icons/fi';

// ─── Helpers ──────────────────────────────────────────────

const formatNumber = (num) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const moduleIcons = {
  SalesOrder: FiShoppingCart,
  PurchaseOrder: FiClipboard,
  Product: FiPackage,
  ManufacturingOrder: FiSettings,
  Vendor: FiUsers,
  Inventory: FiBox,
  BOM: FiTool,
  default: FiActivity,
};

const getModuleIcon = (module) => moduleIcons[module] || moduleIcons.default;

// ─── Stat Card Component ──────────────────────────────────

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-100',
      gradient: 'from-blue-500 to-blue-600',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      border: 'border-amber-100',
      gradient: 'from-amber-500 to-amber-600',
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      border: 'border-indigo-100',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-100',
      gradient: 'from-red-500 to-red-600',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="relative group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Gradient top border accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.gradient}`} />
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatNumber(value)}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`shrink-0 w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
};

// ─── Status Breakdown Card ────────────────────────────────

const StatusBreakdownCard = ({ title, icon: Icon, data }) => {
  if (!data || typeof data !== 'object') return null;

  const entries = Object.entries(data).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto text-xs text-gray-400 font-medium">{total} total</span>
      </div>
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <StatusBadge status={status} />
              <span className="text-sm font-semibold text-gray-700">{formatNumber(count)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">No orders found</p>
      )}
    </div>
  );
};

// ─── Main Dashboard Component ─────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      setData(res.data.data || res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ─── Empty / Error State ───
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <FiAlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">Unable to load dashboard data</p>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 text-sm transition-colors cursor-pointer"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalSalesOrders = 0,
    pendingDeliveries = 0,
    activeManufacturing = 0,
    lowStockCount = 0,
    salesByStatus = {},
    purchaseByStatus = {},
    lowStockItems = [],
    recentActivity = [],
  } = data;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 text-sm transition-colors self-start cursor-pointer"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales Orders"
          value={totalSalesOrders}
          icon={FiShoppingCart}
          color="blue"
        />
        <StatCard
          title="Pending Deliveries"
          value={pendingDeliveries}
          icon={FiTruck}
          color="amber"
        />
        <StatCard
          title="Active Manufacturing"
          value={activeManufacturing}
          icon={FiSettings}
          color="indigo"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={FiAlertTriangle}
          color="red"
          subtitle={lowStockCount > 0 ? 'Requires attention' : 'All stocked'}
        />
      </div>

      {/* ─── Status Breakdowns ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusBreakdownCard
          title="Sales Orders by Status"
          icon={FiShoppingCart}
          data={salesByStatus}
        />
        <StatusBreakdownCard
          title="Purchase Orders by Status"
          icon={FiClipboard}
          data={purchaseByStatus}
        />
      </div>

      {/* ─── Low Stock Alerts ─── */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FiAlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Low Stock Alerts</h3>
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                    On Hand
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                    Reorder Point
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowStockItems.map((item, idx) => {
                  const isCritical = (item.onHandQty ?? item.onHand ?? 0) <= (item.reorderPoint ?? 0);
                  return (
                    <tr
                      key={item._id || item.id || idx}
                      className={`hover:bg-gray-50 transition-colors ${isCritical ? 'bg-red-50/50' : 'even:bg-gray-50/50'}`}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {item.name || item.productName || '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                        {item.sku || '—'}
                      </td>
                      <td className={`px-6 py-3 text-right font-semibold ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatNumber(item.onHandQty ?? item.onHand ?? 0)}
                      </td>
                      <td className="px-6 py-3 text-right text-gray-500">
                        {formatNumber(item.reorderPoint ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Recent Activity Feed ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FiClock className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
        {recentActivity.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {recentActivity.slice(0, 20).map((log, idx) => {
              const IconComp = getModuleIcon(log.module);
              return (
                <div
                  key={log._id || log.id || idx}
                  className="px-6 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mt-0.5">
                    <IconComp className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.module?.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {' '}
                      <span className="text-gray-500">
                        {log.action?.toLowerCase().replace(/_/g, ' ')}
                      </span>
                      {log.documentId && (
                        <span className="text-gray-400 ml-1 font-mono text-xs">
                          #{typeof log.documentId === 'string' ? log.documentId.slice(-6) : log.documentId}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {log.userName || log.user?.name || 'System'}
                      </span>
                      <span className="text-gray-200">•</span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(log.createdAt || log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <FiActivity className="w-10 h-10 mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
