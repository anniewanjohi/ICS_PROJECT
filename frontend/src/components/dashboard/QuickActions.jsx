import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Book Appointment',
            icon: '📅',
            color: 'bg-blue-500',
            onClick: () => navigate('/directory')
        },
        {
            label: 'Search Directory',
            icon: '🔍',
            color: 'bg-green-500',
            onClick: () => navigate('/directory')
        },
        {
            label: 'My Feedback',
            icon: '💬',
            color: 'bg-purple-500',
            onClick: () => navigate('/feedback')
        },
        {
            label: 'My Profile',
            icon: '👤',
            color: 'bg-gray-500',
            onClick: () => navigate('/profile')
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all text-center"
                    >
                        <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-2xl mx-auto mb-2`}>
                            {action.icon}
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                            {action.label}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;