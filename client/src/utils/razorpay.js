/**
 * Lazily injects the Razorpay checkout script into the page and resolves
 * once `window.Razorpay` is available.
 */
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  razorpayOrderId,
  amount,
  currency,
  keyId,
  user,
  onSuccess,
  onDismiss,
}) {
  const ok = await loadRazorpay();
  if (!ok) {
    throw new Error('Failed to load Razorpay SDK');
  }

  const rzp = new window.Razorpay({
    key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount,
    currency,
    name: 'Bellissimo Couture',
    description: 'Order payment',
    order_id: razorpayOrderId,
    prefill: {
      name: user?.name,
      email: user?.email,
      contact: user?.phone,
    },
    theme: { color: '#1A1A1A' },
    handler: (response) => onSuccess?.(response),
    modal: { ondismiss: () => onDismiss?.() },
  });
  rzp.open();
}
