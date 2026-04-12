import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setAccessToken, logOut } from '../slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include', // send refresh token cookie on auth routes
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Wraps fetchBaseQuery with automatic refresh-token rotation on 401.
 * A single refresh is in flight at a time; concurrent 401s wait on the
 * same promise to avoid a stampede.
 */
let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = rawBaseQuery(
        { url: '/auth/refresh-token', method: 'POST' },
        api,
        extraOptions
      ).finally(() => {
        // clear after the next microtask so concurrent callers see the same result
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
    }
    const refreshResult = await refreshPromise;

    if (refreshResult.data?.accessToken) {
      api.dispatch(setAccessToken(refreshResult.data.accessToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Product',
    'Category',
    'Cart',
    'Order',
    'User',
    'Address',
    'Review',
    'Coupon',
    'Wishlist',
    'Banner',
    'AdminStats',
  ],
  endpoints: () => ({}),
});
