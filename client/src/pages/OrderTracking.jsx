import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Star, PenLine } from 'lucide-react';
import { useGetOrderQuery, useCancelOrderMutation } from '../store/api/orderApi';
import { useCreateReviewMutation } from '../store/api/userApi';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Textarea } from '../components/common/Input';
import Input from '../components/common/Input';
import { StatusBadge } from '../components/common/Badge';
import {
  formatCurrency,
  formatDateTime,
  ORDER_TIMELINE,
  orderStatusLabel,
} from '../utils/format';
import { selectCurrentUser } from '../store/slices/authSlice';

export default function OrderTracking() {
  const { id } = useParams();
  const currentUser = useSelector(selectCurrentUser);

  // Admins view orders through the admin panel, not the customer page.
  // The backend now blocks this endpoint for non-owners, so without this
  // redirect an admin would land on a blank "Order not found" screen.
  if (currentUser?.role === 'ADMIN') {
    return <Navigate to={`/admin/orders/${id}`} replace />;
  }

  const { data, isLoading } = useGetOrderQuery(id);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [createReview, { isLoading: submittingReview }] = useCreateReviewMutation();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  // Review modal state. `reviewItem` holds the order item being reviewed.
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const order = data?.order;
  if (!order) return <p className="text-center py-24">Order not found</p>;

  const currentIdx = ORDER_TIMELINE.indexOf(order.orderStatus);

  const handleCancel = async () => {
    try {
      await cancelOrder({ id, reason }).unwrap();
      toast.success('Order cancelled');
      setCancelOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel');
    }
  };

  const canCancel = ['ORDER_RECEIVED', 'IN_TAILORING'].includes(order.orderStatus);
  // Backend only accepts reviews for items from orders that are DELIVERED.
  const canReview = order.orderStatus === 'DELIVERED';

  const openReview = (item) => {
    setReviewItem(item);
    setReviewForm({ rating: 5, title: '', comment: '' });
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) {
      return toast.error('Please write a comment');
    }
    try {
      await createReview({
        productId: reviewItem.productId,
        rating: reviewForm.rating,
        title: reviewForm.title || undefined,
        comment: reviewForm.comment,
      }).unwrap();
      toast.success('Review submitted. Awaiting approval.');
      setReviewItem(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="section py-8 max-w-4xl">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-serif truncate">{order.orderNumber}</h1>
          <p className="text-xs md:text-sm text-brand-muted">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>

      {/* Timeline */}
      {order.orderStatus !== 'CANCELLED' && (
        <div className="card p-4 sm:p-6 mb-6 overflow-x-auto scrollbar-none">
          <div className="flex items-start justify-between min-w-[520px] md:min-w-0">
            {ORDER_TIMELINE.map((status, i) => {
              const done = i <= currentIdx;
              return (
                <div key={status} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      done ? 'bg-brand-secondary text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>
                    <span className={`text-[10px] md:text-xs mt-1 text-center px-1 leading-tight max-w-[90px] ${done ? 'text-brand-primary font-medium' : 'text-gray-400'}`}>
                      {orderStatusLabel(status)}
                    </span>
                  </div>
                  {i < ORDER_TIMELINE.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${i < currentIdx ? 'bg-brand-secondary' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Items */}
        <div className="card p-4 sm:p-6">
          <h3 className="font-serif text-lg mb-4">Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                <img src={item.productImage} alt={item.productName} className="w-14 h-16 object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-brand-muted">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                  {canReview && (
                    <button
                      onClick={() => openReview(item)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-brand-secondary hover:underline"
                    >
                      <PenLine size={12} /> Write a review
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium shrink-0">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + shipping */}
        <div className="space-y-4 md:space-y-6">
          <div className="card p-4 sm:p-6">
            <h3 className="font-serif text-lg mb-4">Payment Summary</h3>
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
              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <p className="text-xs text-brand-muted pt-2">
                Payment: {order.paymentMethod} — {order.paymentStatus}
              </p>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <h3 className="font-serif text-lg mb-3">Shipping To</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p className="text-brand-muted">{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && (
                <p className="text-brand-muted">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-brand-muted">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
              </p>
              <p className="text-brand-muted">{order.shippingAddress?.phone}</p>
            </div>
          </div>

          {(order.fitPreference || order.notes) && (
            <div className="card p-4 sm:p-6">
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
                    <p className="text-brand-muted">Notes:</p>
                    <p className="whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracking history */}
      {order.tracking?.length > 0 && (
        <div className="card p-4 sm:p-6 mt-6">
          <h3 className="font-serif text-lg mb-4">Tracking History</h3>
          <div className="space-y-3">
            {order.tracking.map((t) => (
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
      )}

      {canCancel && (
        <div className="mt-6 text-center">
          <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Order</Button>
        </div>
      )}

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Order">
        <p className="text-sm text-brand-muted mb-3">
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="input resize-none"
          rows={3}
        />
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep Order</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Cancel Order</Button>
        </div>
      </Modal>

      <Modal
        open={!!reviewItem}
        onClose={() => setReviewItem(null)}
        title={reviewItem ? `Review · ${reviewItem.productName}` : 'Review'}
        size="lg"
      >
        {reviewItem && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center border-b pb-3">
              <img
                src={reviewItem.productImage}
                alt={reviewItem.productName}
                className="w-14 h-16 object-cover rounded"
              />
              <div>
                <p className="text-sm font-medium">{reviewItem.productName}</p>
                <p className="text-xs text-brand-muted">
                  {reviewItem.size} · {reviewItem.color}
                </p>
              </div>
            </div>

            <div>
              <label className="label">Your rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className="p-1"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={24}
                      className={
                        n <= reviewForm.rating
                          ? 'fill-brand-secondary text-brand-secondary'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-brand-muted">
                  {reviewForm.rating} / 5
                </span>
              </div>
            </div>

            <Input
              label="Title (optional)"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="Sums up your review in a few words"
              maxLength={120}
            />

            <Textarea
              label="Your review"
              rows={5}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="How did this product work out for you?"
              maxLength={2000}
            />

            <p className="text-xs text-brand-muted">
              Reviews are published once approved by our team.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewItem(null)}>Cancel</Button>
              <Button onClick={submitReview} loading={submittingReview}>Submit review</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
