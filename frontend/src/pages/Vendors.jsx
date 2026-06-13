import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getVendors } from '../api/vendors';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await getVendors();
        setVendors(res.data.data || res.data);
      } catch (error) {
        console.error('Vendors load failed', error);
        toast.error('Failed to load vendors.');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Contact', accessor: 'contact' },
    { header: 'Email', accessor: 'email' },
    { header: 'Products', accessor: (item) => item.products?.length ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Vendors</h2>
          <p className="text-sm text-slate-500">View vendor details and supplier relationships.</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={vendors} emptyMessage="No vendors found." />
      )}
    </div>
  );
};

export default Vendors;

