import axios from 'axios';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  , // Backend port connection
  withCredentials: true, // MANDATORY: Enables sharing of cookie session tokens across localhost ports
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
