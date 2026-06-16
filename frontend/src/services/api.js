// frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const api = {
  // Authentication endpoints
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error('Register API error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Verify token error:', error);
      return { success: false, message: 'Token verification failed' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  logout: async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  },
};