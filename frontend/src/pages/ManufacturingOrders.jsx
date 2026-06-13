import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import { getManufacturingOrders } from '../api/manufacturing';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (value) => {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
};

const ManufacturingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getManufacturingOrders();
        setOrders(res.data.data || res.data);
      } catch (error) {
        console.error('Manufacturing orders load failed', error);
        toast.error('Failed to load manufacturing orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const columns = [
    { header: 'Order #', accessor: 'id' },
    { header: 'Product', accessor: 'product.name' },
    { header: 'Quantity', accessor: 'qty' },
    { header: 'Status', accessor: (item) => <StatusBadge status={item.status} /> },
    { header: 'BoM', accessor: 'bom.id' },
    { header: 'Assigned To', accessor: 'assignedTo.name' },
    { header: 'Created By', accessor: 'createdBy.name' },
    { header: 'Updated', accessor: (item) => formatDate(item.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Manufacturing Orders</h2>
          <p className="text-sm text-slate-500">Track manufacturing orders, production status, and assignment.</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={orders} emptyMessage="No manufacturing orders found." />
      )}
    </div>
  );
};

export default ManufacturingOrders;

