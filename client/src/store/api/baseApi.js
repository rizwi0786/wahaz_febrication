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

// `apiCtx` is the per-request BaseQueryApi (dispatch/getState/signal). It is
// named distinctly so it doesn't shadow the exported `api` instance below,
// which we need to reach `api.util.resetApiState()` on session expiry.
const baseQueryWithReauth = async (args, apiCtx, extraOptions) => {
  let result = await rawBaseQuery(args, apiCtx, extraOptions);

  if (result.error?.status === 401) {
    if (!refreshPromise) {
      refreshPromise = rawBaseQuery(
        { url: '/auth/refresh-token', method: 'POST' },
        apiCtx,
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
      apiCtx.dispatch(setAccessToken(refreshResult.data.accessToken));
      result = await rawBaseQuery(args, apiCtx, extraOptions);
    } else {
      apiCtx.dispatch(logOut());
      // Session is gone — clear cached user data (wishlist/cart counts, etc.)
      // so stale badges don't linger, matching the manual-logout path.
      apiCtx.dispatch(api.util.resetApiState());
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
    'CustomOrder',
    'Consultation',
    'Newsletter',
  ],
  endpoints: () => ({}),
});
