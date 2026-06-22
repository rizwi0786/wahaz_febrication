import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Download, Mail } from 'lucide-react';
import { useAdminListSubscribersQuery } from '../../store/api/newsletterApi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminNewsletter() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const token = useSelector((s) => s.auth.accessToken);

  const { data, isLoading, isFetching } = useAdminListSubscribersQuery({ search, page });

  const list = data?.subscribers || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/admin/newsletter/export`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter-subscribers.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not export the list');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <Loader className="py-24" size="lg" />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-serif flex items-center gap-2">
          <Mail size={22} /> Newsletter
        </h1>
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <p className="text-sm text-brand-muted mb-4">
        {total} active {total === 1 ? 'subscriber' : 'subscribers'} from the storefront newsletter.
      </p>

      <div className="mb-5">
        <input
          className="input max-w-sm"
          placeholder="Search by email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Subscribed</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-brand-muted">
                  No subscribers yet.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium break-all">{s.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Unsubscribed'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-brand-muted">{s.source || '—'}</td>
                <td className="px-4 py-3 text-xs">{formatDate(s.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 mt-4 text-sm">
          <button
            className="px-3 py-1 rounded border disabled:opacity-40"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-brand-muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border disabled:opacity-40"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
