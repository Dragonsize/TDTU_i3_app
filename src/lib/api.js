// Simple API utility to deduplicate pending requests and handle authentication
const pendingRequests = new Map();

/**
 * Fetch with deduplication: if a request to the same URL is already pending, return its promise.
 */
export async function dFetch(url, options = {}) {
  const method = options.method || 'GET';
  
  // Only deduplicate GET requests by default
  if (method !== 'GET') {
    return fetch(url, options);
  }

  const cacheKey = JSON.stringify({ url, credentials: options.credentials });
  
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, options);
      
      // Global 401 handling if needed (can be added here)
      if (response.status === 401 && !window.location.pathname.startsWith('/login')) {
         // Optionally handle redirect here or in components
      }
      
      return response;
    } finally {
      // Small delay before clearing to prevent back-to-back duplicate calls (e.g. StrictMode)
      setTimeout(() => {
        pendingRequests.delete(cacheKey);
      }, 500); 
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}
