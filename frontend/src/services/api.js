import axios from 'axios';

// Create a pre-configured axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true, // Required so the httpOnly auth cookie is sent with each request
    headers: {
      'Content-Type': 'application/json',
    },
  });

// Response interceptor for centralized error mapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Catch session expirations and reject access
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized request. Redirecting user to login.');
      // Optional check to avoid redirection loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Process error payload
    let message = 'Something went wrong with the API connection.';
    if (error.response?.data) {
      message = error.response.data.message || error.response.data.error || message;
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
