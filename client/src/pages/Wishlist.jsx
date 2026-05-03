import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from '../store/api/userApi';
import { useAddToCartMutation } from '../store/api/cartApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/format';

export default function Wishlist() {
  const { data, isLoading } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [addToCart] = useAddToCartMutation();

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const items = data?.wishlist || [];

  if (items.length === 0) {
    return (
      <div className="section py-12">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love for later"
          action={<Link to="/shop" className="btn-primary">Explore Products</Link>}
        />
      </div>
    );
  }

  const handleMoveToCart = async (item) => {
    const firstVariant = item.product.variants?.[0];
    if (!firstVariant) return toast.error('No variants available');
    try {
      await addToCart({
        productId: item.product.id,
        variantId: firstVariant.id,
        quantity: 1,
      }).unwrap();
      await removeFromWishlist(item.product.id).unwrap();
      toast.success('Moved to cart');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <div className="section py-8">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => {
          const price = Number(item.product.discountPrice || item.product.price);
          const unavailable = !item.product?.isActive;
          return (
            <div key={item.id} className={`card overflow-hidden group ${unavailable ? 'opacity-60' : ''}`}>
              <Link to={`/product/${item.product.slug}`} className="block relative aspect-[4/5] bg-gray-100">
                <img
                  src={item.product.images?.[0]?.url}
                  alt={item.product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {unavailable && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-medium px-2 py-1 rounded">
                    Unavailable
                  </span>
                )}
              </Link>
              <div className="p-4">
                <Link to={`/product/${item.product.slug}`} className="text-sm font-medium hover:text-brand-secondary line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="font-semibold mt-1">{formatCurrency(price)}</p>
                {unavailable && (
                  <p className="text-xs text-red-600 mt-1">No longer available</p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleMoveToCart(item)}
                    disabled={unavailable}
                    className="flex-1"
                  >
                    Move to cart
                  </Button>
                  <button
                    onClick={() => removeFromWishlist(item.product.id)}
                    className="p-2 border border-gray-300 rounded hover:border-red-500 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
