import React from 'react';

const StatsCards = ({ stats }) => {
    const statItems = [
        {
            label: 'Total Appointments',
            value: stats?.total || 0,
            icon: '📋',
            color: 'bg-blue-500'
        },
        {
            label: 'Upcoming',
            value: stats?.upcoming || 0,
            icon: '📅',
            color: 'bg-green-500'
        },
        {
            label: 'Pending',
            value: stats?.pending || 0,
            icon: '⏳',
            color: 'bg-yellow-500'
        },
        {
            label: 'Completed',
            value: stats?.completed || 0,
            icon: '✅',
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((item, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{item.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {item.value}
                            </p>
                        </div>
                        <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                            {item.icon}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;