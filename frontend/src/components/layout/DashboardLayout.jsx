import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ user, onLogout, children }) => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar user={user} onLogout={onLogout} />
            <div className="flex-1 flex flex-col ml-64 overflow-hidden">
                <Header user={user} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;