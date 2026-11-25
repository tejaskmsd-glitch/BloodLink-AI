import axios from 'axios';

// By default in local development and standard deployments, use relative '/api'.
// This ensures all requests are same-origin to whatever port Vite or the web server is running on,
// eliminating CORS preflight, port mismatch, and cookie/session issues entirely.
// Vite proxy automatically forwards '/api' to the backend target.
// An optional explicit VITE_API_URL can still override this if building for a decoupled CDN or mobile app.
const configuredURL = import.meta.env.VITE_API_URL;
const baseURL = configuredURL
  ? (configuredURL.endsWith('/api') ? configuredURL : `${configuredURL.replace(/\/+$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 if token expired or invalid
      if (localStorage.getItem('token') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
