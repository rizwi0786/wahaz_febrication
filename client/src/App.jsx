import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import Loader from './components/common/Loader';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBanners from './pages/admin/AdminBanners';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCustomOrders from './pages/admin/AdminCustomOrders';
import AdminCustomOrderDetail from './pages/admin/AdminCustomOrderDetail';

import CustomOrderNew from './pages/CustomOrderNew';
import MyCustomOrders from './pages/MyCustomOrders';
import CustomOrderDetail from './pages/CustomOrderDetail';

import Services from './pages/Services';
import ScheduleSession from './pages/ScheduleSession';
import VisitStudio from './pages/VisitStudio';
import AdminConsultations from './pages/admin/AdminConsultations';
import AdminNewsletter from './pages/admin/AdminNewsletter';

import { useAuthBootstrap } from './hooks/useAuthBootstrap';

export default function App() {
  const ready = useAuthBootstrap();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Storefront */}
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />

        {/* Services hub */}
        <Route path="services" element={<Services />} />
        <Route path="services/schedule" element={<ScheduleSession />} />
        <Route path="services/studio" element={<VisitStudio />} />

        {/* Auth (public) */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />

        {/* Protected customer routes */}
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="order-success/:orderId" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="custom-orders" element={<ProtectedRoute><MyCustomOrders /></ProtectedRoute>} />
        <Route path="custom-orders/new" element={<ProtectedRoute><CustomOrderNew /></ProtectedRoute>} />
        <Route path="custom-orders/:id" element={<ProtectedRoute><CustomOrderDetail /></ProtectedRoute>} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/add" element={<AdminProductForm mode="create" />} />
        <Route path="products/edit/:id" element={<AdminProductForm mode="edit" />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="custom-orders" element={<AdminCustomOrders />} />
        <Route path="consultations" element={<AdminConsultations />} />
        <Route path="newsletter" element={<AdminNewsletter />} />
        <Route path="custom-orders/:id" element={<AdminCustomOrderDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
