import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// FIX: safe fallback for Vercel
const API_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://codebrainai.onrender.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password }
    );

    // FIX: match backend response (NO session)
    const { user: userData, access_token } = response.data;

    if (!access_token) {
      throw new Error("No access token returned from backend");
    }

    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);

    return userData;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      { email, password, name }
    );

    const { user: userData, access_token } = response.data;

    if (access_token) {
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
    }

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};