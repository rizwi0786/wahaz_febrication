import { api } from './baseApi';

export const adminApi = api.injectEndpoints({
  endpoints: (b) => ({
    // Stats
    getStats: b.query({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),
    getRevenueChart: b.query({
      query: () => '/admin/stats/revenue-chart',
      providesTags: ['AdminStats'],
    }),
    getTopProducts: b.query({
      query: () => '/admin/stats/top-products',
      providesTags: ['AdminStats'],
    }),
    getRecentOrders: b.query({
      query: () => '/admin/stats/recent-orders',
      providesTags: ['AdminStats'],
    }),

    // Products
    adminListProducts: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return `/admin/products${q ? `?${q}` : ''}`;
      },
      providesTags: ['Product'],
    }),
    adminGetProduct: b.query({
      query: (id) => `/admin/products/${id}`,
      providesTags: (r, e, id) => [{ type: 'Product', id }],
    }),
    createProduct: b.mutation({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: b.mutation({
      query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    uploadProductImages: b.mutation({
      query: ({ id, formData }) => ({
        url: `/admin/products/${id}/images`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Product'],
    }),
    deleteProductImage: b.mutation({
      query: ({ id, imageId }) => ({
        url: `/admin/products/${id}/images/${imageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // Categories
    createCategory: b.mutation({
      query: (formData) => ({ url: '/admin/categories', method: 'POST', body: formData }),
      invalidatesTags: ['Category'],
    }),
    updateCategory: b.mutation({
      query: ({ id, formData }) => ({
        url: `/admin/categories/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: b.mutation({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),

    // Orders
    listAllOrders: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return `/admin/orders${q ? `?${q}` : ''}`;
      },
      providesTags: ['Order'],
    }),
    adminGetOrder: b.query({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'Order', id }],
    }),
    updateOrderStatus: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Order'],
    }),

    // Users
    listUsers: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return `/admin/users${q ? `?${q}` : ''}`;
      },
      providesTags: ['User'],
    }),
    createUser: b.mutation({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    toggleBlockUser: b.mutation({
      query: (id) => ({ url: `/admin/users/${id}/block`, method: 'PUT' }),
      invalidatesTags: ['User'],
    }),

    // Coupons
    listCoupons: b.query({
      query: () => '/admin/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: b.mutation({
      query: (body) => ({ url: '/admin/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/coupons/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Coupon'],
    }),
    deleteCoupon: b.mutation({
      query: (id) => ({ url: `/admin/coupons/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Coupon'],
    }),

    // Banners
    listAllBanners: b.query({
      query: () => '/admin/banners',
      providesTags: ['Banner'],
    }),
    createBanner: b.mutation({
      query: (formData) => ({ url: '/admin/banners', method: 'POST', body: formData }),
      invalidatesTags: ['Banner'],
    }),
    updateBanner: b.mutation({
      query: ({ id, formData }) => ({
        url: `/admin/banners/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Banner'],
    }),
    deleteBanner: b.mutation({
      query: (id) => ({ url: `/admin/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Banner'],
    }),

    // Reviews
    listAllReviews: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return `/admin/reviews${q ? `?${q}` : ''}`;
      },
      providesTags: ['Review'],
    }),
    approveReview: b.mutation({
      query: (id) => ({ url: `/admin/reviews/${id}/approve`, method: 'PUT' }),
      invalidatesTags: ['Review'],
    }),
    deleteReview: b.mutation({
      query: (id) => ({ url: `/admin/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetRevenueChartQuery,
  useGetTopProductsQuery,
  useGetRecentOrdersQuery,
  useAdminListProductsQuery,
  useAdminGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListAllOrdersQuery,
  useAdminGetOrderQuery,
  useUpdateOrderStatusMutation,
  useListUsersQuery,
  useCreateUserMutation,
  useToggleBlockUserMutation,
  useListCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useListAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useListAllReviewsQuery,
  useApproveReviewMutation,
  useDeleteReviewMutation,
} = adminApi;
