import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('astrovedic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect
      localStorage.removeItem('astrovedic_token');
      localStorage.removeItem('astrovedic_user');
      // Only redirect if not already on login/signup/public pages
      const publicPaths = ['/login', '/signup', '/', '/nakshatra-ai', '/astrologers', '/rashifal', '/cosmic-store', '/plans', '/blog'];
      const currentPath = window.location.pathname;
      if (!publicPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'))) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
