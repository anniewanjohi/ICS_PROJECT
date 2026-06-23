import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpcomingAppointments = ({ appointments }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            'confirmed': { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
            'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
            'completed': { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
            'rescheduled': { color: 'bg-purple-100 text-purple-800', label: 'Rescheduled' }
        };
        return statusMap[status] || statusMap['pending'];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-KE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!appointments || appointments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                <p className="text-gray-500">📅 No upcoming appointments</p>
                <button
                    onClick={() => navigate('/directory')}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Book an Appointment
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                <p className="text-sm text-gray-500 mt-1">
                    You have {appointments.length} appointment{appointments.length > 1 ? 's' : ''} scheduled
                </p>
            </div>

            <div className="divide-y divide-gray-100">
                {appointments.slice(0, 5).map((appointment) => (
                    <div
                        key={appointment.appointment_id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/appointments/${appointment.appointment_id}`)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap">
                                    <p className="font-medium text-gray-900">
                                        {appointment.staff_title || ''} {appointment.staff_name}
                                    </p>
                                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status).color}`}>
                                        {getStatusBadge(appointment.status).label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span>📅 {formatDate(appointment.appointment_date)}</span>
                                    <span>🕐 {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                                    {appointment.meeting_location && (
                                        <span>📍 {appointment.meeting_location}</span>
                                    )}
                                </div>
                                {appointment.purpose && (
                                    <p className="text-sm text-gray-500 mt-1 truncate max-w-md">
                                        📝 {appointment.purpose}
                                    </p>
                                )}
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/appointments/${appointment.appointment_id}`);
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    View →
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {appointments.length > 5 && (
                <div className="p-4 border-t border-gray-100 text-center">
                    <button
                        onClick={() => navigate('/appointments')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        View all appointments
                    </button>
                </div>
            )}
        </div>
    );
};

export default UpcomingAppointments;