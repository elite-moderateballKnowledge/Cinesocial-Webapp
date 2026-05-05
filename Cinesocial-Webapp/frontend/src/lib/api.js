/**
 * Default API origin. We use 127.0.0.1 (not localhost) to avoid Windows IPv6/IPv4 mismatches,
 * and we avoid same-origin `/api` by default so the app still works if the Vite proxy was not
 * picked up (e.g. dev server not restarted after vite.config.js changes — then `/api/*` returns index.html).
 * Override with VITE_API_URL (e.g. http://localhost:5000/api). Use /api only if the Vite proxy is active.
 */
const configuredBase = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = configuredBase || 'http://127.0.0.1:5000/api';

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const hint = text.trimStart().startsWith('<')
      ? ' Received HTML (often the app URL instead of the API, or the /api route is missing on the server). Check VITE_API_URL, the Vite proxy, and that the backend is running with the latest code.'
      : '';
    throw new Error(`The server returned an invalid response.${hint}`);
  }
};

export const getErrorMessage = (error) => {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
};

export const authHeaders = (headers = {}) => {
  const token = localStorage.getItem('token');
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}.`);
  }

  return data;
};
