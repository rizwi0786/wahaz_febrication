import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Tag,
  Image,
  Star,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { selectCurrentUser } from '../../store/slices/authSlice';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

export default function AdminLayout() {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-brand-primary text-white flex flex-col sticky top-0 h-screen self-start shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="font-serif text-xl">
            Wahaz <span className="text-brand-secondary">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition ${
                  isActive ? 'bg-white/10 text-brand-secondary border-l-4 border-brand-secondary' : 'text-white/80 hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-sm">
          <p className="font-medium truncate">{user?.name}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
          <Link to="/" className="mt-3 flex items-center gap-2 text-xs text-white/70 hover:text-brand-secondary">
            <ExternalLink size={12} /> View storefront
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <div className="p-6 md:p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
