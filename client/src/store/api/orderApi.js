import { api } from './baseApi';

export const orderApi = api.injectEndpoints({
  endpoints: (b) => ({
    placeOrder: b.mutation({
      query: (body) => ({ url: '/orders', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    verifyPayment: b.mutation({
      query: (body) => ({ url: '/orders/verify-payment', method: 'POST', body }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    myOrders: b.query({
      query: () => '/orders',
      providesTags: ['Order'],
    }),
    getOrder: b.query({
      query: (id) => `/orders/${id}`,
      providesTags: (r, e, id) => [{ type: 'Order', id }],
    }),
    cancelOrder: b.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useVerifyPaymentMutation,
  useMyOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
} = orderApi;
