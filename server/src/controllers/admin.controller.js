const prisma = require('../config/db');
const { asyncHandler } = require('../utils/errorHandler');

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPrevMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfPrevMonth(now);

  const [
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthOrders,
    newCustomers,
    pendingOrders,
    totalProducts,
    totalUsers,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: thisMonth } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({
      where: { role: 'CUSTOMER', createdAt: { gte: thisMonth } },
    }),
    prisma.order.count({
      where: { orderStatus: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ]);

  const thisRev = Number(thisMonthRevenue._sum.total || 0);
  const lastRev = Number(lastMonthRevenue._sum.total || 0);
  const revenueGrowth = lastRev === 0 ? 100 : ((thisRev - lastRev) / lastRev) * 100;

  res.json({
    success: true,
    stats: {
      thisMonthRevenue: thisRev,
      lastMonthRevenue: lastRev,
      revenueGrowthPercent: Number(revenueGrowth.toFixed(2)),
      thisMonthOrders,
      newCustomers,
      pendingOrders,
      totalProducts,
      totalUsers,
    },
  });
});

// GET /api/admin/stats/revenue-chart
const revenueChart = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Fetch all paid orders from the past 12 months and aggregate in JS
  // (keeps the query portable without raw SQL).
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'PAID', createdAt: { gte: start } },
    select: { createdAt: true, total: true },
  });

  const buckets = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { month: key, revenue: 0, orders: 0 };
  }
  for (const order of orders) {
    const d = order.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].revenue += Number(order.total);
      buckets[key].orders += 1;
    }
  }

  res.json({ success: true, data: Object.values(buckets) });
});

// GET /api/admin/stats/top-products
const topProducts = asyncHandler(async (req, res) => {
  const grouped = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  const data = grouped.map((g) => {
    const product = products.find((p) => p.id === g.productId);
    return {
      productId: g.productId,
      name: product?.name,
      image: product?.images?.[0]?.url,
      unitsSold: g._sum.quantity,
      revenue: Number(g._sum.total),
    };
  });

  res.json({ success: true, data });
});

// GET /api/admin/stats/recent-orders
const recentOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ success: true, orders });
});

module.exports = { getStats, revenueChart, topProducts, recentOrders };
