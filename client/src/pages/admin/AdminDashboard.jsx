import {
  useGetStatsQuery,
  useGetRevenueChartQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,
} from '../../store/api/adminApi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/format';
import Loader from '../../components/common/Loader';

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-brand-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-serif mt-2">{value}</p>
          {change !== undefined && change !== null && (
            <p
              className={`text-xs mt-1 ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useGetStatsQuery();
  const { data: chartData } = useGetRevenueChartQuery();
  const { data: topData } = useGetTopProductsQuery();
  const { data: recentData } = useGetRecentOrdersQuery();

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const s = statsData?.stats || {};
  const chart = chartData?.data || [];
  const topProducts = topData?.data || [];
  const recentOrders = recentData?.orders || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-serif">Dashboard</h1>
        <p className="text-sm text-brand-muted">Here's what's happening in your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Revenue this month"
          value={formatCurrency(s.thisMonthRevenue)}
          change={s.revenueGrowthPercent}
          color="bg-brand-secondary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Orders this month"
          value={s.thisMonthOrders || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="New customers"
          value={s.newCustomers || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={Package}
          label="Pending orders"
          value={s.pendingOrders || 0}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border">
          <h3 className="font-serif text-lg mb-4">Revenue (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#B8962E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border">
          <h3 className="font-serif text-lg mb-4">Orders per Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-serif text-lg">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-brand-secondary hover:underline">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-brand-muted bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/orders/${o.id}`} className="text-brand-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-xs">{o.user?.name}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.orderStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-5 border-b">
            <h3 className="font-serif text-lg">Top Products</h3>
          </div>
          <div className="divide-y">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3 p-4">
                <span className="text-brand-muted font-serif text-lg w-6">{i + 1}</span>
                {p.image && <img src={p.image} alt="" className="w-12 h-14 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-brand-muted">{p.unitsSold} sold</p>
                </div>
                <p className="font-medium text-sm">{formatCurrency(p.revenue)}</p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="p-5 text-sm text-brand-muted text-center">No data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
