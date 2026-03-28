export async function dFetch(input, init = {}) {
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };

  const options = {
    credentials: "include",
    ...init,
    headers,
  };

  return fetch(input, options);
}
