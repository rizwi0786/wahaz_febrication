import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { selectCurrentUser, logOut } from '../../store/slices/authSlice';
import { useGetCartQuery } from '../../store/api/cartApi';
import { useLogoutMutation } from '../../store/api/authApi';
import { useWishlist } from '../../hooks/useWishlist';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Custom Design', to: '/custom-orders/new' },
];

const SHOP_CATEGORIES = [
  { label: 'All Products', to: '/shop' },
  { label: 'Coats', to: '/shop?category=designer-coats' },
  { label: 'Suits', to: '/shop?category=suits' },
  { label: 'Sherwani', to: '/shop?category=sherwani' },
  { label: 'Blazers', to: '/shop?category=blazers' },
];

const SERVICES_LINK = { label: 'Our Services', to: '/services' };

export default function Navbar() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const { data: cartData } = useGetCartQuery(undefined, { skip: !user });
  const [doLogout] = useLogoutMutation();
  const { count: wishlistCount } = useWishlist();
  const cartCount = cartData?.cart?.items?.reduce((n, i) => n + i.quantity, 0) || 0;

  const onSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  const handleLogout = async () => {
    await doLogout().unwrap().catch(() => {});
    dispatch(logOut());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="section flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img src="/logo.png" alt="Bellissimo Couture" className="h-12 md:h-14 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((item) => {
            // Render Shop as a hover dropdown so categories stay accessible
            // without crowding the top bar.
            if (item.label === 'Shop') {
              return (
                <div key={item.label} className="relative group">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1 text-sm font-medium tracking-wide transition ${
                        isActive ? 'text-brand-secondary' : 'text-brand-primary hover:text-brand-secondary'
                      }`
                    }
                  >
                    {item.label} <ChevronDown size={14} />
                  </NavLink>
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-30">
                    <div className="bg-white rounded-lg shadow-xl py-2 w-48 border">
                      {SHOP_CATEGORIES.map((c) => (
                        <Link
                          key={c.label}
                          to={c.to}
                          className="block px-4 py-2 text-sm hover:bg-brand-light"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition ${
                    isActive ? 'text-brand-secondary' : 'text-brand-primary hover:text-brand-secondary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
          <NavLink
            to={SERVICES_LINK.to}
            className={({ isActive }) =>
              `inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full transition border ${
                isActive
                  ? 'bg-brand-secondary text-white border-brand-secondary'
                  : 'border-brand-secondary text-brand-secondary hover:bg-brand-secondary hover:text-white'
              }`
            }
          >
            {SERVICES_LINK.label}
          </NavLink>
        </nav>

        {/* Search + icons */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <form onSubmit={onSearch} className="hidden lg:flex items-center bg-brand-light rounded-full px-3">
            <Search size={16} className="text-brand-muted shrink-0" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-sm px-2 py-2 outline-none w-32 xl:w-48"
            />
          </form>

          <Link to="/wishlist" className="relative p-2 hover:text-brand-secondary transition" aria-label="Wishlist">
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-secondary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link to="/cart" className="relative p-2 hover:text-brand-secondary transition" aria-label="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-brand-secondary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group hidden md:block">
              <button className="p-2 hover:text-brand-secondary transition flex items-center gap-2">
                <User size={20} />
              </button>
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <div className="bg-white rounded-lg shadow-xl py-2 w-48 border">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-brand-muted truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-brand-light">
                    Profile
                  </Link>
                  <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-brand-light">
                    Orders
                  </Link>
                  <Link to="/custom-orders" className="block px-4 py-2 text-sm hover:bg-brand-light">
                    My Custom Designs
                  </Link>
                  <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-brand-light">
                    Wishlist
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-brand-secondary hover:bg-brand-light">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-brand-light flex items-center gap-2 border-t"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="hidden md:inline-flex btn-outline px-4 py-2 text-sm whitespace-nowrap">
              Sign in
            </Link>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2" aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="section py-4 space-y-2">
            <form onSubmit={onSearch} className="flex items-center bg-brand-light rounded-full px-3 mb-3">
              <Search size={16} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search..."
                className="bg-transparent px-2 py-2 outline-none w-full text-sm"
              />
            </form>
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium"
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to={SERVICES_LINK.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-semibold text-brand-secondary"
            >
              {SERVICES_LINK.label}
            </NavLink>
            <details className="py-1">
              <summary className="cursor-pointer text-xs uppercase tracking-wide text-brand-muted py-1">Categories</summary>
              <div className="pl-3 pb-2">
                {SHOP_CATEGORIES.slice(1).map((c) => (
                  <Link
                    key={c.label}
                    to={c.to}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-sm text-brand-muted"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </details>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                  Profile
                </Link>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                  Orders
                </Link>
                <Link to="/custom-orders" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                  My Custom Designs
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-brand-secondary">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="py-2 text-sm text-left w-full">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
