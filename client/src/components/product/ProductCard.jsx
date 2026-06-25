import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/format';
import { useWishlist } from '../../hooks/useWishlist';

export default function ProductCard({ product }) {
  const { isAuth, isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const wished = isWishlisted(product.id);

  const primaryImg = product.images?.[0]?.url;
  const hoverImg = product.images?.[1]?.url || primaryImg;
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isAuth) return toast.error('Please sign in to add to wishlist');
    try {
      if (wished) {
        await removeFromWishlist(product.id).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id).unwrap();
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden rounded-lg">
        {primaryImg && (
          <img
            src={primaryImg}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-300"
          />
        )}
        {hoverImg && (
          <img
            src={hoverImg}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        )}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-brand-secondary text-white text-xs font-bold px-2 py-1 rounded">
            {product.discountPercent || Math.round((1 - Number(product.discountPrice) / Number(product.price)) * 100)}% OFF
          </span>
        )}
        {product.isNewArrival && (
          <span className="absolute top-3 right-12 bg-brand-primary text-white text-xs font-medium px-2 py-1 rounded">
            NEW
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow transition"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
        >
          <Heart
            size={16}
            className={wished ? 'fill-brand-secondary text-brand-secondary' : 'text-brand-primary'}
          />
        </button>
      </div>

      <div className="pt-3 space-y-1">
        <h3 className="text-sm font-medium text-brand-primary line-clamp-1">{product.name}</h3>
        <p className="text-xs text-brand-muted capitalize">{product.categories?.[0]?.name}</p>
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="font-semibold text-brand-primary">{formatCurrency(product.discountPrice)}</span>
              <span className="text-sm text-brand-muted line-through">{formatCurrency(product.price)}</span>
            </>
          ) : (
            <span className="font-semibold text-brand-primary">{formatCurrency(product.price)}</span>
          )}
        </div>
        {Number(product.avgRating) > 0 && (
          <div className="flex items-center gap-1 text-xs text-brand-muted">
            <Star size={12} className="fill-brand-secondary text-brand-secondary" />
            <span>{Number(product.avgRating).toFixed(1)}</span>
            <span>({product.totalReviews})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
