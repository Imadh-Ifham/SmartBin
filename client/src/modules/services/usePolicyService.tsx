import { useEffect, useMemo } from 'react';
import { PolicyService } from './PolicyService';
import { useAppSelector } from '../../app/hooks';

function getTokenFromLocalStorage() {
  try {
    const keys = ['token', 'authToken', 'accessToken', 'auth.token', 'auth.accessToken'];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    // maybe stored as JSON under 'auth'
    const authJson = localStorage.getItem('auth');
    if (authJson) {
      try {
        const parsed = JSON.parse(authJson);
        return parsed?.token || parsed?.accessToken || null;
      } catch (parseErr) {
        void parseErr;
      }
    }
  } catch (err) {
    // ignore access errors but keep for debug if needed
    console.debug?.('localStorage access error', err);
  }
  return null;
}

function getTokenFromCookies() {
  try {
    const raw = document.cookie || '';
    const pairs = raw.split(';').map((p) => p.trim());
    for (const p of pairs) {
      if (!p) continue;
      const [k, ...rest] = p.split('=');
      const key = k?.trim();
      const val = rest.join('=');
      if (['token', 'authToken', 'accessToken'].includes(key)) return decodeURIComponent(val);
    }
  } catch (err) {
    // ignore cookie parsing errors
    console.debug?.('cookie parse error', err);
  }
  return null;
}

/**
 * Hook: usePolicyService
 * - attempts to read token from Redux (common locations), then localStorage, then cookies
 * - sets Authorization header on the shared PolicyService instance
 * - returns the PolicyService instance for use in components/hooks
 */
export const usePolicyService = () => {
  // Try Redux first (common slice names). If your app uses another slice, update the selector.
  const reduxToken = useAppSelector((s) => {
    // Root state may contain multiple slices; treat as unknown and safely read common token paths
    const st = s as unknown as Record<string, unknown>;
    const auth = st['auth'] as Record<string, unknown> | undefined;
    const user = st['user'] as Record<string, unknown> | undefined;
    const session = st['session'] as Record<string, unknown> | undefined;
    return (
      (auth && (auth['token'] as string)) ||
      (user && (user['token'] as string)) ||
      (session && (session['token'] as string)) ||
      null
    );
  });

  const token = useMemo(() => {
    if (reduxToken) return reduxToken;
    const ls = getTokenFromLocalStorage();
    if (ls) return ls;
    const ck = getTokenFromCookies();
    if (ck) return ck;
    return null;
  }, [reduxToken]);

  useEffect(() => {
    PolicyService.setAuthToken(token);
  }, [token]);

  return PolicyService;
};

export default usePolicyService;
