import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProducts } from '../api/products';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await getProducts();
        setProducts(res.data.data || res.data);
      } catch (error) {
        console.error('Products load failed', error);
        toast.error('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Category', accessor: 'category' },
    {
      header: 'Sales Price',
      accessor: (item) => `₹${Number(item.salesPrice ?? 0).toFixed(2)}`,
    },
    {
      header: 'Cost Price',
      accessor: (item) => `₹${Number(item.costPrice ?? 0).toFixed(2)}`,
    },
    { header: 'On Hand', accessor: 'onHandQty' },
    { header: 'Reserved', accessor: 'reservedQty' },
    {
      header: 'Procurement',
      accessor: (item) => `${item.procurementStrategy || '-'} / ${item.procurementType || '-'}`,
    },
    { header: 'Vendor', accessor: 'vendor.name' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Products</h2>
            <p className="text-sm text-slate-500">Browse products and inventory details.</p>
          </div>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={products} emptyMessage="No products found." />
      )}
    </div>
  );
};

export default Products;

