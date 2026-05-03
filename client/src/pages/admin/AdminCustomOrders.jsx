import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminListCustomOrdersQuery } from '../../store/api/customOrderApi';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_OPTIONS = [
  '', 'PENDING_REVIEW', 'PRICE_QUOTED', 'COUNTER_OFFERED', 'APPROVED', 'REJECTED', 'CANCELLED', 'PAID',
];
const STATUS_CLS = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  PRICE_QUOTED: 'bg-blue-100 text-blue-700',
  COUNTER_OFFERED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
  PAID: 'bg-emerald-100 text-emerald-700',
};

export default function AdminCustomOrders() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAdminListCustomOrdersQuery({ status, search });

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const list = data?.customOrders || [];

  return (
    <div>
      <h1 className="text-2xl font-serif mb-5">Custom Orders</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Search by request#, name, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Request</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Quoted</th>
              <th className="text-left px-4 py-3">Counter</th>
              <th className="text-left px-4 py-3">Final</th>
              <th className="text-left px-4 py-3">Submitted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-brand-muted">No custom orders.</td></tr>
            )}
            {list.map((co) => (
              <tr key={co.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{co.requestNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{co.user?.name}</p>
                  <p className="text-xs text-brand-muted">{co.user?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLS[co.status] || 'bg-gray-100'}`}>
                    {co.status}
                  </span>
                </td>
                <td className="px-4 py-3">{co.adminQuotedPrice ? formatCurrency(co.adminQuotedPrice) : '—'}</td>
                <td className="px-4 py-3">{co.userCounterPrice ? formatCurrency(co.userCounterPrice) : '—'}</td>
                <td className="px-4 py-3">{co.finalPrice ? formatCurrency(co.finalPrice) : '—'}</td>
                <td className="px-4 py-3 text-xs text-brand-muted">{formatDate(co.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/custom-orders/${co.id}`} className="text-brand-secondary hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
