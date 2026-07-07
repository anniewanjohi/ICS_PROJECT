// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Avatar = ({ name, size = 48, bg = '#1a2744' }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
            {initials}
        </div>
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
    main: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px', paddingBottom: '100px' },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
    btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #1a2744', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
    textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
    alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
    fab: { position: 'fixed', bottom: 24, right: 24, background: '#1a2744', color: '#fff', border: 'none', borderRadius: '50%', width: 60, height: 60, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, zIndex: 1000, transition: 'all 0.2s' },
    fabBadge: { position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 8px', fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center' },
};

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [staffTypeFilter, setStaffTypeFilter] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [slots, setSlots] = useState([]);
    const [bookingForm, setBookingForm] = useState({ 
        slotId: '', 
        appointmentDate: '', 
        startTime: '', 
        endTime: '', 
        purpose: '', 
        additionalNotes: '', 
        meetingLocation: '',
        meetingType: ''
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [faculties, setFaculties] = useState([]);

    const [myProfile, setMyProfile] = useState(null);
    const [profileLoadError, setProfileLoadError] = useState('');
    const [profileForm, setProfileForm] = useState({});
    const [profileMsg, setProfileMsg] = useState('');
    const [profileErr, setProfileErr] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);

    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ date: '', startTime: '', endTime: '', reason: '' });
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    const [searchTimer, setSearchTimer] = useState(null);

    const filters = [
        { val: '', label: 'All' },
        { val: 'lecturer', label: 'Lecturers' },
        { val: 'mentor', label: 'Mentors' },
        { val: 'administrative', label: 'Admin Staff' },
        { val: 'student_representative', label: 'Student Reps' },
    ];

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
        handleSearch(1); 
        loadNotifications();
        loadAppointments();
        loadFaculties();
    }, []);

    useEffect(() => {
        const pending = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
        setPendingCount(pending.length);
    }, [appointments]);

    useEffect(() => {
        if (searchTimer) clearTimeout(searchTimer);
        const timer = setTimeout(() => {
            if (view === 'search') handleSearch(1);
        }, 300);
        setSearchTimer(timer);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => { handleSearch(1); }, [staffTypeFilter, facultyFilter]);

    const loadNotifications = async () => {
        const res = await api.getNotifications();
        if (res.success) { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); }
    };

    const loadAppointments = async () => {
        const res = await api.getMyAppointments();
        if (res.success) setAppointments(res.data.appointments);
    };

    const loadFaculties = async () => {
        const res = await api.getFaculties();
        if (res.success) setFaculties(res.data.faculties);
    };

    const handleSearch = useCallback(async (p = 1) => {
        setSearchLoading(true);
        const res = await api.searchDirectory({ 
            query: searchQuery, 
            staffType: staffTypeFilter,
            faculty: facultyFilter,
            page: p, 
            limit: 12 
        });
        if (res.success) { 
            const filtered = (res.data.staff || []).filter(item => {
                const userEmail = user?.email?.toLowerCase();
                const itemEmail = (item.official_email || item.email || '').toLowerCase();
                return itemEmail !== userEmail;
            });
            setSearchResults(filtered); 
            setTotalPages(res.data.totalPages); 
            setPage(p); 
        }
        setSearchLoading(false);
    }, [searchQuery, staffTypeFilter, facultyFilter, user]);

    const openProfile = async (item) => {
        if (item.source_type === 'student_rep') {
            setSelectedStaff({ ...item, isRep: true });
            setSlots([]);
            setView('profile');
            return;
        }
        setProfileLoading(true);
        setView('profile');
        setBookingSuccess(''); setBookingError('');
        const [profileRes, slotsRes] = await Promise.all([
            api.getStaffProfile(item.id),
            api.getAvailableSlots(item.id)
        ]);
        if (profileRes.success) {
            setSelectedStaff({ ...profileRes.data.profile, isRep: false });
        }
        if (slotsRes.success) {
            setSlots(slotsRes.data.slots || []);
        } else {
            setSlots([]);
        }
        setProfileLoading(false);
    };

    const loadMyProfile = async () => {
        setProfileLoadError('');
        const res = await api.getMe();
        if (res.success) {
            const profile = res.data.user.profile;
            if (!profile) {
                setProfileLoadError('No profile found for this account. Please contact an administrator.');
                return;
            }
            setMyProfile(profile);
            setProfileForm({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                studentRegNo: profile.student_reg_no || '',
                program: profile.program || '',
                yearOfStudy: profile.year_of_study || '',
                faculty: profile.faculty || '',
                phoneNumber: profile.phone_number || '',
                isStudentRep: profile.is_student_rep || false,
                repRole: profile.rep_role || '',
            });
        } else {
            setProfileLoadError(res.message || 'Failed to load profile. Please try logging out and back in.');
        }
    };

    const saveMyProfile = async () => {
        setProfileSaving(true); setProfileMsg(''); setProfileErr('');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/staff/student-profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                studentRegNo: profileForm.studentRegNo,
                program: profileForm.program,
                yearOfStudy: profileForm.yearOfStudy,
                faculty: profileForm.faculty,
                phoneNumber: profileForm.phoneNumber,
                isStudentRep: profileForm.isStudentRep,
                repRole: profileForm.repRole,
            }),
        });
        const data = await res.json();
        if (data.success) { setProfileMsg('Profile updated!'); setEditMode(false); loadMyProfile(); }
        else setProfileErr(data.message || 'Update failed');
        setProfileSaving(false);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!bookingForm.slotId || !bookingForm.appointmentDate || !bookingForm.purpose) {
            setBookingError('Please select a time slot, date, and provide a purpose.');
            return;
        }
        if (!bookingForm.meetingType) {
            setBookingError('Please choose Physical or Online meeting type.');
            return;
        }
        
        setBookingLoading(true); setBookingError('');
        
        const selectedSlot = slots.find(s => s.slot_id === parseInt(bookingForm.slotId));
        
        let meetingLocation = '';
        if (bookingForm.meetingType === 'physical') {
            meetingLocation = selectedStaff.office_location || 'Physical meeting';
        } else {
            const onlineMatch = selectedSlot?.location?.match(/Online — (https?:\/\/[^\s|]+)/);
            meetingLocation = onlineMatch ? onlineMatch[1] : (selectedSlot?.meeting_link || '');
        }
        
        const res = await api.bookAppointment({ 
            ...bookingForm, 
            staffId: selectedStaff.staff_id,
            meetingLocation: meetingLocation
        });
        if (res.success) {
            setBookingSuccess('Appointment request submitted.');
            setBookingForm({ slotId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '', additionalNotes: '', meetingLocation: '', meetingType: '' });
            loadAppointments();
        } else {
            setBookingError(res.message || 'Booking failed.');
        }
        setBookingLoading(false);
    };

    const openCancelModal = (appointmentId) => {
        setCancelAppointmentId(appointmentId);
        setCancelReason('');
        setCancelModalOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!cancelReason.trim()) {
            setBookingError('Please provide a reason for cancellation.');
            return;
        }
        
        setCancelLoading(true);
        setBookingError('');
        try {
            const res = await api.cancelAppointment(cancelAppointmentId, cancelReason);
            if (res.success) {
                setCancelModalOpen(false);
                setCancelReason('');
                setCancelAppointmentId(null);
                loadAppointments();
                loadNotifications();
                setBookingSuccess('Appointment cancelled successfully.');
                setTimeout(() => setBookingSuccess(''), 3000);
            } else {
                setBookingError(res.message || 'Failed to cancel appointment. Please try again.');
            }
        } catch (error) {
            console.error('Cancel error:', error);
            setBookingError('Network error. Please try again.');
        }
        setCancelLoading(false);
    };

    const openRescheduleModal = (appointmentId) => {
        setRescheduleAppointmentId(appointmentId);
        setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
        setRescheduleModalOpen(true);
    };

    const handleRescheduleConfirm = async () => {
        if (!rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime) {
            setBookingError('Please fill in all reschedule fields.');
            return;
        }
        
        setRescheduleLoading(true);
        setBookingError('');
        try {
            const res = await api.rescheduleAppointment(rescheduleAppointmentId, rescheduleData);
            if (res.success) {
                setRescheduleModalOpen(false);
                setRescheduleAppointmentId(null);
                setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
                loadAppointments();
                loadNotifications();
                setBookingSuccess('Appointment rescheduled successfully.');
                setTimeout(() => setBookingSuccess(''), 3000);
            } else {
                setBookingError(res.message || 'Failed to reschedule appointment.');
            }
        } catch (error) {
            console.error('Reschedule error:', error);
            setBookingError('Network error. Please try again.');
        }
        setRescheduleLoading(false);
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
                showButtons: false,
                buttonText: 'MISSED'
            };
        }
        
        if (appt.status === 'cancelled') {
            return { status: 'cancelled', label: 'CANCELLED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showButtons: false, buttonText: 'CANCELLED' };
        }
        
        if (appt.status === 'declined' || appt.status === 'rejected') {
            return { status: 'rejected', label: 'DECLINED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showButtons: false, buttonText: 'DECLINED' };
        }
        
        if (appt.meeting_status === 'attended') {
            return { status: 'attended', label: 'ATTENDED', color: '#10b981', bg: '#ecfdf5', border: '#10b981', showButtons: false, buttonText: 'ATTENDED' };
        }
        
        if (appt.meeting_status === 'missed') {
            return { status: 'missed', label: 'MISSED', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', showButtons: false, buttonText: 'MISSED' };
        }
        
        if (appt.status === 'confirmed') {
            return { status: 'confirmed', label: 'CONFIRMED', color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', showButtons: true, buttonText: 'CONFIRMED' };
        }
        
        return { status: 'pending', label: 'PENDING', color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b', showButtons: true, buttonText: 'PENDING' };
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>SU Directory</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button style={styles.navBtn(view === 'search')} onClick={() => setView('search')}>Directory</button>
                    <button style={styles.navBtn(view === 'myprofile')} onClick={() => { setView('myprofile'); loadMyProfile(); }}>My Profile</button>
                    <button style={styles.navBtn(view === 'appointments')} onClick={() => { setView('appointments'); loadAppointments(); }}>My Appointments</button>
                    <button style={styles.navBtn(view === 'notifications')} onClick={() => { setView('notifications'); loadNotifications(); }}>
                        Notifications {unreadCount > 0 && <span style={{ background: '#ef4444', borderRadius: '50%', padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{unreadCount}</span>}
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>{user?.email}</span>
                    <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
                </div>
            </nav>

            <main style={styles.main}>

                {view === 'search' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>Find university personnel</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Search by name, faculty, role, office, or specialisation</p>
                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <input style={{ ...styles.input, flex: 1 }} 
                                    placeholder="Search by name, faculty, office, course..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                />
                                <button style={styles.btn()} onClick={() => handleSearch(1)}>Search</button>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                                {filters.map(({ val, label }) => (
                                    <button key={val} onClick={() => setStaffTypeFilter(val)}
                                        style={{ background: staffTypeFilter === val ? '#1a2744' : '#f1f5f9', color: staffTypeFilter === val ? '#fff' : '#475569', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {facultyFilterButtons.map(({ val, label }) => (
                                    <button key={val} onClick={() => setFacultyFilter(val)}
                                        style={{ background: facultyFilter === val ? '#1a2744' : '#f1f5f9', color: facultyFilter === val ? '#fff' : '#475569', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {searchLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Searching...</div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No results found.</div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                    {searchResults.map((item, i) => {
                                        const roleBadges = renderRoleBadges(item);
                                        const isStudentRep = item.source_type === 'student_rep';
                                        const hasSlots = item.available_slots_count > 0;
                                        
                                        // Position line for students: program + year
                                        let positionLine = '';
                                        if (isStudentRep) {
                                            positionLine = item.rep_role || '';
                                        } else {
                                            if (item.program && item.year_of_study) {
                                                positionLine = `${item.program} · Year ${item.year_of_study}`;
                                            } else if (item.program) {
                                                positionLine = item.program;
                                            } else if (item.year_of_study) {
                                                positionLine = `Year ${item.year_of_study}`;
                                            }
                                        }
                                        
                                        return (
                                            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                                                onClick={() => openProfile(item)}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                                
                                                {/* NAME - no prefix */}
                                                <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                                                    <Avatar name={`${item.first_name} ${item.last_name}`} />
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 16, color: '#1a2744' }}>
                                                            {item.first_name} {item.last_name}
                                                        </div>
                                                        {/* POSITION LINE - program + year for students, rep_role for reps */}
                                                        {positionLine && (
                                                            <div style={{ fontSize: 13, color: '#64748b' }}>
                                                                {positionLine}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* BADGES ONLY - no duplicate text */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                                    {roleBadges}
                                                </div>
                                                
                                                {/* DETAILS - each on its own line */}
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
                                                    {/* SLOTS - on its own line */}
                                                    {!isStudentRep && (
                                                        <div style={{ fontSize: 12, color: hasSlots ? '#10b981' : '#ef4444', fontWeight: 500, marginTop: 2 }}>
                                                            {hasSlots ? `${item.available_slots_count} slots available` : 'No slots'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                                        <button onClick={() => handleSearch(page - 1)} disabled={page === 1} style={styles.btnOutline}>Prev</button>
                                        <span style={{ padding: '9px 14px', fontSize: 13 }}>Page {page} of {totalPages}</span>
                                        <button onClick={() => handleSearch(page + 1)} disabled={page === totalPages} style={styles.btnOutline}>Next</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {view === 'profile' && (
                    <div>
                        <button onClick={() => setView('search')} style={{ ...styles.btnOutline, marginBottom: 20 }}>Back to search</button>
                        {profileLoading ? (
                            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading profile...</div>
                        ) : selectedStaff ? (
                            <div style={{ display: 'grid', gridTemplateColumns: selectedStaff.isRep ? '1fr' : '1fr 1fr', gap: 20 }}>
                                <div>
                                    <div style={styles.card}>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <Avatar name={`${selectedStaff.first_name} ${selectedStaff.last_name}`} size={64} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 20, color: '#1a2744' }}>
                                                    {selectedStaff.first_name} {selectedStaff.last_name}
                                                </div>
                                                {selectedStaff.position && (
                                                    <div style={{ fontSize: 14, color: '#64748b' }}>
                                                        {selectedStaff.position}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                                    {renderRoleBadges(selectedStaff)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                            {selectedStaff.faculty && <div><span style={{ color: '#64748b' }}>Faculty: </span>{selectedStaff.faculty}</div>}
                                            {selectedStaff.office_location && <div><span style={{ color: '#64748b' }}>Office: </span>{selectedStaff.office_location}</div>}
                                            {selectedStaff.official_email && (
                                                <div>
                                                    <span style={{ color: '#64748b' }}>Email: </span>
                                                    <a href={`mailto:${selectedStaff.official_email}`} style={{ color: '#1a2744', textDecoration: 'underline' }}>
                                                        {selectedStaff.official_email}
                                                    </a>
                                                </div>
                                            )}
                                            {selectedStaff.office_hours && <div><span style={{ color: '#64748b' }}>Hours: </span>{selectedStaff.office_hours}</div>}
                                        </div>
                                    </div>
                                    {selectedStaff.areas_of_specialization && (
                                        <div style={styles.card}>
                                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a2744' }}>{selectedStaff.isRep ? 'Role and Responsibilities' : 'Areas of Specialisation'}</div>
                                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selectedStaff.areas_of_specialization}</div>
                                        </div>
                                    )}
                                    {selectedStaff.biography && (
                                        <div style={styles.card}>
                                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a2744' }}>About</div>
                                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{selectedStaff.biography}</div>
                                        </div>
                                    )}
                                </div>

                                {!selectedStaff.isRep && (
                                    <div style={styles.card}>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2744', marginBottom: 16 }}>Book an Appointment</div>
                                        {bookingSuccess ? (
                                            <div style={styles.alert('success')}>{bookingSuccess}</div>
                                        ) : (
                                            <form onSubmit={handleBook}>
                                                {bookingError && <div style={styles.alert('error')}>{bookingError}</div>}
                                                
                                                <label style={styles.label}>Select a time slot *</label>
                                                {slots.length === 0 ? (
                                                    <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>No availability slots set yet.</div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                                        {slots.map(slot => {
                                                            const dayLabel = slot.is_recurring 
                                                                ? DAYS[slot.day_of_week] 
                                                                : new Date(slot.specific_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
                                                            const isSelected = bookingForm.slotId === String(slot.slot_id);
                                                            const hasPhysical = slot.location && !slot.location.includes('Online') && slot.location.trim().length > 0;
                                                            const hasOnline = slot.location && slot.location.includes('Online');
                                                            return (
                                                                <button
                                                                    key={slot.slot_id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setBookingForm(p => ({
                                                                            ...p,
                                                                            slotId: String(slot.slot_id),
                                                                            startTime: slot.start_time,
                                                                            endTime: slot.end_time,
                                                                            appointmentDate: slot.specific_date || new Date().toISOString().split('T')[0],
                                                                            meetingType: '',
                                                                            meetingLocation: '',
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 14px',
                                                                        borderRadius: 8,
                                                                        border: isSelected ? '2px solid #1a2744' : '1px solid #e2e8f0',
                                                                        background: isSelected ? '#1a2744' : '#fff',
                                                                        color: isSelected ? '#fff' : '#475569',
                                                                        cursor: 'pointer',
                                                                        fontSize: 12,
                                                                        fontWeight: isSelected ? 600 : 400,
                                                                        minWidth: 80,
                                                                        textAlign: 'center',
                                                                    }}
                                                                >
                                                                    {dayLabel}
                                                                    <br/>
                                                                    <span style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.7 }}>
                                                                        {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                                                    </span>
                                                                    {(hasPhysical || hasOnline) && (
                                                                        <>
                                                                            <br/>
                                                                            <span style={{ fontSize: 9, color: isSelected ? '#fff' : '#64748b' }}>
                                                                                {hasPhysical && 'Physical'}{hasOnline && 'Online'}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {bookingForm.slotId && (
                                                    <div style={{ marginBottom: 16 }}>
                                                        <label style={styles.label}>Choose meeting type *</label>
                                                        <div style={{ display: 'flex', gap: 10 }}>
                                                            {selectedStaff.office_location && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setBookingForm(p => ({ 
                                                                            ...p, 
                                                                            meetingType: 'physical',
                                                                            meetingLocation: selectedStaff.office_location 
                                                                        }));
                                                                    }}
                                                                    style={{
                                                                        padding: '10px 16px',
                                                                        borderRadius: 8,
                                                                        border: bookingForm.meetingType === 'physical' ? '2px solid #1a2744' : '1px solid #e2e8f0',
                                                                        background: bookingForm.meetingType === 'physical' ? '#e8f0fe' : '#fff',
                                                                        cursor: 'pointer',
                                                                        flex: 1,
                                                                        textAlign: 'center',
                                                                    }}
                                                                >
                                                                    Physical
                                                                    <br/>
                                                                    <span style={{ fontSize: 11, color: '#64748b' }}>
                                                                        {selectedStaff.office_location}
                                                                    </span>
                                                                </button>
                                                            )}
                                                            {(() => {
                                                                const selectedSlot = slots.find(s => s.slot_id === parseInt(bookingForm.slotId));
                                                                const hasOnline = selectedSlot && selectedSlot.location && selectedSlot.location.includes('Online');
                                                                if (hasOnline) {
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setBookingForm(p => ({ 
                                                                                    ...p, 
                                                                                    meetingType: 'online',
                                                                                    meetingLocation: selectedSlot.location
                                                                                }));
                                                                            }}
                                                                            style={{
                                                                                padding: '10px 16px',
                                                                                borderRadius: 8,
                                                                                border: bookingForm.meetingType === 'online' ? '2px solid #1a2744' : '1px solid #e2e8f0',
                                                                                background: bookingForm.meetingType === 'online' ? '#e8f0fe' : '#fff',
                                                                                cursor: 'pointer',
                                                                                flex: 1,
                                                                                textAlign: 'center',
                                                                            }}
                                                                        >
                                                                            Online
                                                                            <br/>
                                                                            <span style={{ fontSize: 11, color: '#64748b' }}>
                                                                                Google Meet
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                        {bookingForm.meetingType === 'online' && bookingForm.meetingLocation && (
                                                            <div style={{ fontSize: 11, color: '#1a2744', marginTop: 8, wordBreak: 'break-all' }}>
                                                                Link: {bookingForm.meetingLocation.includes('Online') ? bookingForm.meetingLocation.split('Online — ')[1]?.trim() : bookingForm.meetingLocation}
                                                            </div>
                                                        )}
                                                        {bookingForm.meetingType === 'physical' && (
                                                            <div style={{ fontSize: 11, color: '#1a2744', marginTop: 8 }}>
                                                                Location: {bookingForm.meetingLocation}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <label style={styles.label}>Purpose *</label>
                                                <input style={{ ...styles.input, marginBottom: 12 }} 
                                                    placeholder="e.g. CAT result query, project guidance..." 
                                                    value={bookingForm.purpose} 
                                                    onChange={e => setBookingForm(p => ({ ...p, purpose: e.target.value }))} 
                                                />

                                                <label style={styles.label}>Additional notes (optional)</label>
                                                <textarea style={{ ...styles.textarea, marginBottom: 16 }} 
                                                    value={bookingForm.additionalNotes} 
                                                    onChange={e => setBookingForm(p => ({ ...p, additionalNotes: e.target.value }))} 
                                                />

                                                <button type="submit" style={{ ...styles.btn(), width: '100%' }} disabled={bookingLoading}>
                                                    {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
                                                </button>
                                                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                                                    You can cancel up to 2 hours before the appointment
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

                {view === 'myprofile' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>My Profile</h1>
                            {myProfile && !profileLoadError && (
                                <button style={editMode ? styles.btnOutline : styles.btn()} onClick={() => { setEditMode(!editMode); setProfileMsg(''); setProfileErr(''); }}>
                                    {editMode ? 'Cancel' : 'Edit profile'}
                                </button>
                            )}
                        </div>
                        {profileMsg && <div style={styles.alert('success')}>{profileMsg}</div>}
                        {profileErr && <div style={styles.alert('error')}>{profileErr}</div>}
                        {profileLoadError ? (
                            <div style={styles.alert('error')}>{profileLoadError}</div>
                        ) : !myProfile ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
                        ) : !editMode ? (
                            <div style={styles.card}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                                    <Avatar name={`${myProfile.first_name} ${myProfile.last_name}`} size={72} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 20, color: '#1a2744' }}>{myProfile.first_name} {myProfile.last_name}</div>
                                        <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{myProfile.program}{myProfile.year_of_study ? ` · Year ${myProfile.year_of_study}` : ''}</div>
                                        <div style={{ fontSize: 13, color: '#8b5cf6' }}>{myProfile.faculty || 'No faculty'}</div>
                                        {myProfile.is_student_rep && myProfile.rep_role && (
                                            <div style={{ marginTop: 8 }}>
                                                <Badge label={myProfile.rep_role} color="#b45309" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                    <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Reg Number</span>{myProfile.student_reg_no}</div>
                                    <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Email</span>{user?.email}</div>
                                    {myProfile.phone_number && <div><span style={{ color: '#64748b', fontWeight: 600, width: 140, display: 'inline-block' }}>Phone</span>{myProfile.phone_number}</div>}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.card}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={styles.label}>First name</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} value={profileForm.firstName || ''} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Last name</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} value={profileForm.lastName || ''} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Student Reg No / Admission Number</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} 
                                            placeholder="e.g. ICS-123-2024" 
                                            value={profileForm.studentRegNo || ''} 
                                            onChange={e => setProfileForm(p => ({ ...p, studentRegNo: e.target.value }))} 
                                        />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Program</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} placeholder="e.g. BSc Informatics" value={profileForm.program || ''} onChange={e => setProfileForm(p => ({ ...p, program: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Year of study</label>
                                        <input type="number" min={1} max={6} style={{ ...styles.input, marginBottom: 12 }} 
                                            value={profileForm.yearOfStudy || ''} 
                                            onChange={e => setProfileForm(p => ({ ...p, yearOfStudy: parseInt(e.target.value) || '' }))} 
                                            placeholder="e.g. 3" />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Faculty</label>
                                        <select style={{ ...styles.input, marginBottom: 12 }} 
                                            value={profileForm.faculty || ''} 
                                            onChange={e => setProfileForm(p => ({ ...p, faculty: e.target.value }))}>
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
                                        <label style={styles.label}>Phone number (optional)</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} placeholder="+254..." value={profileForm.phoneNumber || ''} onChange={e => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))} />
                                    </div>
                                </div>
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16, background: '#f8fafc' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: profileForm.isStudentRep ? 12 : 0 }}>
                                        <input type="checkbox" checked={!!profileForm.isStudentRep} onChange={e => setProfileForm(p => ({ ...p, isStudentRep: e.target.checked, repRole: e.target.checked ? p.repRole : '' }))} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2744' }}>I am a student representative</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Class rep, club chair, student council, etc.</div>
                                        </div>
                                    </label>
                                    {profileForm.isStudentRep && (
                                        <div>
                                            <label style={styles.label}>Your rep role</label>
                                            <input style={styles.input} placeholder="e.g. ICS Class Rep Year 3, Basketball Club Chair" value={profileForm.repRole || ''} onChange={e => setProfileForm(p => ({ ...p, repRole: e.target.value }))} />
                                        </div>
                                    )}
                                </div>
                                <button style={styles.btn()} onClick={saveMyProfile} disabled={profileSaving}>
                                    {profileSaving ? 'Saving...' : 'Save changes'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'appointments' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>My Appointments</h1>
                        {appointments.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>
                                No appointments yet. Search the directory to book one.
                            </div>
                        ) : appointments.map(appt => {
                            const statusInfo = getAppointmentStatus(appt);
                            
                            const cardStyles = {
                                ...styles.card,
                                background: statusInfo.bg,
                                borderLeft: `4px solid ${statusInfo.border}`,
                                border: `1px solid ${statusInfo.border}`,
                            };
                            
                            return (
                                <div key={appt.appointment_id} style={cardStyles}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: 16, color: '#1a2744' }}>
                                                    {appt.staff_title ? `${appt.staff_title} ` : ''}{appt.staff_first_name} {appt.staff_last_name}
                                                </span>
                                                <span style={{ 
                                                    fontWeight: 700, 
                                                    fontSize: 13, 
                                                    color: statusInfo.color,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{appt.department_name}</div>
                                            <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                                                {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                {' '}{appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#475569' }}>Purpose: {appt.purpose}</div>
                                            {appt.additional_notes && (
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Note: {appt.additional_notes}</div>
                                            )}
                                            {appt.meeting_link && appt.status === 'confirmed' && statusInfo.status !== 'missed' && (
                                                <div style={{ fontSize: 13, marginTop: 6 }}>
                                                    <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1a2744', fontWeight: 600, textDecoration: 'underline' }}>
                                                        Join Google Meet
                                                    </a>
                                                </div>
                                            )}
                                            {appt.status === 'cancelled' && appt.cancellation_reason && (
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                                    Reason: {appt.cancellation_reason}
                                                </div>
                                            )}
                                            {appt.status === 'declined' && appt.cancellation_reason && (
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                                    Reason: {appt.cancellation_reason}
                                                </div>
                                            )}
                                            {statusInfo.status === 'missed' && (
                                                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>
                                                    This appointment was missed
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: 8, 
                                            marginLeft: 16,
                                            minWidth: 100,
                                            alignItems: 'flex-end'
                                        }}>
                                            {statusInfo.showButtons ? (
                                                <>
                                                    <button 
                                                        onClick={() => openCancelModal(appt.appointment_id)} 
                                                        style={{ 
                                                            background: '#dc2626', 
                                                            color: '#fff', 
                                                            border: 'none', 
                                                            borderRadius: 6, 
                                                            padding: '6px 14px', 
                                                            fontSize: 12, 
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        onClick={() => openRescheduleModal(appt.appointment_id)} 
                                                        style={{ 
                                                            background: '#1a2744', 
                                                            color: '#fff', 
                                                            border: 'none', 
                                                            borderRadius: 6, 
                                                            padding: '6px 14px', 
                                                            fontSize: 12, 
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        Reschedule
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ 
                                                    fontWeight: 700, 
                                                    fontSize: 14, 
                                                    color: statusInfo.color,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    padding: '6px 0'
                                                }}>
                                                    {statusInfo.buttonText}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {view === 'notifications' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>Notifications</h1>
                            {unreadCount > 0 && <button onClick={async () => { await api.markAllNotificationsRead(); loadNotifications(); }} style={styles.btnOutline}>Mark all as read</button>}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>No notifications yet.</div>
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

            {cancelModalOpen && (
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
                }} onClick={() => setCancelModalOpen(false)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 24,
                        maxWidth: 420,
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a2744', marginBottom: 8 }}>Cancel Appointment</h2>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                            Please provide a reason for cancelling this appointment.
                        </p>
                        <label style={styles.label}>Reason for cancellation *</label>
                        <textarea
                            style={{ ...styles.textarea, marginBottom: 16 }}
                            placeholder="Explain why you need to cancel..."
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            rows={3}
                        />
                        {bookingError && <div style={styles.alert('error')}>{bookingError}</div>}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setCancelModalOpen(false);
                                    setCancelReason('');
                                    setBookingError('');
                                }}
                                style={styles.btnOutline}
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                style={{ ...styles.btn('#dc2626') }}
                                disabled={cancelLoading || !cancelReason.trim()}
                            >
                                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        {bookingError && <div style={styles.alert('error')}>{bookingError}</div>}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setRescheduleModalOpen(false);
                                    setRescheduleData({ date: '', startTime: '', endTime: '', reason: '' });
                                    setBookingError('');
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

            <button 
                style={styles.fab}
                onClick={() => { setView('appointments'); loadAppointments(); }}
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