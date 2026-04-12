import { api } from './baseApi';

export const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: b.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    forgotPassword: b.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: b.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    verifyEmail: b.query({
      query: (token) => `/auth/verify-email/${token}`,
    }),
    me: b.query({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailQuery,
  useMeQuery,
  useLazyMeQuery,
} = authApi;
