import { api } from './baseApi';

function toQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    q.set(k, Array.isArray(v) ? v.join(',') : v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const productApi = api.injectEndpoints({
  endpoints: (b) => ({
    listProducts: b.query({
      query: (params) => `/products${toQuery(params)}`,
      providesTags: ['Product'],
    }),
    getProduct: b.query({
      query: (slug) => `/products/${slug}`,
      providesTags: (r, e, slug) => [{ type: 'Product', id: slug }],
    }),
    featuredProducts: b.query({
      query: () => '/products/featured',
      providesTags: ['Product'],
    }),
    newArrivals: b.query({
      query: () => '/products/new-arrivals',
      providesTags: ['Product'],
    }),
    productsByCategory: b.query({
      query: (slug) => `/products/category/${slug}`,
      providesTags: ['Product'],
    }),
    productReviews: b.query({
      query: (id) => `/products/${id}/reviews`,
      providesTags: (r, e, id) => [{ type: 'Review', id }],
    }),
    listCategories: b.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    listBanners: b.query({
      query: () => '/banners',
      providesTags: ['Banner'],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useFeaturedProductsQuery,
  useNewArrivalsQuery,
  useProductsByCategoryQuery,
  useProductReviewsQuery,
  useListCategoriesQuery,
  useListBannersQuery,
} = productApi;
