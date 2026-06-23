import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated, requiredRole, user }) => {
    // Check if authenticated
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;