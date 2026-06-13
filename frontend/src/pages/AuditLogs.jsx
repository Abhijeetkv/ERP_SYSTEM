import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAuditLogs } from '../api/audit';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';

const formatDate = (value) => {
  return value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await getAuditLogs();
        setLogs(res.data.data || res.data);
      } catch (error) {
        console.error('Audit logs load failed', error);
        toast.error('Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const columns = [
    { header: 'Module', accessor: 'module' },
    { header: 'Action', accessor: 'action' },
    { header: 'Reference ID', accessor: 'referenceId' },
    { header: 'Changed By', accessor: 'changedBy.name' },
    { header: 'Date', accessor: (item) => formatDate(item.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">View recent system activity and audit history.</p>
        </div>
      </div>
      {loading ? (
        <LoadingSpinner fullPage={false} />
      ) : (
        <DataTable columns={columns} data={logs} emptyMessage="No audit log entries found." />
      )}
    </div>
  );
};

export default AuditLogs;

