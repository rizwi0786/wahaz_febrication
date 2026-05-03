import { Link } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import { useMyCustomOrdersQuery } from '../store/api/customOrderApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_LABEL = {
  PENDING_REVIEW: { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700' },
  PRICE_QUOTED: { label: 'Quote received', cls: 'bg-blue-100 text-blue-700' },
  COUNTER_OFFERED: { label: 'Counter sent', cls: 'bg-purple-100 text-purple-700' },
  APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-700' },
  PAID: { label: 'Order placed', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function MyCustomOrders() {
  const { data, isLoading } = useMyCustomOrdersQuery();
  if (isLoading) return <Loader className="py-24" size="lg" />;
  const list = data?.customOrders || [];

  if (list.length === 0) {
    return (
      <div className="section py-12">
        <EmptyState
          icon={Sparkles}
          title="No custom designs yet"
          description="Submit your design, get a price quote, and we'll craft it for you."
          action={<Link to="/custom-orders/new" className="btn-primary">Submit a design</Link>}
        />
      </div>
    );
  }

  return (
    <div className="section py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-serif">My Custom Designs</h1>
        <Link to="/custom-orders/new" className="btn-primary text-sm">
          <Plus size={16} /> New
        </Link>
      </div>
      <div className="space-y-4">
        {list.map((co) => {
          const meta = STATUS_LABEL[co.status] || { label: co.status, cls: 'bg-gray-100 text-gray-700' };
          return (
            <Link key={co.id} to={`/custom-orders/${co.id}`} className="card p-4 sm:p-5 block hover:shadow-lg transition">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{co.requestNumber}</p>
                  <p className="text-xs text-brand-muted">Submitted {formatDate(co.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto mb-3 scrollbar-none">
                {co.designImages.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="w-14 h-16 object-cover rounded shrink-0" />
                ))}
                {co.designImages.length > 4 && (
                  <span className="text-xs text-brand-muted">+{co.designImages.length - 4} more</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">Qty {co.quantity}</span>
                <span className="font-semibold">
                  {co.finalPrice
                    ? `Final: ${formatCurrency(co.finalPrice)}`
                    : co.adminQuotedPrice
                    ? `Quoted: ${formatCurrency(co.adminQuotedPrice)}`
                    : '—'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
