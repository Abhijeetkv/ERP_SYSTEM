import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getStockLedger } from '../api/inventory';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (value) => {
  return value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
};

const StockLedger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await getStockLedger();
        setEntries(res.data.data || res.data);
      } catch (error) {
        console.error('Stock ledger load failed', error);
        toast.error('Failed to load stock ledger.');
      } finally {
        setLoading(false);
      }
    };

    fetchLedger();
  }, []);

  const columns = [
    { header: 'Product', accessor: 'product.name' },
    { header: 'Type', accessor: 'movementType' },
    { header: 'Quantity', accessor: 'qtyChange' },
    { header: 'Reference', accessor: 'reference' },
    { header: 'Reference Type', accessor: 'referenceType' },
    { header: 'Created By', accessor: 'createdBy.name' },
    { header: 'Date', accessor: (item) => formatDate(item.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Stock Ledger</h2>
          <p className="text-sm text-slate-500">Review inventory movements and stock adjustments.</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={entries} emptyMessage="No stock ledger entries found." />
      )}
    </div>
  );
};

export default StockLedger;

