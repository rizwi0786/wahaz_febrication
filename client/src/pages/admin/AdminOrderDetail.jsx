import { useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminGetOrderQuery, useUpdateOrderStatusMutation } from '../../store/api/adminApi';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import { Select, Textarea } from '../../components/common/Input';
import { StatusBadge } from '../../components/common/Badge';
import {
  formatCurrency,
  formatDateTime,
  ORDER_STATUSES,
  orderStatusLabel,
} from '../../utils/format';

const STATUSES = ORDER_STATUSES;

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { data, isLoading } = useAdminGetOrderQuery(id);
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const [newStatus, setNewStatus] = useState('');
  const [message, setMessage] = useState('');

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const order = data?.order;
  if (!order) return <p className="text-center py-24">Order not found</p>;

  const handleUpdate = async () => {
    if (!newStatus) return;
    try {
      await updateStatus({ id, status: newStatus, message }).unwrap();
      toast.success('Status updated. Email sent to customer.');
      setNewStatus('');
      setMessage('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif">{order.orderNumber}</h1>
          <p className="text-sm text-brand-muted">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-5 border">
            <h3 className="font-serif text-lg mb-4">Items</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                  <img src={item.productImage} alt="" className="w-14 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-brand-muted">
                      {item.size} · {item.color} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border">
            <h3 className="font-serif text-lg mb-4">Customer & Shipping</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.user?.name}</p>
              <p className="text-brand-muted">{order.user?.email}</p>
              <p className="text-brand-muted">{order.user?.phone}</p>
              <div className="h-px bg-gray-200 my-3" />
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-brand-muted">
                {order.shippingAddress?.addressLine1}, {order.shippingAddress?.city},{' '}
                {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              </p>
              <p className="text-brand-muted">{order.shippingAddress?.phone}</p>
            </div>
          </div>

          {(order.fitPreference || order.notes) && (
            <div className="bg-white rounded-lg p-5 border">
              <h3 className="font-serif text-lg mb-3">Tailoring</h3>
              <div className="text-sm space-y-2">
                {order.fitPreference && (
                  <div>
                    <span className="text-brand-muted">Fit preference: </span>
                    <span className="font-medium">{order.fitPreference}</span>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-brand-muted">Customer notes:</p>
                    <p className="whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-5 border">
            <h3 className="font-serif text-lg mb-4">Tracking History</h3>
            <div className="space-y-3">
              {order.tracking?.map((t) => (
                <div key={t.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-secondary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{orderStatusLabel(t.status)}</p>
                    <p className="text-brand-muted text-xs">{t.message}</p>
                    <p className="text-xs text-brand-muted">{formatDateTime(t.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-5 border">
            <h3 className="font-serif text-lg mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-muted">Shipping</span>
                <span>{formatCurrency(order.shippingCharge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <p className="text-xs text-brand-muted pt-2">
                {order.paymentMethod} — {order.paymentStatus}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border">
            <h3 className="font-serif text-lg mb-4">Update Status</h3>
            <div className="space-y-3">
              <Select label="New status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">Select status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{orderStatusLabel(s)}</option>
                ))}
              </Select>
              <Textarea
                label="Message (optional)"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={handleUpdate} loading={updating} disabled={!newStatus} className="w-full">
                Update & Notify Customer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
