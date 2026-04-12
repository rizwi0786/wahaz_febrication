import { api } from './baseApi';

export const userApi = api.injectEndpoints({
  endpoints: (b) => ({
    getProfile: b.query({
      query: () => '/users/profile',
      providesTags: ['User', 'Address'],
    }),
    updateProfile: b.mutation({
      query: (formData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
    changePassword: b.mutation({
      query: (body) => ({ url: '/users/change-password', method: 'PUT', body }),
    }),
    addAddress: b.mutation({
      query: (body) => ({ url: '/users/addresses', method: 'POST', body }),
      invalidatesTags: ['Address', 'User'],
    }),
    updateAddress: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/addresses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Address', 'User'],
    }),
    deleteAddress: b.mutation({
      query: (id) => ({ url: `/users/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address', 'User'],
    }),
    getWishlist: b.query({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: b.mutation({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: 'POST' }),
      invalidatesTags: ['Wishlist'],
    }),
    removeFromWishlist: b.mutation({
      query: (productId) => ({ url: `/wishlist/${productId}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist'],
    }),
    createReview: b.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Review', 'Product'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCreateReviewMutation,
} = userApi;
