import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../dashboard/NotificationBell';
import StudentApi from '../../services/studentApi';

const Header = ({ user }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await StudentApi.getNotifications();
            if (response.success) {
                setNotifications(response.data || []);
                const unread = (response.data || []).filter(n => !n.is_read);
                setUnreadCount(unread.length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkRead = async (notificationId) => {
        try {
            await StudentApi.markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.notification_id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await StudentApi.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Student Dashboard</h2>
                    <p className="text-sm text-gray-500">
                        Welcome back, {user?.profile?.first_name || 'Student'}!
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <NotificationBell
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkRead={handleMarkRead}
                        onMarkAllRead={handleMarkAllRead}
                    />
                    <button
                        onClick={() => navigate('/directory')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        🔍 Search Directory
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;