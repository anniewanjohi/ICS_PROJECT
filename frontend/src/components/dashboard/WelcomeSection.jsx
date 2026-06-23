import React from 'react';

const WelcomeSection = ({ user }) => {
    // Get current time for greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getStudentName = () => {
        if (user?.profile) {
            return `${user.profile.first_name} ${user.profile.last_name}`;
        }
        return user?.email?.split('@')[0] || 'Student';
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {getGreeting()}, {getStudentName()}! 👋
                    </h1>
                    <p className="text-blue-100 mt-1">
                        Welcome to Strathmore University Information Directory
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-blue-100">
                        {user?.profile?.student_reg_no && (
                            <span>🎓 {user.profile.student_reg_no}</span>
                        )}
                        {user?.profile?.program && (
                            <span>📚 {user.profile.program}</span>
                        )}
                        {user?.profile?.year_of_study && (
                            <span>📖 Year {user.profile.year_of_study}</span>
                        )}
                        {user?.role && (
                            <span className="px-2 py-1 bg-white/20 rounded-full">
                                {user.role}
                            </span>
                        )}
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                        🎓
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;