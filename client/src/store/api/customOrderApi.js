import { api } from './baseApi';

export const customOrderApi = api.injectEndpoints({
  endpoints: (b) => ({
    createCustomOrder: b.mutation({
      query: (body) => ({ url: '/custom-orders', method: 'POST', body }),
      invalidatesTags: ['CustomOrder'],
    }),
    myCustomOrders: b.query({
      query: () => '/custom-orders',
      providesTags: ['CustomOrder'],
    }),
    getCustomOrder: b.query({
      query: (id) => `/custom-orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'CustomOrder', id }],
    }),
    counterOffer: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/custom-orders/${id}/counter-offer`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomOrder'],
    }),
    acceptQuote: b.mutation({
      query: (id) => ({ url: `/custom-orders/${id}/accept`, method: 'POST' }),
      invalidatesTags: ['CustomOrder'],
    }),
    cancelCustomOrder: b.mutation({
      query: (id) => ({ url: `/custom-orders/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['CustomOrder'],
    }),
    placeCustomOrder: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/custom-orders/${id}/place-order`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomOrder', 'Order'],
    }),

    // Admin
    adminListCustomOrders: b.query({
      query: (params = {}) => ({ url: '/admin/custom-orders', params }),
      providesTags: ['CustomOrder'],
    }),
    adminGetCustomOrder: b.query({
      query: (id) => `/admin/custom-orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'CustomOrder', id }],
    }),
    adminQuotePrice: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/custom-orders/${id}/quote`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomOrder'],
    }),
    adminRespondCounter: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/custom-orders/${id}/respond-counter`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomOrder'],
    }),
    adminRejectCustomOrder: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/custom-orders/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomOrder'],
    }),
  }),
});

export const {
  useCreateCustomOrderMutation,
  useMyCustomOrdersQuery,
  useGetCustomOrderQuery,
  useCounterOfferMutation,
  useAcceptQuoteMutation,
  useCancelCustomOrderMutation,
  usePlaceCustomOrderMutation,
  useAdminListCustomOrdersQuery,
  useAdminGetCustomOrderQuery,
  useAdminQuotePriceMutation,
  useAdminRespondCounterMutation,
  useAdminRejectCustomOrderMutation,
} = customOrderApi;
