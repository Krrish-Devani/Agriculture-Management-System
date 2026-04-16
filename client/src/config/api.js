import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBaseURL.endsWith('/api')
  ? rawBaseURL.replace(/\/+$/, '')
  : rawBaseURL.replace(/\/+$/, '') + '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('session');
  if (session) {
    const parsed = JSON.parse(session);
    config.headers.Authorization = `Bearer ${parsed.access_token}`;
  }
  return config;
});

// Handle 401 responses — but only redirect if the URL is NOT an auth endpoint
// (avoids wiping a freshly set session on profile fetch failures)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('session');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
