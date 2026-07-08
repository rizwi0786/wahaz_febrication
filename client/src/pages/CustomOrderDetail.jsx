import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  useGetCustomOrderQuery,
  useAcceptQuoteMutation,
  useCounterOfferMutation,
  useCancelCustomOrderMutation,
  usePlaceCustomOrderMutation,
} from '../store/api/customOrderApi';
import { useGetProfileQuery } from '../store/api/userApi';
import { useVerifyPaymentMutation } from '../store/api/orderApi';
import { openRazorpayCheckout } from '../utils/razorpay';
import { selectCurrentUser } from '../store/slices/authSlice';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_LABEL = {
  PENDING_REVIEW: { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700' },
  PRICE_QUOTED: { label: 'Quote received', cls: 'bg-blue-100 text-blue-700' },
  COUNTER_OFFERED: { label: 'Counter sent — awaiting admin', cls: 'bg-purple-100 text-purple-700' },
  APPROVED: { label: 'Approved — proceed to checkout', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-700' },
  PAID: { label: 'Order placed', cls: 'bg-emerald-100 text-emerald-700' },
};

export default function CustomOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, refetch } = useGetCustomOrderQuery(id);
  const { data: profile } = useGetProfileQuery();

  const [accept, { isLoading: accepting }] = useAcceptQuoteMutation();
  const [counter, { isLoading: countering }] = useCounterOfferMutation();
  const [cancel, { isLoading: cancelling }] = useCancelCustomOrderMutation();
  const [placeOrder, { isLoading: placing }] = usePlaceCustomOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();

  const [counterPrice, setCounterPrice] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  if (isLoading) return <Loader className="py-24" size="lg" />;
  const co = data?.customOrder;
  if (!co) return <div className="section py-12">Custom order not found.</div>;

  const meta = STATUS_LABEL[co.status] || { label: co.status, cls: 'bg-gray-100 text-gray-700' };
  const addresses = profile?.user?.addresses || [];
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];

  const onAccept = async () => {
    try {
      await accept(co.id).unwrap();
      toast.success('Quote accepted — you can now place the order');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const onCounter = async () => {
    if (!counterPrice || Number(counterPrice) <= 0) return toast.error('Enter a valid price');
    try {
      await counter({ id: co.id, counterPrice: Number(counterPrice), message: counterMsg }).unwrap();
      toast.success('Counter offer sent');
      setShowCounter(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const onCancel = async () => {
    if (!confirm('Cancel this custom design request?')) return;
    try {
      await cancel(co.id).unwrap();
      toast.success('Cancelled');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const onPlaceOrder = async () => {
    if (!selectedAddress) return toast.error('Please add a delivery address from your profile');
    try {
      const result = await placeOrder({
        id: co.id,
        shippingAddress: selectedAddress,
        paymentMethod,
      }).unwrap();
      if (paymentMethod === 'COD') {
        toast.success('Order placed!');
        navigate(`/order-success/${result.order.id}`);
        return;
      }
      await openRazorpayCheckout({
        razorpayOrderId: result.razorpay.razorpayOrderId,
        amount: result.razorpay.amount,
        currency: result.razorpay.currency,
        keyId: result.razorpay.keyId,
        user,
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: result.order.id,
            }).unwrap();
            toast.success('Payment successful!');
            navigate(`/order-success/${result.order.id}`);
          } catch (err) {
            toast.error(err?.data?.message || 'Payment verification failed');
          }
        },
        onDismiss: () => toast.error('Payment cancelled'),
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to place order');
    }
  };

  return (
    <div className="section py-8 max-w-4xl">
      <Link to="/custom-orders" className="inline-flex items-center text-sm text-brand-muted hover:text-brand-primary mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back to my designs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif">{co.requestNumber}</h1>
          <p className="text-xs text-brand-muted">Submitted {formatDate(co.createdAt)}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium self-start ${meta.cls}`}>{meta.label}</span>
      </div>

      {/* Action banner */}
      {co.status === 'PRICE_QUOTED' && (
        <div className="card p-4 sm:p-6 mb-5 border-2 border-brand-secondary/40 bg-brand-light/40">
          <p className="text-sm text-brand-muted mb-1">Admin's quote</p>
          <p className="text-3xl font-serif mb-2">{formatCurrency(co.adminQuotedPrice)}<span className="text-sm text-brand-muted ml-1">/ unit</span></p>
          {co.adminNotes && <p className="text-sm mb-3">{co.adminNotes}</p>}
          <div className="flex items-start gap-2 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>You can accept this quote, or make a <strong>one-time</strong> counter offer. Once you counter, you cannot revise it again.</span>
          </div>
          {!showCounter ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={onAccept} loading={accepting}>Accept quote</Button>
              <Button variant="outline" onClick={() => setShowCounter(true)} disabled={co.counterUsed}>
                Make counter offer
              </Button>
              <Button variant="ghost" onClick={onCancel} loading={cancelling}>Cancel request</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Your counter price (per unit)"
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
              />
              <div>
                <label className="label">Message (optional)</label>
                <textarea
                  className="input min-h-[70px]"
                  value={counterMsg}
                  onChange={(e) => setCounterMsg(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={onCounter} loading={countering}>Send counter offer</Button>
                <Button variant="ghost" onClick={() => setShowCounter(false)}>Back</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {co.status === 'COUNTER_OFFERED' && (
        <div className="card p-4 sm:p-6 mb-5 border border-purple-200 bg-purple-50">
          <p className="text-sm">Your counter offer of <strong>{formatCurrency(co.userCounterPrice)}</strong> has been sent. Awaiting admin response.</p>
          <p className="text-xs text-brand-muted mt-1">Counter offer can be made only once — you've used yours.</p>
        </div>
      )}

      {co.status === 'APPROVED' && !co.orderId && (
        <div className="card p-4 sm:p-6 mb-5 border-2 border-green-300 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={20} className="text-green-700" />
            <h2 className="font-serif text-lg">Approved — place your order</h2>
          </div>
          <p className="text-sm mb-3">
            Final price: <strong>{formatCurrency(co.finalPrice)}</strong> × {co.quantity} ={' '}
            <strong>{formatCurrency(Number(co.finalPrice) * co.quantity)}</strong>
            <span className="text-xs text-brand-muted"> (shipping added at checkout — GST is on us)</span>
          </p>

          <div className="mb-3">
            <label className="label">Delivery address</label>
            {addresses.length === 0 ? (
              <p className="text-sm text-red-600">No addresses found. <Link to="/profile" className="underline">Add one in your profile</Link>.</p>
            ) : (
              <select
                className="input"
                value={selectedAddress?.id || ''}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} — {a.addressLine1}, {a.city}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mb-4">
            <label className="label">Payment method</label>
            <div className="space-y-2">
              <label className={`block p-3 border rounded cursor-pointer ${paymentMethod === 'RAZORPAY' ? 'border-brand-primary bg-white' : ''}`}>
                <input type="radio" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} className="mr-2" />
                Razorpay (UPI / Card / Netbanking)
              </label>
              <label className={`block p-3 border rounded cursor-pointer ${paymentMethod === 'COD' ? 'border-brand-primary bg-white' : ''}`}>
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="mr-2" />
                Cash on Delivery
              </label>
            </div>
          </div>

          <Button onClick={onPlaceOrder} loading={placing} disabled={!selectedAddress}>
            Place Order
          </Button>
        </div>
      )}

      {co.status === 'PAID' && co.orderId && (
        <div className="card p-4 sm:p-6 mb-5 border border-emerald-300 bg-emerald-50">
          <p className="text-sm mb-2">Order placed successfully.</p>
          <Link to={`/orders/${co.orderId}`} className="btn-primary text-sm">View order</Link>
        </div>
      )}

      {co.status === 'REJECTED' && co.rejectReason && (
        <div className="card p-4 mb-5 border border-red-200 bg-red-50">
          <p className="text-sm"><strong>Rejection reason:</strong> {co.rejectReason}</p>
        </div>
      )}

      {/* Details */}
      <div className="card p-4 sm:p-6 mb-5">
        <h2 className="font-serif text-lg mb-3">Design images</h2>
        <div className="flex flex-wrap gap-3 mb-5">
          {co.designImages.map((src, i) => (
            <img key={i} src={src} alt="" className="w-28 h-28 object-cover rounded border" />
          ))}
        </div>
        {co.clothPhotos?.length > 0 && (
          <>
            <h3 className="font-serif text-lg mb-3">Fabric photos</h3>
            <div className="flex flex-wrap gap-3 mb-5">
              {co.clothPhotos.map((src, i) => (
                <img key={i} src={src} alt="" className="w-28 h-28 object-cover rounded border" />
              ))}
            </div>
          </>
        )}
        <h3 className="font-serif text-lg mb-3">Measurements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
          {Object.entries(co.sizeDetails || {}).filter(([, v]) => String(v || '').trim() !== '').map(([k, v]) => (
            <div key={k} className="bg-brand-light/50 p-2 rounded">
              <p className="text-xs text-brand-muted capitalize">
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="font-medium">{v}</p>
            </div>
          ))}
        </div>
        {co.description && (
          <>
            <h3 className="font-serif text-lg mb-2 mt-3">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{co.description}</p>
          </>
        )}
        <p className="text-xs text-brand-muted mt-4">Quantity: {co.quantity}</p>
      </div>

      {['PENDING_REVIEW'].includes(co.status) && (
        <div className="text-right">
          <Button variant="ghost" onClick={onCancel} loading={cancelling}>Cancel request</Button>
        </div>
      )}
    </div>
  );
}
