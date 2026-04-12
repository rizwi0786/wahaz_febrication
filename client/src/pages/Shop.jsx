import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { useListProductsQuery } from '../store/api/productApi';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo(() => {
    const obj = {};
    for (const [k, v] of searchParams.entries()) obj[k] = v;
    return obj;
  }, [searchParams]);

  const setFilters = (next) => {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v != null));
    setSearchParams(clean, { replace: true });
  };

  const { data, isFetching } = useListProductsQuery(filters);
  const products = data?.products || [];
  const total = data?.total || 0;

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="section py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-serif">Shop</h1>
        {filters.search && (
          <p className="text-brand-muted text-sm mt-1">Results for "{filters.search}"</p>
        )}
      </div>

      <div className="grid lg:grid-cols-[250px_1fr] gap-6 lg:gap-8">
        {/* Desktop filter */}
        <div className="hidden lg:block">
          <ProductFilter filters={filters} setFilters={setFilters} />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <p className="text-xs sm:text-sm text-brand-muted">
              Showing <span className="font-medium text-brand-primary">{products.length}</span> of {total} results
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden btn-outline py-2 px-3 text-xs"
              >
                <SlidersHorizontal size={14} /> Filter
              </button>
              <select
                value={filters.sort || ''}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="text-xs sm:text-sm border border-gray-200 rounded-md px-2 sm:px-3 py-2 bg-white max-w-[140px] sm:max-w-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <ProductGrid products={products} loading={isFetching} />
        </div>
      </div>

      {/* Mobile filter drawer — slides in from left on phones, narrower so tap area is reachable one-handed */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="w-[85vw] sm:w-80 bg-white h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="font-serif text-lg">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <ProductFilter filters={filters} setFilters={setFilters} />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-primary w-full"
              >
                Show {total} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
