import { api } from './baseApi';

export const cartApi = api.injectEndpoints({
  endpoints: (b) => ({
    getCart: b.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: b.mutation({
      query: (body) => ({ url: '/cart', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: b.mutation({
      query: ({ itemId, quantity }) => ({
        url: `/cart/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    removeCartItem: b.mutation({
      query: (itemId) => ({ url: `/cart/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: b.mutation({
      query: () => ({ url: '/cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    validateCoupon: b.mutation({
      query: (body) => ({ url: '/coupons/validate', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useValidateCouponMutation,
} = cartApi;
