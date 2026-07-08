import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import {
  useGetCartQuery,
  useValidateCouponMutation,
} from '../store/api/cartApi';
import { useGetProfileQuery, useAddAddressMutation } from '../store/api/userApi';
import { usePlaceOrderMutation, useVerifyPaymentMutation } from '../store/api/orderApi';
import { openRazorpayCheckout } from '../utils/razorpay';
import Button from '../components/common/Button';
import Input, { Select, Textarea } from '../components/common/Input';
import SizeChartModal from '../components/product/SizeChartModal';
import { Ruler } from 'lucide-react';

const FIT_OPTIONS = ['Slim Fit', 'Regular Fit', 'Tailored Fit', 'Relaxed Fit', 'Classic Fit'];
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/format';
import { selectCurrentUser } from '../store/slices/authSlice';

const STEPS = ['Address', 'Summary', 'Payment'];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  const { data: cartData, isLoading: cartLoading } = useGetCartQuery();
  const { data: profileData } = useGetProfileQuery();
  const [addAddress] = useAddAddressMutation();
  const [validateCoupon] = useValidateCouponMutation();
  const [placeOrder, { isLoading: placing }] = usePlaceOrderMutation();
  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();
  const [paying, setPaying] = useState(false);

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [couponCode, setCouponCode] = useState(location.state?.couponCode || '');
  const [coupon, setCoupon] = useState(null);
  const [fitPreference, setFitPreference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  if (cartLoading) return <Loader className="py-24" size="lg" />;

  const cart = cartData?.cart;
  const items = cart?.items || [];
  const addresses = profileData?.user?.addresses || [];

  const subtotal = items.reduce(
    (s, i) => s + Number(i.product.discountPrice || i.product.price) * i.quantity,
    0
  );
  const discount = coupon?.discount || 0;
  const discountedSub = Math.max(0, subtotal - discount);
  const shipping = discountedSub >= 999 ? 0 : 99;
  // GST promo: the 18% GST is on us — computed only to show the savings,
  // never charged. Must match TAX_RATE = 0 in server/order.controller.js.
  const gstWaived = discountedSub * 0.18;
  const total = discountedSub + shipping;

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await validateCoupon({ code: couponCode, subtotal }).unwrap();
      setCoupon(res.coupon);
      toast.success('Coupon applied');
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid coupon');
    }
  };

  const handleSaveAddress = async () => {
    try {
      const res = await addAddress(newAddress).unwrap();
      setSelectedAddressId(res.address.id);
      setShowNewAddress(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (paying || placing || verifying) return; // guard against double-click
    const address = selectedAddress || (showNewAddress ? newAddress : null);
    if (!address) return toast.error('Please add or select an address');

    setPaying(true);
    try {
      const result = await placeOrder({
        shippingAddress: address,
        paymentMethod,
        couponCode: coupon?.code,
        fitPreference: fitPreference || undefined,
        notes: orderNotes || undefined,
      }).unwrap();

      if (paymentMethod === 'COD') {
        toast.success('Order placed!');
        navigate(`/order-success/${result.order.id}`);
        return;
      }

      // Razorpay flow. Amount/currency are echoed back from the server's
      // razorpay.orders.create response — never trust a client-computed total.
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
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => {
          setPaying(false);
          toast.error('Payment cancelled');
        },
      });
    } catch (err) {
      setPaying(false);
      toast.error(err?.data?.message || 'Failed to place order');
    }
  };

  if (items.length === 0) {
    return (
      <div className="section py-24 text-center">
        <p className="text-brand-muted mb-4">Your cart is empty</p>
        <Button onClick={() => navigate('/shop')}>Go shopping</Button>
      </div>
    );
  }

  return (
    <div className="section py-8 max-w-5xl">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">Checkout</h1>

      {/* Steps — compact on phones, labels hide under 360px */}
      <div className="flex items-center justify-center mb-8 md:mb-10 overflow-x-auto scrollbar-none">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                i <= step ? 'bg-brand-primary text-white' : 'bg-gray-200 text-brand-muted'
              }`}
            >
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={`ml-2 text-xs sm:text-sm whitespace-nowrap ${
                i <= step ? 'text-brand-primary font-medium' : 'text-brand-muted'
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-6 sm:w-12 h-px bg-gray-300 mx-2 sm:mx-3" />
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_360px] gap-6 md:gap-8">
        <div>
          {/* Step 1: Address */}
          {step === 0 && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-xl font-serif mb-4">Delivery Address</h2>
              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-3 mb-4">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`block p-4 border rounded-md cursor-pointer transition ${
                        selectedAddressId === a.id || (!selectedAddressId && a.isDefault)
                          ? 'border-brand-primary bg-brand-light'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === a.id || (!selectedAddressId && a.isDefault)}
                        onChange={() => setSelectedAddressId(a.id)}
                        className="mr-2"
                      />
                      <span className="font-medium">{a.fullName}</span>
                      <p className="text-sm text-brand-muted mt-1">
                        {a.addressLine1}, {a.city}, {a.state} {a.pincode}
                      </p>
                      <p className="text-sm text-brand-muted">{a.phone}</p>
                    </label>
                  ))}
                </div>
              )}

              {showNewAddress || addresses.length === 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Full name"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Address line 1"
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  />
                  <Input
                    label="Address line 2 (optional)"
                    value={newAddress.addressLine2}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Input
                      label="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                    <Input
                      label="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    />
                    <Input
                      label="Pincode"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAddress} variant="outline" size="sm">
                      Save address
                    </Button>
                    {addresses.length > 0 && (
                      <Button onClick={() => setShowNewAddress(false)} variant="ghost" size="sm">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewAddress(true)}
                  className="text-sm text-brand-secondary hover:underline"
                >
                  + Add new address
                </button>
              )}

              <div className="mt-6 text-right">
                <Button onClick={() => setStep(1)} disabled={!selectedAddress && !showNewAddress}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Summary */}
          {step === 1 && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-xl font-serif mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-3 border-b">
                    <img
                      src={item.product.images?.[0]?.url}
                      alt=""
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-brand-muted">
                        {item.variant?.size} · {item.variant?.color} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(
                        Number(item.product.discountPrice || item.product.price) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mb-4 border-t pt-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <label className="label">Fit preference (optional)</label>
                    <p className="text-xs text-brand-muted">
                      How would you like the garment to be tailored?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSizeChartOpen(true)}
                    className="text-xs flex items-center gap-1 text-brand-secondary hover:underline shrink-0"
                  >
                    <Ruler size={14} /> Size chart
                  </button>
                </div>
                <Select
                  value={fitPreference}
                  onChange={(e) => setFitPreference(e.target.value)}
                >
                  <option value="">No preference</option>
                  {FIT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </div>

              <div className="mb-4">
                <Textarea
                  label="Notes / instructions for the tailor (optional)"
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. need by a specific date, special handling, gift wrap, etc."
                />
              </div>

              <div className="mb-4">
                <label className="label">Coupon</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                  />
                  <Button onClick={handleApplyCoupon} variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button onClick={() => setStep(0)} variant="ghost">← Back</Button>
                <Button onClick={() => setStep(2)}>Continue to Payment</Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-xl font-serif mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label
                  className={`block p-4 border rounded-md cursor-pointer ${
                    paymentMethod === 'RAZORPAY' ? 'border-brand-primary bg-brand-light' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="mr-2"
                  />
                  <span className="font-medium">Razorpay (UPI / Card / Netbanking)</span>
                  <p className="text-xs text-brand-muted mt-1 ml-5">Secure online payment</p>
                </label>
                <label
                  className={`block p-4 border rounded-md cursor-pointer ${
                    paymentMethod === 'COD' ? 'border-brand-primary bg-brand-light' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mr-2"
                  />
                  <span className="font-medium">Cash on Delivery</span>
                  <p className="text-xs text-brand-muted mt-1 ml-5">Pay when you receive your order</p>
                </label>
              </div>
              <div className="flex justify-between mt-6">
                <Button onClick={() => setStep(1)} variant="ghost">← Back</Button>
                <Button
                  onClick={handlePlaceOrder}
                  loading={placing || paying || verifying}
                  disabled={placing || paying || verifying}
                >
                  Place Order
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="card p-6 h-fit">
          <h3 className="font-serif text-lg mb-4">Order Total</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-brand-muted">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-muted">Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">GST (18%)</span>
              <span>
                <span className="line-through text-brand-muted mr-1.5">{formatCurrency(gstWaived)}</span>
                <span className="text-green-700 font-medium">FREE</span>
              </span>
            </div>
            {gstWaived > 0 && (
              <p className="text-xs text-green-700">
                🎉 GST is on us — you save {formatCurrency(gstWaived)}
              </p>
            )}
            <div className="flex justify-between pt-3 border-t font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <SizeChartModal
        open={sizeChartOpen}
        onClose={() => setSizeChartOpen(false)}
        productFits={fitPreference ? [fitPreference] : []}
      />
    </div>
  );
}
