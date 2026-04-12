import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Package } from 'lucide-react';
import { useMyOrdersQuery } from '../store/api/orderApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../utils/format';
import { selectCurrentUser } from '../store/slices/authSlice';

export default function OrderHistory() {
  const currentUser = useSelector(selectCurrentUser);
  // Admins get the admin orders view instead of the customer "my orders".
  if (currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin/orders" replace />;
  }

  const { data, isLoading } = useMyOrdersQuery();
  if (isLoading) return <Loader className="py-24" size="lg" />;

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <div className="section py-12">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={<Link to="/shop" className="btn-primary">Start Shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="section py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`} className="card p-4 sm:p-5 block hover:shadow-lg transition">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</p>
                <p className="text-xs text-brand-muted">Placed on {formatDate(order.createdAt)}</p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={order.orderStatus} />
              </div>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto mb-3 scrollbar-none">
              {order.items.slice(0, 4).map((item) => (
                <img
                  key={item.id}
                  src={item.productImage}
                  alt={item.productName}
                  className="w-14 h-16 object-cover rounded shrink-0"
                />
              ))}
              {order.items.length > 4 && (
                <span className="text-xs text-brand-muted">+{order.items.length - 4} more</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-muted">{order.items.length} items</span>
              <span className="font-semibold">{formatCurrency(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
