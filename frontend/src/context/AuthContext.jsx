import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check login status on app load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        // Suppress console logs on boot for unauthenticated guests
        console.log('User session inactive (guest state)');
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        setUser(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout request failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Register/Create Employee handler
  const registerUser = async (userData) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        registerUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed within an AuthProvider context wrapper');
  }
  return context;
};
