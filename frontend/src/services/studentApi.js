import api from './api';

class StudentApi {
    static async getProfile() {
        const response = await api.get('/students/profile');
        return response.data;
    }

    static async updateProfile(profileData) {
        const response = await api.put('/students/profile', profileData);
        return response.data;
    }

    static async getUpcomingAppointments() {
        const response = await api.get('/appointments/upcoming');
        return response.data;
    }

    static async getAppointmentHistory(page = 1, limit = 10) {
        const response = await api.get(`/appointments/history?page=${page}&limit=${limit}`);
        return response.data;
    }

    static async getAppointmentDetails(appointmentId) {
        const response = await api.get(`/appointments/${appointmentId}`);
        return response.data;
    }

    static async cancelAppointment(appointmentId, reason) {
        const response = await api.put(`/appointments/${appointmentId}/cancel`, { reason });
        return response.data;
    }

    static async getDashboardStats() {
        const response = await api.get('/stats/dashboard');
        return response.data;
    }

    static async getNotifications() {
        const response = await api.get('/notifications');
        return response.data;
    }

    static async markNotificationRead(notificationId) {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    }

    static async markAllNotificationsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    }

    static async submitFeedback(appointmentId, rating, comment, isAnonymous = false) {
        const response = await api.post('/feedback', {
            appointmentId,
            rating,
            comment,
            isAnonymous
        });
        return response.data;
    }

    static async getFeedbackHistory() {
        const response = await api.get('/feedback/history');
        return response.data;
    }

    static async changePassword(currentPassword, newPassword) {
        const response = await api.put('/users/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    }
}

export default StudentApi;