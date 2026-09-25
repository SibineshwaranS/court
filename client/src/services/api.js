import axios from 'axios';

// Create Axios Instance targeting local Express server (port 5000)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
      
      // Redirect to login only if not already on login page
      if (!isLoginPage) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
