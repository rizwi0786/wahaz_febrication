import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from '../store/api/userApi';

/**
 * Shared wishlist state. RTK Query dedupes/caches the `getWishlist` query and
 * the `Wishlist` tag is invalidated on add/remove, so every component that
 * calls this hook (Navbar badge, ProductCard, ProductDetail) stays in sync.
 *
 * The query is skipped when the user is signed out to avoid 401s.
 */
export function useWishlist() {
  const isAuth = useSelector(selectIsAuthenticated);
  const { data } = useGetWishlistQuery(undefined, { skip: !isAuth });
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const wishlist = data?.wishlist;

  const ids = useMemo(
    () => new Set((wishlist || []).map((i) => i.product?.id ?? i.productId)),
    [wishlist]
  );

  const isWishlisted = useCallback((productId) => ids.has(productId), [ids]);

  return {
    isAuth,
    // Gate the count on auth state so the badge reads 0 the instant the user
    // logs out — independent of when RTK Query evicts the cached wishlist
    // (a skipped query still returns its last cached data until GC).
    count: isAuth ? ids.size : 0,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
  };
}
