import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import LandingPage from './modules/authentication/landingPage';
import StudentDashboard from './pages/StudentDashboard';

// Directory Module
import Directory from './modules/directory/Directory';
import StaffProfile from './modules/directory/StaffProfile';

// Placeholder pages (for future implementation)
const Appointments = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">My Appointments</h2>
        <p className="text-gray-500 mt-2">View and manage your appointments</p>
        <p className="text-sm text-gray-400 mt-4">🚧 Coming soon...</p>
    </div>
);

const Feedback = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Feedback</h2>
        <p className="text-gray-500 mt-2">Submit feedback and view your history</p>
        <p className="text-sm text-gray-400 mt-4">🚧 Coming soon...</p>
    </div>
);

const Profile = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500 mt-2">Manage your personal information</p>
        <p className="text-sm text-gray-400 mt-4">🚧 Coming soon...</p>
    </div>
);

// ProtectedRoute function
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/" replace />;
    return children;
}

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />

                {/* Protected Routes */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <StudentDashboard user={user} />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/directory" 
                    element={
                        <ProtectedRoute>
                            <Directory user={user} />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/directory/:id" 
                    element={
                        <ProtectedRoute>
                            <StaffProfile user={user} />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/appointments" 
                    element={
                        <ProtectedRoute>
                            <Appointments />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/feedback" 
                    element={
                        <ProtectedRoute>
                            <Feedback />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/profile" 
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } 
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;