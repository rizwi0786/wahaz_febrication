export const formatCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const statusColor = (status) => {
  const map = {
    ORDER_RECEIVED: 'bg-blue-100 text-blue-700',
    IN_TAILORING: 'bg-amber-100 text-amber-800',
    QUALITY_CHECK: 'bg-purple-100 text-purple-700',
    READY_TO_SHIP: 'bg-cyan-100 text-cyan-700',
    SHIPPED: 'bg-orange-100 text-orange-700',
    OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    RETURN_REQUESTED: 'bg-yellow-100 text-yellow-700',
    RETURNED: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    PAID: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

// Customer-facing labels for order statuses. Use these instead of the raw
// enum values whenever a status is shown to a person.
export const ORDER_STATUS_LABELS = {
  ORDER_RECEIVED: 'Order Received',
  IN_TAILORING: 'Master Tailor at Work',
  QUALITY_CHECK: 'Quality Check',
  READY_TO_SHIP: 'Ready to Ship',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
};

export const orderStatusLabel = (status) =>
  ORDER_STATUS_LABELS[status] || String(status || '').replace(/_/g, ' ');

// The bespoke happy-path the customer can see on the timeline.
export const ORDER_TIMELINE = [
  'ORDER_RECEIVED',
  'IN_TAILORING',
  'QUALITY_CHECK',
  'READY_TO_SHIP',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

// All statuses an admin can move an order through.
export const ORDER_STATUSES = [
  ...ORDER_TIMELINE,
  'CANCELLED',
  'RETURN_REQUESTED',
  'RETURNED',
];
