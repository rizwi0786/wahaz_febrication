import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logOut } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * On first mount, try to get a new access token via the refresh cookie.
 * If it succeeds, fetch /auth/me to hydrate the user. This lets the app
 * recover an authenticated session after a page reload without storing
 * anything in localStorage.
 */
export function useAuthBootstrap() {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('no session');
        const data = await res.json();
        if (!data.accessToken) throw new Error('no token');

        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
          credentials: 'include',
        });
        if (!meRes.ok) throw new Error('me failed');
        const meData = await meRes.json();
        if (!cancelled) {
          dispatch(setCredentials({ user: meData.user, accessToken: data.accessToken }));
        }
      } catch {
        if (!cancelled) dispatch(logOut());
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return ready;
}
