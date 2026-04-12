import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Heart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { selectCurrentUser, logOut } from '../../store/slices/authSlice';
import { useGetCartQuery } from '../../store/api/cartApi';
import { useLogoutMutation } from '../../store/api/authApi';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Coats', to: '/shop?category=designer-coats' },
  { label: 'Suits', to: '/shop?category=suits' },
  { label: 'Sherwani', to: '/shop?category=sherwani' },
  { label: 'Blazers', to: '/shop?category=blazers' },
];

export default function Navbar() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const { data: cartData } = useGetCartQuery(undefined, { skip: !user });
  const [doLogout] = useLogoutMutation();
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
        <Link to="/" className="font-serif text-2xl md:text-3xl font-semibold">
          Wahaz <span className="text-brand-secondary">Fabrication</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
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
          ))}
        </nav>

        {/* Search + icons */}
        <div className="flex items-center gap-3 md:gap-5">
          <form onSubmit={onSearch} className="hidden md:flex items-center bg-brand-light rounded-full px-3">
            <Search size={16} className="text-brand-muted" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search products..."
              className="bg-transparent text-sm px-2 py-2 outline-none w-40 lg:w-56"
            />
          </form>

          <Link to="/wishlist" className="p-2 hover:text-brand-secondary transition" aria-label="Wishlist">
            <Heart size={20} />
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
            <Link to="/login" className="hidden md:inline-flex btn-outline px-4 py-2 text-sm">
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
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                  Profile
                </Link>
                <Link to="/orders" onClick={() => setMobileOpen(false)} className="block py-2 text-sm">
                  Orders
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
