import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
} from "../store/api/userApi";
import Loader from "../components/common/Loader";
import EmptyState from "../components/common/EmptyState";
import { formatCurrency } from "../utils/format";

export default function Wishlist() {
  const { data, isLoading } = useGetWishlistQuery();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  if (isLoading) return <Loader className="py-24" size="lg" />;

  const items = data?.wishlist || [];

  if (items.length === 0) {
    return (
      <div className="section py-12">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save products you love for later"
          action={
            <Link to="/shop" className="btn-primary">
              Explore Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="section py-8">
      <h1 className="text-2xl md:text-3xl font-serif mb-6">
        My Wishlist ({items.length})
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => {
          const price = Number(
            item.product.discountPrice || item.product.price,
          );
          const unavailable = !item.product?.isActive;
          return (
            <div
              key={item.id}
              className={`card overflow-hidden group ${unavailable ? "opacity-60" : ""}`}
            >
              <Link
                to={`/product/${item.product.slug}`}
                className="block relative aspect-[4/5] bg-gray-100"
              >
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
                <Link
                  to={`/product/${item.product.slug}`}
                  className="text-sm font-medium hover:text-brand-secondary line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="font-semibold mt-1">{formatCurrency(price)}</p>
                {unavailable && (
                  <p className="text-xs text-red-600 mt-1">
                    No longer available
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  {unavailable ? (
                    <span className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-500 cursor-not-allowed">
                      Unavailable
                    </span>
                  ) : (
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-brand-primary text-white hover:bg-brand-dark transition-all duration-200"
                    >
                      Select Options
                    </Link>
                  )}
                  <button
                    onClick={() => removeFromWishlist(item.product.id)}
                    aria-label="Remove from wishlist"
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
