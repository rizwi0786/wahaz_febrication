import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useListAllOrdersQuery } from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import { StatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate, ORDER_STATUSES, orderStatusLabel } from '../../utils/format';

const STATUSES = ORDER_STATUSES;

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useListAllOrdersQuery({ search, status });

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const orders = data?.orders || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-serif">Orders</h1>
        <p className="text-sm text-brand-muted">{data?.total || 0} total</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order or customer..."
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{orderStatusLabel(s)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-brand-muted">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="font-medium text-brand-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{o.user?.name}</p>
                    <p className="text-xs text-brand-muted">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">{o.items?.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.orderStatus} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-brand-muted">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
