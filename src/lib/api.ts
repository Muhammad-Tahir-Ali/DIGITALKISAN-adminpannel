import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30s — enough time for Render cold start
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dk_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as typeof error.config & { _retryCount?: number };

    // Auto-retry once on network errors (covers Render cold-start timeouts)
    const isNetworkError = !error.response;
    const alreadyRetried = config._retryCount && config._retryCount >= 1;

    if (isNetworkError && !alreadyRetried) {
      config._retryCount = 1;
      await sleep(5000); // wait 5s for Render to wake up
      return api(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('dk_admin_token');
      localStorage.removeItem('dk_admin_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
