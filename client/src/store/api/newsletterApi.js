import { api } from './baseApi';

export const newsletterApi = api.injectEndpoints({
  endpoints: (b) => ({
    subscribeNewsletter: b.mutation({
      query: (body) => ({ url: '/newsletter', method: 'POST', body }),
      invalidatesTags: ['Newsletter'],
    }),

    // Admin
    adminListSubscribers: b.query({
      query: (params = {}) => ({ url: '/admin/newsletter', params }),
      providesTags: ['Newsletter'],
    }),
  }),
});

export const {
  useSubscribeNewsletterMutation,
  useAdminListSubscribersQuery,
} = newsletterApi;
