import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is logged in on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Verify token with backend
            const response = await api.get('/auth/verify');
            if (response.data.success) {
                setUser(response.data.data.user);
                setIsAuthenticated(true);
            } else {
                // Token invalid, clear storage
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                
                // Store token
                localStorage.setItem('token', token);
                
                // Set user state
                setUser(user);
                setIsAuthenticated(true);
                
                return { success: true, user };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        }
    };

    const logout = () => {
        // Clear local storage
        localStorage.removeItem('token');
        
        // Clear state
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUser = (updatedUserData) => {
        setUser(prev => ({ ...prev, ...updatedUserData }));
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;