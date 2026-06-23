import React, { useState, useRef, useEffect } from 'react';

const NotificationBell = ({ notifications, unreadCount, onMarkRead, onMarkAllRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment_confirmed': return '✅';
            case 'appointment_cancelled': return '❌';
            case 'appointment_created': return '📅';
            case 'reminder': return '⏰';
            case 'system': return '📢';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'appointment_confirmed': return 'text-green-600';
            case 'appointment_cancelled': return 'text-red-600';
            case 'appointment_created': return 'text-blue-600';
            case 'reminder': return 'text-yellow-600';
            case 'system': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    const formatTime = (date) => {
        const diff = new Date() - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllRead}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div>
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => onMarkRead(notification.notification_id)}
                                >
                                    <div className="flex items-start">
                                        <span className={`mr-3 ${getNotificationColor(notification.type)}`}>
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 10 && (
                        <div className="p-3 border-t border-gray-200 text-center sticky bottom-0 bg-white">
                            <button className="text-sm text-blue-600 hover:text-blue-800">
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;