import React from 'react';

const getValue = (item, path) => {
  if (!path) return item;
  return path.split('.').reduce((value, key) => value?.[key], item);
};

const DataTable = ({ columns, data, loading, emptyMessage = 'No records available.' }) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
        Loading data…
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full table-auto text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-3 whitespace-nowrap font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
          {data.map((item, index) => (
            <tr key={item.id || item.name || index} className="hover:bg-slate-50">
              {columns.map((column) => {
                const value = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : getValue(item, column.accessor);

                return (
                  <td key={column.header} className="px-4 py-4 align-middle">
                    {value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
