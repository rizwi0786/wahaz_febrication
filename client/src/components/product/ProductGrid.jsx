import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Loader';

export default function ProductGrid({ products, loading, cols = 4 }) {
  const gridCols = {
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[cols]} gap-6`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return <p className="text-center text-brand-muted py-12">No products found.</p>;
  }

  return (
    <div className={`grid ${gridCols[cols]} gap-6`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
