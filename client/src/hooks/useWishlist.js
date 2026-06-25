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
    count: ids.size,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
  };
}
