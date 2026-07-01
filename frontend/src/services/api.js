// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const getToken = () =>
    localStorage.getItem('token') || sessionStorage.getItem('token');

const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
});

const handle = async (res) => {
    const data = await res.json();
    return data;
};

export const api = {
    // ─── AUTH ────────────────────────────────────────────────
    login: async (email, password) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Network error. Is the server running?' };
        }
    },

    register: async (userData) => {
        try {
            // Fix field names to match backend (camelCase)
            const payload = {
                email: userData.email,
                password: userData.password,
                role: userData.role,
                profileData: userData.profileData ? {
                    firstName: userData.profileData.first_name || userData.profileData.firstName,
                    lastName: userData.profileData.last_name || userData.profileData.lastName,
                    studentRegNo: userData.profileData.studentRegNo || '',
                    program: userData.profileData.program || '',
                } : undefined,
            };
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    getMe: async () => {
        try {
            const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch user' };
        }
    },

    forgotPassword: async (email) => {
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Network error.' };
        }
    },

    logout: async () => {
        try {
            const res = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: authHeaders(),
            });
            return handle(res);
        } catch {
            return { success: false };
        }
    },

    // ─── DIRECTORY ───────────────────────────────────────────
    searchDirectory: async ({ query = '', staffType = '', departmentId = '', page = 1, limit = 12 } = {}) => {
        try {
            const params = new URLSearchParams({ query, staffType, departmentId, page, limit });
            const res = await fetch(`${API_URL}/directory/search?${params}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to search directory' };
        }
    },

    getStaffProfile: async (staffId) => {
        try {
            const res = await fetch(`${API_URL}/directory/staff/${staffId}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch profile' };
        }
    },

    getDepartments: async () => {
        try {
            const res = await fetch(`${API_URL}/directory/departments`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch departments' };
        }
    },

    // ─── APPOINTMENTS ────────────────────────────────────────
    getAvailableSlots: async (staffId) => {
        try {
            const res = await fetch(`${API_URL}/appointments/slots/${staffId}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch slots' };
        }
    },

    bookAppointment: async (data) => {
        try {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(data),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to book appointment' };
        }
    },

    getMyAppointments: async (status = '') => {
        try {
            const params = status ? `?status=${status}` : '';
            const res = await fetch(`${API_URL}/appointments/my${params}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch appointments' };
        }
    },

    respondToAppointment: async (appointmentId, status, cancellationReason = '') => {
        try {
            const res = await fetch(`${API_URL}/appointments/${appointmentId}/respond`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ status, cancellationReason }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to respond to appointment' };
        }
    },

    cancelAppointment: async (appointmentId, cancellationReason = '') => {
        try {
            const res = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ cancellationReason }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to cancel appointment' };
        }
    },

    // ─── NOTIFICATIONS ───────────────────────────────────────
    getNotifications: async (unreadOnly = false) => {
        try {
            const res = await fetch(`${API_URL}/notifications?unreadOnly=${unreadOnly}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch notifications' };
        }
    },

    markNotificationRead: async (notificationId) => {
        try {
            const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: authHeaders(),
            });
            return handle(res);
        } catch {
            return { success: false };
        }
    },

    markAllNotificationsRead: async () => {
        try {
            const res = await fetch(`${API_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: authHeaders(),
            });
            return handle(res);
        } catch {
            return { success: false };
        }
    },

    // ─── STAFF ───────────────────────────────────────────────
    getMyStaffProfile: async () => {
        try {
            const res = await fetch(`${API_URL}/staff/profile`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch staff profile' };
        }
    },

    updateStaffProfile: async (data) => {
        try {
            const res = await fetch(`${API_URL}/staff/profile`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify(data),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to update profile' };
        }
    },

    getMyAvailability: async () => {
        try {
            const res = await fetch(`${API_URL}/staff/availability`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch availability' };
        }
    },

    addAvailabilitySlot: async (data) => {
        try {
            const res = await fetch(`${API_URL}/staff/availability`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(data),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to add slot' };
        }
    },

    deleteAvailabilitySlot: async (slotId) => {
        try {
            const res = await fetch(`${API_URL}/staff/availability/${slotId}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to delete slot' };
        }
    },

    // ─── ADMIN ───────────────────────────────────────────────
    getAdminStats: async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch stats' };
        }
    },

    getAdminUsers: async ({ role = '', search = '', page = 1, limit = 20 } = {}) => {
        try {
            const params = new URLSearchParams({ role, search, page, limit });
            const res = await fetch(`${API_URL}/admin/users?${params}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch users' };
        }
    },

    updateUserStatus: async (userId, isActive) => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ isActive }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to update user' };
        }
    },

    updateUserRole: async (userId, role) => {
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ role }),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to update role' };
        }
    },

    createAdminUser: async (data) => {
        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(data),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to create user' };
        }
    },

    getAdminLogs: async ({ page = 1, limit = 50 } = {}) => {
        try {
            const params = new URLSearchParams({ page, limit });
            const res = await fetch(`${API_URL}/admin/logs?${params}`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch logs' };
        }
    },

    getAdminDepartments: async () => {
        try {
            const res = await fetch(`${API_URL}/admin/departments`, { headers: authHeaders() });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to fetch departments' };
        }
    },

    createDepartment: async (data) => {
        try {
            const res = await fetch(`${API_URL}/admin/departments`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(data),
            });
            return handle(res);
        } catch {
            return { success: false, message: 'Failed to create department' };
        }
    },
    deleteUser: async (userId) => {
    try {
        const res = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        return handle(res);
    } catch {
        return { success: false, message: 'Failed to delete user' };
    }
},
};
