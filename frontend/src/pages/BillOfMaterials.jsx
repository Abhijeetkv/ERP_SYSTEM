import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getBOMs } from '../api/bom';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (value) => {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
};

const BillOfMaterials = () => {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBOMs = async () => {
      try {
        const res = await getBOMs();
        setBoms(res.data.data || res.data);
      } catch (error) {
        console.error('BoMs load failed', error);
        toast.error('Failed to load bill of materials.');
      } finally {
        setLoading(false);
      }
    };

    fetchBOMs();
  }, []);

  const columns = [
    { header: 'BoM #', accessor: 'id' },
    { header: 'Product', accessor: 'product.name' },
    { header: 'Notes', accessor: 'notes' },
    { header: 'Components', accessor: (item) => item.components?.length ?? 0 },
    { header: 'Operations', accessor: (item) => item.operations?.length ?? 0 },
    { header: 'Updated', accessor: (item) => formatDate(item.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Bill of Materials</h2>
          <p className="text-sm text-slate-500">View BoM definitions and component breakdowns.</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={boms} emptyMessage="No BoMs found." />
      )}
    </div>
  );
};

export default BillOfMaterials;

