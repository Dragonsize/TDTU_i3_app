// API utility with request deduplication, automatic token refresh, and global 401 handling
const pendingRequests = new Map();

let _isRedirecting = false;
let _isRefreshing = false;
let _refreshPromise = null;

function redirectToLogin() {
  if (_isRedirecting) return;
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    _isRedirecting = true;
    localStorage.removeItem('userProfile');
    window.location.href = '/login';
  }
}

/**
 * Attempt to refresh the access token via the backend refresh endpoint.
 * Returns true if refresh succeeded, false otherwise.
 * Deduplicates concurrent refresh attempts.
 */
async function tryRefreshToken() {
  if (_isRefreshing) {
    return _refreshPromise;
  }
  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

/**
 * Fetch with deduplication, automatic token refresh, and global 401 redirect.
 * - GET requests to the same URL are deduplicated while pending.
 * - On 401, attempts a token refresh and retries once before redirecting to /login.
 */
export async function dFetch(url, options = {}) {
  const method = options.method || 'GET';

  // Non-GET: run directly, no deduplication
  if (method !== 'GET') {
    const response = await fetch(url, options);
    if (response.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request after refresh
        return fetch(url, options);
      }
      redirectToLogin();
    }
    return response;
  }

  const cacheKey = JSON.stringify({ url, credentials: options.credentials });

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      let response = await fetch(url, options);

      // On 401, try to refresh the token and retry once
      if (response.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          response = await fetch(url, options);
          // If still 401 after refresh, redirect
          if (response.status === 401) {
            redirectToLogin();
          }
          return response;
        }
        redirectToLogin();
      }

      return response;
    } finally {
      // Small delay to absorb StrictMode double-invocation
      setTimeout(() => pendingRequests.delete(cacheKey), 500);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}
