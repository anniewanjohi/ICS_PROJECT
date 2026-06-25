// src/App.js
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './modules/authentication/landingPage';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppRouter() {
    const { user, isLoggedIn, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>Loading...</div>
                </div>
            </div>
        );
    }

    if (!isLoggedIn) return <LandingPage />;

    switch (user?.role) {
        case 'admin':   return <AdminDashboard />;
        case 'staff':   return <StaffDashboard />;
        case 'student': return <StudentDashboard />;
        default:        return <LandingPage />;
    }
}

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}
