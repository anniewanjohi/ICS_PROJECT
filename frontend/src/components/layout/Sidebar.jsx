import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/directory', icon: '🔍', label: 'Directory' },
        { path: '/appointments', icon: '📅', label: 'Appointments' },
        { path: '/feedback', icon: '💬', label: 'Feedback' },
        { path: '/profile', icon: '👤', label: 'Profile' },
    ];

    const getUserInitial = () => {
        if (user?.profile?.first_name) return user.profile.first_name[0];
        if (user?.email) return user.email[0];
        return 'S';
    };

    const getUserName = () => {
        if (user?.profile?.first_name) return user.profile.first_name;
        if (user?.email) return user.email.split('@')[0];
        return 'Student';
    };

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-30">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-bold text-blue-600">🏫 Strathmore Directory</h1>
                <p className="text-sm text-gray-500 mt-1">Student Portal</p>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-colors ${
                                        isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                }
                            >
                                <span className="mr-3 text-xl">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                        {getUserInitial()}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserName()}
                        </p>
                        <p className="text-xs text-gray-500">{user?.role || 'Student'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;