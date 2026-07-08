import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useValidateCouponMutation,
} from '../store/api/cartApi';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/format';

const SHIPPING_FREE_ABOVE = 999;
const SHIPPING_CHARGE = 99;
const TAX_RATE = 0.18;

export default function Cart() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [validateCoupon, { isLoading: validatingCoupon }] = useValidateCouponMutation();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const cart = data?.cart;
  const items = cart?.items || [];
  const unavailableItems = items.filter((it) => !it.product?.isActive);
  const hasUnavailable = unavailableItems.length > 0;

  const subtotal = items.reduce((sum, item) => {
    if (!item.product?.isActive) return sum;
    const price = Number(item.product.discountPrice || item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const discount = appliedCoupon?.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_CHARGE;
  // GST promo: the 18% GST is on us — computed only to show the savings,
  // never charged. Must match TAX_RATE = 0 in server/order.controller.js.
  const gstWaived = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await validateCoupon({ code: couponCode, subtotal }).unwrap();
      setAppliedCoupon(res.coupon);
      toast.success(`Coupon applied: ${formatCurrency(res.coupon.discount)} off`);
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    }
  };

  const handleQuantity = async (item, next) => {
    if (next < 1) return;
    try {
      await updateItem({ itemId: item.id, quantity: next }).unwrap();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not update');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId).unwrap();
      toast.success('Removed from cart');
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (hasUnavailable) {
      toast.error('Please remove unavailable items before checking out');
      return;
    }
    navigate('/checkout', { state: { couponCode: appliedCoupon?.code } });
  };

  if (items.length === 0) {
    return (
      <div className="section py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add some products to start shopping"
          action={<Link to="/shop" className="btn-primary inline-flex">Continue Shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="section py-8">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">Shopping Cart ({items.length})</h1>
      {hasUnavailable && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {unavailableItems.length} item(s) in your cart are no longer available. Remove them to continue checkout.
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => {
            const price = Number(item.product.discountPrice || item.product.price);
            const unavailable = !item.product?.isActive;
            return (
              <div
                key={item.id}
                className={`card p-3 sm:p-4 flex gap-3 sm:gap-4 ${
                  unavailable ? 'opacity-60 border-red-200' : ''
                }`}
              >
                <Link to={`/product/${item.product.slug}`} className="shrink-0">
                  <img
                    src={item.product.images?.[0]?.url}
                    alt={item.product.name}
                    className="w-20 h-24 sm:w-24 sm:h-32 object-cover rounded"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="font-medium hover:text-brand-secondary block truncate"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-brand-muted mt-1">
                        {item.variant?.size} · {item.variant?.color}
                      </p>
                      <p className="text-sm font-semibold mt-1">{formatCurrency(price)}</p>
                      {unavailable && (
                        <p className="text-xs text-red-600 font-medium mt-1">
                          No longer available — please remove
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-brand-muted hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantity(item, item.quantity - 1)}
                        disabled={unavailable}
                        className="p-1.5 border border-gray-300 rounded hover:border-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantity(item, item.quantity + 1)}
                        disabled={unavailable}
                        className="p-1.5 border border-gray-300 rounded hover:border-brand-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-semibold">{formatCurrency(price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary — sticky only on large screens so it doesn't lock position on mobile */}
        <div className="card p-5 sm:p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-serif text-xl mb-4">Order Summary</h3>

          <div className="mb-4">
            <label className="label">Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="input"
              />
              <Button onClick={handleApplyCoupon} loading={validatingCoupon} variant="outline" size="sm">
                Apply
              </Button>
            </div>
            {appliedCoupon && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                <Tag size={12} /> {appliedCoupon.code} applied
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm border-t pt-4">
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
            <div className="flex justify-between pt-3 border-t text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button onClick={handleCheckout} disabled={hasUnavailable} className="w-full mt-6">
            Proceed to Checkout
          </Button>
          <Link to="/shop" className="block text-center text-xs text-brand-muted hover:text-brand-primary mt-3">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
