import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useListProductsQuery } from '../store/api/productApi';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilter from '../components/product/ProductFilter';

// Build a compact page list with ellipses, e.g. [1, '...', 4, 5, 6, '...', 12]
function buildPageList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i);
  }
  if (range[0] > 1) {
    if (range[0] > 2) range.unshift('...');
    range.unshift(1);
  }
  if (range[range.length - 1] < total) {
    if (range[range.length - 1] < total - 1) range.push('...');
    range.push(total);
  }
  return range;
}

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
    // Any filter/sort change returns to page 1 so we never land on an out-of-range page.
    const rest = { ...next };
    delete rest.page;
    const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== '' && v != null));
    setSearchParams(clean, { replace: true });
  };

  const { data, isFetching } = useListProductsQuery(filters);
  const products = data?.products || [];
  const total = data?.total || 0;
  const page = Math.max(1, Number(filters.page) || 1);
  const totalPages = data?.totalPages || 1;
  const pageSize = data?.limit || 12;

  const goToPage = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    const next = { ...filters };
    if (p <= 1) delete next.page;
    else next.page = String(p);
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== '' && v != null));
    setSearchParams(clean, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              {total > 0 ? (
                <>
                  Showing{' '}
                  <span className="font-medium text-brand-primary">
                    {(page - 1) * pageSize + 1}–{(page - 1) * pageSize + products.length}
                  </span>{' '}
                  of {total} results
                </>
              ) : (
                'No results'
              )}
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

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border border-gray-200 text-brand-primary hover:bg-brand-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {buildPageList(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-brand-muted select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={`min-w-[38px] px-3 py-2 text-sm rounded-md border transition ${
                      p === page
                        ? 'bg-brand-primary text-white border-brand-primary font-medium'
                        : 'border-gray-200 text-brand-primary hover:bg-brand-primary hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-md border border-gray-200 text-brand-primary hover:bg-brand-primary hover:text-white disabled:opacity-40 disabled:pointer-events-none transition"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
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
