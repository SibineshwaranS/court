import axios from 'axios';

// Create Axios Instance targeting local Express backend API (/api)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle responses and global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
    const isLoginPage = window.location.pathname.includes('/login');

    // Handle 401 Unauthorized (expired/invalid token)
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      console.warn('Unauthorized request - token expired or invalid.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!isLoginPage) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
