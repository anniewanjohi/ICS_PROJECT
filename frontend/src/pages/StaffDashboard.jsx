// src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Avatar = ({ name, size = 48 }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: '#1a2744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>{initials}</div>
    );
};

const Badge = ({ label, color = '#1a2744' }) => (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {label}
    </span>
);

const typeLabel = (t) => {
    if (t === 'student_representative' || t === 'student_rep') return null;
    const labels = { lecturer: 'Lecturer', mentor: 'Mentor', administrative: 'Admin Staff' };
    return labels[t] || t;
};

const typeColor = (t) => {
    const colors = { lecturer: '#1a2744', mentor: '#7c3aed', administrative: '#0369a1' };
    return colors[t] || '#64748b';
};

const renderRoleBadges = (item) => {
    const badges = [];
    const isStudentRep = item.source_type === 'student_rep';
    
    if (!isStudentRep && item.staff_type) {
        const label = typeLabel(item.staff_type);
        if (label) {
            badges.push(<Badge key="main" label={label} color={typeColor(item.staff_type)} />);
        }
    }
    
    if (item.is_mentor === true || item.is_mentor === 1) {
        badges.push(<Badge key="mentor" label="Mentor" color="#7c3aed" />);
    }
    
    if (isStudentRep && item.rep_role) {
        const roles = item.rep_role.split(',').map(r => r.trim());
        roles.forEach((role, idx) => {
            if (role && role !== 'Student Rep' && role !== 'student_representative') {
                badges.push(<Badge key={`rep-${idx}`} label={role} color="#b45309" />);
            }
        });
    }
    
    return badges;
};

const styles = {
    container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    navbar: { background: '#1a2744', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 },
    navBtn: (active) => ({ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400 }),
    main: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px', paddingBottom: '100px' },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
    label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
    btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
    btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
    textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 12 },
    fab: { position: 'fixed', bottom: 24, right: 24, background: '#1a2744', color: '#fff', border: 'none', borderRadius: '50%', width: 60, height: 60, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, zIndex: 1000, transition: 'all 0.2s' },
    fabBadge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 8px', fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center' },
};

export default function StaffDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('directory');
    const [appointments, setAppointments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [slots, setSlots] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [faculties, setFaculties] = useState([]);

    const [dirQuery, setDirQuery] = useState('');
    const [dirTypeFilter, setDirTypeFilter] = useState('');
    const [dirFacultyFilter, setDirFacultyFilter] = useState('');
    const [dirResults, setDirResults] = useState([]);
    const [dirLoading, setDirLoading] = useState(false);
    const [searchTimer, setSearchTimer] = useState(null);

    const [profileForm, setProfileForm] = useState({
        firstName: '', lastName: '', title: '', position: '', staffType: 'lecturer',
        isMentor: false, officeLocation: '', officeHours: '', officialEmail: '',
        areasOfSpecialization: '', biography: '', isAvailableForBooking: true,
        faculty: '', phoneExtension: ''
    });

    const [slotForm, setSlotForm] = useState({
        dayOfWeek: '', startTime: '', endTime: '', slotDuration: 30,
        location: '', isRecurring: true, specificDate: '', meetingLink: '',
        officeLocation: '', meetingType: 'physical'
    });

    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ date: '', startTime: '', endTime: '', reason: '' });
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [attendanceAppointmentId, setAttendanceAppointmentId] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState('');

    const facultyFilterButtons = [
        { val: '', label: 'All Faculties' },
        { val: 'SCES', label: 'SCES' },
        { val: 'SOB', label: 'SOB' },
        { val: 'SHSS', label: 'SHSS' },
        { val: 'SOL', label: 'SOL' },
        { val: 'STH', label: 'STH' },
        { val: 'SIMS', label: 'SIMS' },
        { val: 'SIMT', label: 'SIMT' },
        { val: 'CRTS', label: 'CRTS' },
    ];

    useEffect(() => {
        if (view === 'directory') {
            const delayDebounce = setTimeout(() => {
                handleDirectorySearch();
            }, 100);
            return () => clearTimeout(delayDebounce);
        }
    }, [dirTypeFilter, dirFacultyFilter]);

    useEffect(() => {
        if (searchTimer) clearTimeout(searchTimer);
        const timer = setTimeout(() => {
            if (view === 'directory') handleDirectorySearch();
        }, 300);
        setSearchTimer(timer);
        return () => clearTimeout(timer);
    }, [dirQuery]);

    useEffect(() => { 
        loadAppointments(); 
        loadNotifications(); 
        loadFaculties();
        loadSlots();
        setTimeout(handleDirectorySearch, 300);
    }, []);

    useEffect(() => {
        const pending = appointments.filter(a => a.status === 'pending');
        setPendingCount(pending.length);
    }, [appointments]);

    const loadAppointments = async () => {
        const res = await api.getMyAppointments();
        if (res.success) setAppointments(res.data.appointments);
    };

    const loadFaculties = async () => {
        const res = await api.getFaculties();
        if (res.success) setFaculties(res.data.faculties);
    };

    const loadProfile = async () => {
        const profileRes = await api.getMyStaffProfile();
        if (profileRes.success) {
            const p = profileRes.data.profile;
            setProfile(p);
            setProfileForm({
                firstName: p.first_name || '',
                lastName: p.last_name || '',
                title: p.title || '',
                position: p.position || '',
                staffType: p.staff_type || 'lecturer',
                isMentor: p.is_mentor === 1 || p.is_mentor === true,
                officeLocation: p.office_location || '',
                officeHours: p.office_hours || '',
                officialEmail: p.official_email || '',
                areasOfSpecialization: p.areas_of_specialization || '',
                biography: p.biography || '',
                isAvailableForBooking: p.is_available_for_booking === 1 || p.is_available_for_booking === true,
                faculty: p.faculty || '',
                phoneExtension: p.phone_extension || '',
            });
            setSlotForm(prev => ({ ...prev, officeLocation: p.office_location || '' }));
        }
    };

    const loadSlots = async () => {
        try {
            const res = await api.getMyAvailability();
            console.log('Slots response:', res);
            if (res.success) {
                setSlots(res.data.slots || []);
            } else {
                console.error('Failed to load slots:', res.message);
                setError('Failed to load slots: ' + (res.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Load slots error:', err);
            setError('Error loading slots');
        }
    };

    const loadNotifications = async () => {
        const res = await api.getNotifications();
        if (res.success) { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); }
    };

    const handleDirectorySearch = async () => {
        setDirLoading(true);
        try {
            const res = await api.searchDirectory({ 
                query: dirQuery, 
                staffType: dirTypeFilter,
                faculty: dirFacultyFilter,
                page: 1, 
                limit: 20 
            });
            if (res.success) {
                const filteredResults = (res.data.staff || []).filter(item => {
                    const userEmail = user?.email?.toLowerCase();
                    const itemEmail = (item.official_email || item.email || '').toLowerCase();
                    return itemEmail !== userEmail;
                });
                setDirResults(filteredResults);
            } else {
                setDirResults([]);
            }
        } catch (error) {
            console.error('Directory search error:', error);
            setDirResults([]);
        }
        setDirLoading(false);
    };

    const handleViewChange = (v) => {
        setView(v); setMsg(''); setError(''); setEditMode(false);
        if (v === 'profile' && !profile) loadProfile();
        if (v === 'availability') loadSlots();
        if (v === 'notifications') loadNotifications();
        if (v === 'appointments') loadAppointments();
        if (v === 'directory') {
            setTimeout(handleDirectorySearch, 50);
        }
    };

    const getAppointmentStatus = (appt) => {
        const apptDateTime = new Date(appt.appointment_date + 'T' + (appt.start_time || '00:00:00'));
        const isPast = apptDateTime < new Date();
        
        if (isPast && appt.meeting_status !== 'attended') {
            return { 
                status: 'missed', 
                label: 'MISSED', 
                color: '#dc2626', 
                bg: '#fef2f2', 
                border: '#dc2626',
                showConfirm: false,
                showDecline: false,
                showCancel: false,
                showReschedule: false,
                showAttendance: false,
                buttonText: 'MISSED'
            };
        }
        
        if (appt.status === 'cancelled') {
            return { status: 'cancelled', label: 'CANCELLED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showConfirm: false, showDecline: false, showCancel: false, showReschedule: false, showAttendance: false, buttonText: 'CANCELLED' };
        }
        
        if (appt.status === 'declined' || appt.status === 'rejected') {
            return { status: 'rejected', label: 'DECLINED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showConfirm: false, showDecline: false, showCancel: false, showReschedule: false, showAttendance: false, buttonText: 'DECLINED' };
        }
        
        if (appt.meeting_status === 'attended') {
            return { status: 'attended', label: 'ATTENDED', color: '#10b981', bg: '#ecfdf5', border: '#10b981', showConfirm: false, showDecline: false, showCancel: false, showReschedule: false, showAttendance: false, buttonText: 'ATTENDED' };
        }
        
        if (appt.meeting_status === 'missed') {
            return { status: 'missed', label: 'MISSED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showConfirm: false, showDecline: false, showCancel: false, showReschedule: false, showAttendance: false, buttonText: 'MISSED' };
        }
        
        if (appt.status === 'confirmed') {
            return { status: 'confirmed', label: 'CONFIRMED', color: '#10b981', bg: '#ecfdf5', border: '#10b981', showConfirm: false, showDecline: false, showCancel: true, showReschedule: true, showAttendance: true, buttonText: 'CONFIRMED' };
        }
        
        return { status: 'pending', label: 'PENDING', color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', showConfirm: true, showDecline: true, showCancel: false, showReschedule: false, showAttendance: false, buttonText: 'PENDING' };
    };

    const handleRespond = async (appointmentId, status) => {
        const reason = status === 'declined' ? prompt('Reason for declining (optional):') : '';
        const res = await api.respondToAppointment(appointmentId, status, reason || '');
        if (res.success) { 
            loadAppointments(); 
            loadNotifications(); 
            setMsg(`Appointment ${status} successfully.`);
            setTimeout(() => setMsg(''), 3000);
        } else {
            setError(res.message || 'Failed to respond.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleCancelAppointment = async (appointmentId) => {
        const reason = prompt('Reason for cancelling:');
        if (reason === null) return;
        const res = await api.cancelAppointment(appointmentId, reason);
        if (res.success) {
            loadAppointments();
            loadNotifications();
            setMsg('Appointment cancelled successfully.');
            setTimeout(() => setMsg(''), 3000);
        } else {
            setError(res.message || 'Failed to cancel.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const openRescheduleModal = (appointmentId) => {
        setRescheduleAppointmentId(appointmentId);
        setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
        setRescheduleModalOpen(true);
    };

    const handleRescheduleConfirm = async () => {
        if (!rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime) {
            setError('Please fill in all reschedule fields.');
            return;
        }
        
        setRescheduleLoading(true);
        setError('');
        try {
            const res = await api.rescheduleAppointment(rescheduleAppointmentId, rescheduleData);
            if (res.success) {
                setRescheduleModalOpen(false);
                setRescheduleAppointmentId(null);
                setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
                loadAppointments();
                loadNotifications();
                setMsg('Appointment rescheduled successfully.');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setError(res.message || 'Failed to reschedule appointment.');
            }
        } catch (error) {
            console.error('Reschedule error:', error);
            setError('Network error. Please try again.');
        }
        setRescheduleLoading(false);
    };

    const openAttendanceModal = (appointmentId) => {
        setAttendanceAppointmentId(appointmentId);
        setAttendanceStatus('');
        setAttendanceModalOpen(true);
    };

    const handleAttendanceConfirm = async () => {
        if (!attendanceStatus) {
            setError('Please select attended or missed.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const res = await api.markAppointmentAttendance(attendanceAppointmentId, attendanceStatus);
            if (res.success) {
                setAttendanceModalOpen(false);
                setAttendanceAppointmentId(null);
                setAttendanceStatus('');
                loadAppointments();
                loadNotifications();
                setMsg(`Appointment marked as ${attendanceStatus}.`);
                setTimeout(() => setMsg(''), 3000);
            } else {
                setError(res.message || 'Failed to mark attendance.');
            }
        } catch (error) {
            console.error('Attendance error:', error);
            setError('Network error. Please try again.');
        }
        setLoading(false);
    };

    const handleProfileSave = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(''); setError('');
        const res = await api.updateStaffProfile(profileForm);
        if (res.success) { setMsg('Profile updated successfully.'); setEditMode(false); loadProfile(); }
        else setError(res.message || 'Update failed.');
        setLoading(false);
    };

    const handleAddSlot = async (e) => {
        e.preventDefault(); 
        setLoading(true); 
        setMsg(''); 
        setError('');
        
        if (!slotForm.startTime || !slotForm.endTime) {
            setError('Start time and end time are required.');
            setLoading(false);
            return;
        }
        
        if (slotForm.isRecurring && !slotForm.dayOfWeek) {
            setError('Please select a day of the week for recurring slots.');
            setLoading(false);
            return;
        }
        
        if (!slotForm.isRecurring && !slotForm.specificDate) {
            setError('Please select a date for one-off slots.');
            setLoading(false);
            return;
        }
        
        let locationStr = '';
        let isOnline = slotForm.meetingType === 'online';
        
        if (isOnline) {
            locationStr = 'Online';
        } else {
            if (!slotForm.officeLocation) {
                setError('Please provide a physical location.');
                setLoading(false);
                return;
            }
            locationStr = slotForm.officeLocation;
        }
        
        if (!locationStr) {
            setError('Please provide either a physical location or select Online.');
            setLoading(false);
            return;
        }
        
        try {
            const res = await api.addAvailabilitySlot({
                dayOfWeek: slotForm.isRecurring ? parseInt(slotForm.dayOfWeek) : null,
                startTime: slotForm.startTime,
                endTime: slotForm.endTime,
                slotDuration: parseInt(slotForm.slotDuration) || 30,
                location: locationStr,
                isRecurring: slotForm.isRecurring,
                specificDate: slotForm.isRecurring ? null : slotForm.specificDate,
                meetingLink: null
            });
            
            console.log('Add slot response:', res);
            
            if (res.success) {
                setMsg('Slot added successfully.');
                setSlotForm({ 
                    dayOfWeek: '', startTime: '', endTime: '', slotDuration: 30, 
                    location: '', isRecurring: true, specificDate: '', meetingLink: '', 
                    officeLocation: profile?.office_location || '',
                    meetingType: 'physical'
                });
                loadSlots();
                setTimeout(() => setMsg(''), 3000);
            } else {
                setError(res.message || 'Failed to add slot.');
                setTimeout(() => setError(''), 3000);
            }
        } catch (err) {
            console.error('Add slot error:', err);
            setError('Error adding slot: ' + (err.message || 'Unknown error'));
            setTimeout(() => setError(''), 3000);
        }
        setLoading(false);
    };

    const handleDeleteSlot = async (slotId) => {
        console.log('🔄 Attempting to delete slot ID:', slotId);
        if (!window.confirm('Remove this availability slot?')) return;
        setLoading(true);
        setError('');
        setMsg('');
        try {
            const res = await api.deleteAvailabilitySlot(slotId);
            console.log('📦 Delete response:', res);
            if (res.success) { 
                loadSlots(); 
                setMsg('Slot removed successfully.');
                setTimeout(() => setMsg(''), 3000);
            } else {
                setError(res.message || 'Failed to remove slot. Please try again.');
                setTimeout(() => setError(''), 3000);
            }
        } catch (err) {
            console.error('❌ Delete slot error:', err);
            setError('Error removing slot: ' + (err.message || 'Unknown error'));
            setTimeout(() => setError(''), 3000);
        }
        setLoading(false);
    };

    const handleMarkAllRead = async () => {
        const res = await api.markAllNotificationsRead();
        if (res.success) {
            loadNotifications();
            setMsg('All notifications marked as read.');
            setTimeout(() => setMsg(''), 3000);
        } else {
            setError('Failed to mark all as read.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const isPastAppointment = (appointment) => {
        const apptDate = new Date(appointment.appointment_date + 'T' + (appointment.start_time || '00:00:00'));
        return apptDate < new Date();
    };

    const pending = appointments.filter(a => a.status === 'pending');

    const handleFilterClick = (val) => {
        setDirTypeFilter(val);
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>SU Directory — Staff</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button style={styles.navBtn(view === 'directory')} onClick={() => handleViewChange('directory')}>Directory</button>
                    <button style={styles.navBtn(view === 'appointments')} onClick={() => handleViewChange('appointments')}>
                        Appointments {pending.length > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{pending.length}</span>}
                    </button>
                    <button style={styles.navBtn(view === 'profile')} onClick={() => handleViewChange('profile')}>My Profile</button>
                    <button style={styles.navBtn(view === 'availability')} onClick={() => handleViewChange('availability')}>Availability</button>
                    <button style={styles.navBtn(view === 'notifications')} onClick={() => handleViewChange('notifications')}>
                        Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{unreadCount}</span>}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>{user?.email}</span>
                    <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
                </div>
            </nav>

            <main style={styles.main}>

                {msg && <div style={styles.alert('success')}>{msg}</div>}
                {error && <div style={styles.alert('error')}>{error}</div>}

                {view === 'directory' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>Personnel Directory</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Search for staff members and student representatives across the university.</p>
                        
                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <input 
                                    style={{ ...styles.input, flex: 1, marginBottom: 0 }} 
                                    placeholder="Search by name, faculty, office, specialisation..." 
                                    value={dirQuery} 
                                    onChange={e => setDirQuery(e.target.value)}
                                />
                                <button style={styles.btn()} onClick={handleDirectorySearch}>Search</button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {[
                                    { val: '', label: 'All' },
                                    { val: 'lecturer', label: 'Lecturers' },
                                    { val: 'mentor', label: 'Mentors' },
                                    { val: 'administrative', label: 'Admin Staff' },
                                    { val: 'student_representative', label: 'Student Reps' }
                                ].map(({ val, label }) => (
                                    <button 
                                        key={val} 
                                        onClick={() => handleFilterClick(val)}
                                        style={{ 
                                            background: dirTypeFilter === val ? '#1a2744' : '#f1f5f9', 
                                            color: dirTypeFilter === val ? '#fff' : '#475569', 
                                            border: 'none', 
                                            borderRadius: 20, 
                                            padding: '5px 14px', 
                                            fontSize: 12, 
                                            fontWeight: 600, 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {facultyFilterButtons.map(({ val, label }) => (
                                    <button key={val} onClick={() => setDirFacultyFilter(val)}
                                        style={{ background: dirFacultyFilter === val ? '#1a2744' : '#f1f5f9', color: dirFacultyFilter === val ? '#fff' : '#475569', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {dirLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Searching...</div>
                        ) : dirResults.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {dirQuery || dirTypeFilter || dirFacultyFilter ? 'No results found. Try a different search.' : 'Search for staff members and student representatives.'}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {dirResults.map((item, i) => {
                                    const positionLine = item.position || '';
                                    
                                    return (
                                        <div key={i} style={styles.card}>
                                            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                                                <Avatar name={`${item.first_name} ${item.last_name}`} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 16, color: '#1a2744' }}>
                                                        {item.first_name} {item.last_name}
                                                    </div>
                                                    {positionLine && (
                                                        <div style={{ fontSize: 13, color: '#64748b' }}>
                                                            {positionLine}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                                {renderRoleBadges(item)}
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                {item.faculty && (
                                                    <div style={{ fontSize: 12, color: '#8b5cf6' }}>{item.faculty}</div>
                                                )}
                                                {item.department_name && !item.faculty && (
                                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.department_name}</div>
                                                )}
                                                {item.office_location && (
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>📍 {item.office_location}</div>
                                                )}
                                                {item.official_email && (
                                                    <div style={{ fontSize: 12, color: '#1a2744' }}>
                                                        <a href={`mailto:${item.official_email}`} style={{ color: '#1a2744', textDecoration: 'underline' }}>
                                                            {item.official_email}
                                                        </a>
                                                    </div>
                                                )}
                                                {item.phone_extension && (
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>📞 {item.phone_extension}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {view === 'appointments' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Appointment Inbox</h1>
                        {pending.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>Pending requests ({pending.length})</div>
                                {pending.map(appt => (
                                    <div key={appt.appointment_id} style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 2 }}>
                                                    {appt.student_first_name} {appt.student_last_name}
                                                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>({appt.student_reg_no})</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{appt.program}</div>
                                                <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                                                    {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#475569' }}>Purpose: {appt.purpose}</div>
                                                {appt.additional_notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Note: {appt.additional_notes}</div>}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleRespond(appt.appointment_id, 'confirmed')} style={styles.btn('#10b981')}>Confirm</button>
                                                <button onClick={() => handleRespond(appt.appointment_id, 'declined')} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Decline</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>All Appointments</div>
                            {appointments.length === 0 ? (
                                <div style={{ ...styles.card, color: '#64748b', textAlign: 'center', padding: 30 }}>No appointments.</div>
                            ) : appointments.map(appt => {
                                const statusInfo = getAppointmentStatus(appt);
                                const past = isPastAppointment(appt);
                                
                                const cardStyles = {
                                    ...styles.card,
                                    background: statusInfo.bg,
                                    borderLeft: `4px solid ${statusInfo.border}`,
                                    border: `1px solid ${statusInfo.border}`,
                                    opacity: past && statusInfo.status !== 'missed' && statusInfo.status !== 'attended' ? 0.6 : 1
                                };
                                
                                return (
                                    <div key={appt.appointment_id} style={cardStyles}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 2 }}>
                                                    {appt.student_first_name} {appt.student_last_name}
                                                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>({appt.student_reg_no})</span>
                                                    {past && statusInfo.status !== 'attended' && statusInfo.status !== 'missed' && (
                                                        <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 8 }}>Past</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                                    {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Purpose: {appt.purpose}</div>
                                                {appt.additional_notes && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Note: {appt.additional_notes}</div>}
                                                {appt.meeting_link && appt.status === 'confirmed' && statusInfo.status !== 'missed' && (
                                                    <div style={{ fontSize: 12, marginTop: 4 }}>
                                                        <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1a2744', fontWeight: 600 }}>Join Google Meet</a>
                                                    </div>
                                                )}
                                                {appt.status === 'cancelled' && appt.cancellation_reason && (
                                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Reason: {appt.cancellation_reason}</div>
                                                )}
                                                {appt.status === 'declined' && appt.cancellation_reason && (
                                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Reason: {appt.cancellation_reason}</div>
                                                )}
                                                {statusInfo.status === 'missed' && (
                                                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>This appointment was missed</div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                <span style={{ 
                                                    fontWeight: 700, 
                                                    fontSize: 12, 
                                                    color: statusInfo.color,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                                
                                                {statusInfo.showConfirm && (
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button onClick={() => handleRespond(appt.appointment_id, 'confirmed')} style={styles.btn('#10b981')}>Confirm</button>
                                                        <button onClick={() => handleRespond(appt.appointment_id, 'declined')} style={{ background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Decline</button>
                                                    </div>
                                                )}
                                                
                                                {statusInfo.showCancel && (
                                                    <button onClick={() => handleCancelAppointment(appt.appointment_id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                                                        Cancel
                                                    </button>
                                                )}
                                                
                                                {statusInfo.showReschedule && (
                                                    <button onClick={() => openRescheduleModal(appt.appointment_id)} style={{ background: '#1a2744', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                                                        Reschedule
                                                    </button>
                                                )}
                                                
                                                {statusInfo.showAttendance && (
                                                    <button onClick={() => openAttendanceModal(appt.appointment_id)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                                                        Mark Attendance
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {view === 'profile' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>My Profile</h1>
                            <button style={editMode ? styles.btnOutline : styles.btn()} onClick={() => { setEditMode(!editMode); setMsg(''); setError(''); }}>
                                {editMode ? 'Cancel' : 'Edit profile'}
                            </button>
                        </div>
                        {!profile ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
                        ) : !editMode ? (
                            <div style={styles.card}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                                    <Avatar name={`${profile.first_name} ${profile.last_name}`} size={72} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 20, color: '#1a2744' }}>
                                            {profile.first_name} {profile.last_name}
                                        </div>
                                        {profile.position && (
                                            <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                                                {profile.position}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 13, color: '#8b5cf6' }}>{profile.faculty || 'No faculty'}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                            <Badge label={typeLabel(profile.staff_type)} color={typeColor(profile.staff_type)} />
                                            {(profile.is_mentor === 1 || profile.is_mentor === true) && <Badge label="Mentor" color="#7c3aed" />}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                    {profile.office_location && <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Office</span>{profile.office_location}</div>}
                                    {profile.office_hours && <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Office hours</span>{profile.office_hours}</div>}
                                    {profile.official_email && (
                                        <div>
                                            <span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Email</span>
                                            <a href={`mailto:${profile.official_email}`} style={{ color: '#1a2744', textDecoration: 'underline' }}>{profile.official_email}</a>
                                        </div>
                                    )}
                                    {profile.phone_extension && <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Phone</span>{profile.phone_extension}</div>}
                                    {profile.areas_of_specialization && <div style={{ marginTop: 8 }}><div style={{ color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Areas of specialisation</div><div style={{ color: '#475569', lineHeight: 1.6 }}>{profile.areas_of_specialization}</div></div>}
                                    {profile.biography && <div style={{ marginTop: 8 }}><div style={{ color: '#64748b', fontWeight: 600, marginBottom: 4 }}>About</div><div style={{ color: '#475569', lineHeight: 1.6 }}>{profile.biography}</div></div>}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleProfileSave}>
                                <div style={styles.card}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label style={styles.label}>First name</label>
                                            <input style={styles.input} value={profileForm.firstName} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Last name</label>
                                            <input style={styles.input} value={profileForm.lastName} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Title</label>
                                            <select style={styles.input} value={profileForm.title} onChange={e => setProfileForm(p => ({ ...p, title: e.target.value }))}>
                                                <option value="">None</option>
                                                <option value="Dr.">Dr.</option>
                                                <option value="Prof.">Prof.</option>
                                                <option value="Mr.">Mr.</option>
                                                <option value="Ms.">Ms.</option>
                                                <option value="Mrs.">Mrs.</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={styles.label}>Position</label>
                                            <input style={styles.input} placeholder="e.g. Senior Lecturer" value={profileForm.position} onChange={e => setProfileForm(p => ({ ...p, position: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Staff type</label>
                                            <select style={styles.input} value={profileForm.staffType} onChange={e => setProfileForm(p => ({ ...p, staffType: e.target.value }))}>
                                                <option value="lecturer">Lecturer</option>
                                                <option value="administrative">Administrative Staff</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={styles.label}>Faculty</label>
                                            <select style={styles.input} value={profileForm.faculty || ''} onChange={e => setProfileForm(p => ({ ...p, faculty: e.target.value }))}>
                                                <option value="">Select Faculty...</option>
                                                <option value="SCES">SCES - School of Computing and Engineering Sciences</option>
                                                <option value="SOB">SOB - Strathmore University Business School</option>
                                                <option value="SHSS">SHSS - School of Humanities and Social Sciences</option>
                                                <option value="SOL">SOL - Strathmore Law School</option>
                                                <option value="STH">STH - School of Tourism and Hospitality</option>
                                                <option value="SIMS">SIMS - Strathmore Institute of Mathematical Sciences</option>
                                                <option value="SIMT">SIMT - Strathmore Institute of Management & Technology</option>
                                                <option value="CRTS">CRTS - Centre for Research in Therapeutic Sciences</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={styles.label}>Office location</label>
                                            <input style={styles.input} placeholder="e.g. Block C, Room 214" value={profileForm.officeLocation} onChange={e => setProfileForm(p => ({ ...p, officeLocation: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Office hours</label>
                                            <input style={styles.input} placeholder="e.g. Mon–Fri 9am–12pm" value={profileForm.officeHours} onChange={e => setProfileForm(p => ({ ...p, officeHours: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Official email</label>
                                            <input style={styles.input} type="email" value={profileForm.officialEmail} onChange={e => setProfileForm(p => ({ ...p, officialEmail: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Phone number (optional)</label>
                                            <input style={styles.input} placeholder="+254..." value={profileForm.phoneExtension} onChange={e => setProfileForm(p => ({ ...p, phoneExtension: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12, background: '#f8fafc' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!profileForm.isMentor} onChange={e => setProfileForm(p => ({ ...p, isMentor: e.target.checked }))} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2744' }}>I also offer mentorship</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>You will appear under the Mentors filter in the directory.</div>
                                            </div>
                                        </label>
                                    </div>

                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16, background: '#f8fafc' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!profileForm.isAvailableForBooking} onChange={e => setProfileForm(p => ({ ...p, isAvailableForBooking: e.target.checked }))} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2744' }}>Available for appointment bookings</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>Uncheck to hide yourself from student booking requests.</div>
                                            </div>
                                        </label>
                                    </div>

                                    <label style={styles.label}>Areas of specialisation</label>
                                    <input style={styles.input} placeholder="e.g. Algorithms, Software Engineering" value={profileForm.areasOfSpecialization} onChange={e => setProfileForm(p => ({ ...p, areasOfSpecialization: e.target.value }))} />

                                    <label style={styles.label}>About / Biography</label>
                                    <textarea style={styles.textarea} placeholder="A brief bio about yourself..." value={profileForm.biography} onChange={e => setProfileForm(p => ({ ...p, biography: e.target.value }))} />

                                    <button type="submit" style={styles.btn()} disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {view === 'availability' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Availability Slots</h1>
                        <div style={styles.card}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 16 }}>Add new slot</div>
                            <form onSubmit={handleAddSlot}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input type="radio" checked={slotForm.isRecurring} onChange={() => setSlotForm(p => ({ ...p, isRecurring: true, specificDate: '' }))} /> Recurring weekly
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                                        <input type="radio" checked={!slotForm.isRecurring} onChange={() => setSlotForm(p => ({ ...p, isRecurring: false, dayOfWeek: '' }))} /> Specific date
                                    </label>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {slotForm.isRecurring ? (
                                        <div>
                                            <label style={styles.label}>Day *</label>
                                            <select style={{ ...styles.input, marginBottom: 0 }} value={slotForm.dayOfWeek} onChange={e => setSlotForm(p => ({ ...p, dayOfWeek: e.target.value }))}>
                                                <option value="">Select day...</option>
                                                {DAYS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={styles.label}>Date *</label>
                                            <input type="date" style={{ ...styles.input, marginBottom: 0 }} min={new Date().toISOString().split('T')[0]} value={slotForm.specificDate} onChange={e => setSlotForm(p => ({ ...p, specificDate: e.target.value }))} />
                                        </div>
                                    )}
                                    <div>
                                        <label style={styles.label}>Start time *</label>
                                        <input type="time" style={{ ...styles.input, marginBottom: 0 }} value={slotForm.startTime} onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>End time *</label>
                                        <input type="time" style={{ ...styles.input, marginBottom: 0 }} value={slotForm.endTime} onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                                    <div>
                                        <label style={styles.label}>Physical Location</label>
                                        <input style={{ ...styles.input, marginBottom: 0 }} 
                                            placeholder="e.g. Office Block C, Room 214" 
                                            value={slotForm.officeLocation} 
                                            onChange={e => setSlotForm(p => ({ ...p, officeLocation: e.target.value }))} 
                                        />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Meeting Type</label>
                                        <select style={{ ...styles.input, marginBottom: 0 }} 
                                            value={slotForm.meetingType || 'physical'} 
                                            onChange={e => setSlotForm(p => ({ ...p, meetingType: e.target.value }))}>
                                            <option value="physical">Physical</option>
                                            <option value="online">Online (Google Meet auto-generated)</option>
                                        </select>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                            {slotForm.meetingType === 'online' 
                                                ? '🔗 A Google Meet link will be auto-generated when you save' 
                                                : '📍 Students will meet you at the physical location'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <label style={styles.label}>Duration (minutes)</label>
                                    <input type="number" style={{ ...styles.input, marginBottom: 0 }} value={slotForm.slotDuration} min={15} max={120} step={15} onChange={e => setSlotForm(p => ({ ...p, slotDuration: parseInt(e.target.value) }))} />
                                </div>

                                <button type="submit" style={{ ...styles.btn(), marginTop: 14 }} disabled={loading}>{loading ? 'Adding...' : '+ Add slot'}</button>
                            </form>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>Current slots ({slots.length})</div>
                        {slots.length === 0 ? (
                            <div style={{ ...styles.card, color: '#64748b', textAlign: 'center', padding: 30 }}>No slots yet. Add one above.</div>
                        ) : slots.map(slot => {
                            const hasPhysical = slot.location && !slot.location.includes('Online:') && slot.location.trim().length > 0;
                            const hasOnline = slot.location && slot.location.includes('Online:');
                            return (
                                <div key={slot.slot_id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744' }}>
                                            {slot.is_recurring ? DAYS[slot.day_of_week] : new Date(slot.specific_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            {' · '}{slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            {slot.slot_duration} min · {slot.is_recurring ? 'Recurring weekly' : 'One-off'}
                                        </div>
                                        {hasPhysical && (
                                            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                                                Physical: {slot.location.split('|')[0]?.trim() || slot.location}
                                            </div>
                                        )}
                                        {hasOnline && (
                                            <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>
                                                Online: {slot.location.includes('Online:') ? slot.location.split('Online:')[1]?.trim() : slot.location}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteSlot(slot.slot_id)} 
                                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Removing...' : 'Remove'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'notifications' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>Notifications</h1>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} style={styles.btnOutline}>
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>No notifications.</div>
                        ) : notifications.map(n => (
                            <div key={n.notification_id} style={{ ...styles.card, background: n.is_read ? '#fff' : '#eff6ff', borderColor: n.is_read ? '#e2e8f0' : '#bfdbfe', cursor: n.is_read ? 'default' : 'pointer' }}
                                onClick={() => !n.is_read && api.markNotificationRead(n.notification_id).then(loadNotifications)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 4 }}>{n.title}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div style={{ fontSize: 13, color: '#475569' }}>{n.message}</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {rescheduleModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }} onClick={() => setRescheduleModalOpen(false)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 420,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Reschedule Appointment</h2>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                            Select a new date and time for this appointment.
                        </p>
                        <label style={styles.label}>New Date *</label>
                        <input
                            type="date"
                            style={{ ...styles.input, marginBottom: 12 }}
                            min={new Date().toISOString().split('T')[0]}
                            value={rescheduleData.date}
                            onChange={e => setRescheduleData(p => ({ ...p, date: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Start Time *</label>
                                <input
                                    type="time"
                                    style={{ ...styles.input, marginBottom: 12 }}
                                    value={rescheduleData.startTime}
                                    onChange={e => setRescheduleData(p => ({ ...p, startTime: e.target.value }))}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>End Time *</label>
                                <input
                                    type="time"
                                    style={{ ...styles.input, marginBottom: 12 }}
                                    value={rescheduleData.endTime}
                                    onChange={e => setRescheduleData(p => ({ ...p, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                        <label style={styles.label}>Reason (optional)</label>
                        <input
                            type="text"
                            style={{ ...styles.input, marginBottom: 16 }}
                            placeholder="Why are you rescheduling?"
                            value={rescheduleData.reason}
                            onChange={e => setRescheduleData(p => ({ ...p, reason: e.target.value }))}
                        />
                        {error && <div style={styles.alert('error')}>{error}</div>}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setRescheduleModalOpen(false);
                                    setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
                                    setError('');
                                }}
                                style={styles.btnOutline}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRescheduleConfirm}
                                style={styles.btn()}
                                disabled={rescheduleLoading || !rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime}
                            >
                                {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {attendanceModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                }} onClick={() => setAttendanceModalOpen(false)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 420,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Mark Attendance</h2>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                            Was the student present or absent for this appointment?
                        </p>
                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                            <button
                                onClick={() => setAttendanceStatus('attended')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: attendanceStatus === 'attended' ? '2px solid #10b981' : '1px solid #e2e8f0',
                                    background: attendanceStatus === 'attended' ? '#ecfdf5' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: attendanceStatus === 'attended' ? 700 : 400,
                                    color: attendanceStatus === 'attended' ? '#10b981' : '#475569'
                                }}
                            >
                                Attended
                            </button>
                            <button
                                onClick={() => setAttendanceStatus('missed')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: attendanceStatus === 'missed' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                                    background: attendanceStatus === 'missed' ? '#fef2f2' : '#fff',
                                    cursor: 'pointer',
                                    fontWeight: attendanceStatus === 'missed' ? 700 : 400,
                                    color: attendanceStatus === 'missed' ? '#dc2626' : '#475569'
                                }}
                            >
                                Missed
                            </button>
                        </div>
                        {error && <div style={styles.alert('error')}>{error}</div>}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setAttendanceModalOpen(false);
                                    setAttendanceStatus('');
                                    setError('');
                                }}
                                style={styles.btnOutline}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAttendanceConfirm}
                                style={styles.btn()}
                                disabled={loading || !attendanceStatus}
                            >
                                {loading ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button 
                style={styles.fab}
                onClick={() => handleViewChange('appointments')}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                📋
                {pendingCount > 0 && (
                    <span style={styles.fabBadge}>{pendingCount}</span>
                )}
            </button>
        </div>
    );
}