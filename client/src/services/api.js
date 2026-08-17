import axios from 'axios';

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://court-6lbv.onrender.com/api'),
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
    // If unauthorized (token expired or invalid), clear localStorage and redirect to login
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request - token may have expired. Logging out.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Prevent infinite redirect loops if we are already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
