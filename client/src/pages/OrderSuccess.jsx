import { Link, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useGetOrderQuery } from '../store/api/orderApi';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/format';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { data, isLoading } = useGetOrderQuery(orderId);
  const order = data?.order;

  if (isLoading) return <Loader className="py-24" size="lg" />;

  return (
    <div className="section py-12 md:py-16 max-w-2xl text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
        <CheckCircle2 className="text-green-600 w-9 h-9 md:w-11 md:h-11" />
      </div>
      <h1 className="text-2xl md:text-3xl font-serif mb-2">Thank you for your order!</h1>
      <p className="text-sm md:text-base text-brand-muted mb-6">
        Your order has been placed successfully. We'll send updates to your email.
      </p>

      {order && (
        <div className="card p-4 sm:p-6 text-left mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-brand-muted text-sm">Order Number</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-brand-muted text-sm">Total</span>
            <span className="font-medium">{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted text-sm">Payment</span>
            <span className="font-medium">{order.paymentMethod}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to={`/orders/${orderId}`} className="btn-primary">
          Track Order
        </Link>
        <Link to="/shop" className="btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
