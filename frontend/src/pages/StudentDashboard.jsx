// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Avatar = ({ name, size = 48, bg = '#1a2744' }) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: bg,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: size * 0.35, flexShrink: 0
        }}>{initials}</div>
    );
};

const Badge = ({ label, color = '#1a2744' }) => (
    <span style={{
        background: color + '18', color, border: `1px solid ${color}40`,
        borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600
    }}>{label}</span>
);

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('search'); // search | profile | appointments | notifications
    const [searchQuery, setSearchQuery] = useState('');
    const [staffTypeFilter, setStaffTypeFilter] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [slots, setSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [bookingForm, setBookingForm] = useState({ slotId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '', additionalNotes: '' });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [departments, setDepartments] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => { loadDepartments(); loadNotifications(); }, []);

    const loadDepartments = async () => {
        const res = await api.getDepartments();
        if (res.success) setDepartments(res.data.departments);
    };

    const loadNotifications = async () => {
        const res = await api.getNotifications();
        if (res.success) { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); }
    };

    const handleSearch = useCallback(async (p = 1) => {
        setSearchLoading(true);
        const res = await api.searchDirectory({ query: searchQuery, staffType: staffTypeFilter, page: p, limit: 12 });
        if (res.success) { setSearchResults(res.data.staff); setTotalPages(res.data.totalPages); setPage(p); }
        setSearchLoading(false);
    }, [searchQuery, staffTypeFilter]);

    useEffect(() => { handleSearch(1); }, [staffTypeFilter]);

    const openProfile = async (staffId) => {
        setProfileLoading(true);
        setView('profile');
        setBookingSuccess(''); setBookingError('');
        const [profileRes, slotsRes] = await Promise.all([
            api.getStaffProfile(staffId),
            api.getAvailableSlots(staffId)
        ]);
        if (profileRes.success) setSelectedStaff(profileRes.data.profile);
        if (slotsRes.success) { setSlots(slotsRes.data.slots); setBookedSlots(slotsRes.data.booked); }
        setProfileLoading(false);
    };

    const loadAppointments = async () => {
        const res = await api.getMyAppointments();
        if (res.success) setAppointments(res.data.appointments);
    };

    const handleBook = async (e) => {
        e.preventDefault();
        if (!bookingForm.slotId || !bookingForm.appointmentDate || !bookingForm.purpose) {
            setBookingError('Please select a time slot, date, and provide a purpose.'); return;
        }
        setBookingLoading(true); setBookingError('');
        const res = await api.bookAppointment({ ...bookingForm, staffId: selectedStaff.staff_id });
        if (res.success) {
            setBookingSuccess('Appointment request submitted! You will be notified once the staff member responds.');
            setBookingForm({ slotId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '', additionalNotes: '' });
        } else {
            setBookingError(res.message || 'Booking failed. Please try again.');
        }
        setBookingLoading(false);
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Cancel this appointment?')) return;
        const res = await api.cancelAppointment(appointmentId);
        if (res.success) loadAppointments();
        else alert(res.message);
    };

    const markRead = async (id) => {
        await api.markNotificationRead(id);
        loadNotifications();
    };

    const statusColor = (s) => ({ pending: '#f59e0b', confirmed: '#10b981', cancelled: '#ef4444', completed: '#6366f1' }[s] || '#6b7280');

    const typeLabel = (t) => ({ lecturer: 'Lecturer', mentor: 'Mentor', administrative: 'Admin Staff', student_representative: 'Student Rep' }[t] || t);

    const styles = {
        container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
        navbar: { background: '#1a2744', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 },
        navBrand: { fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' },
        navLinks: { display: 'flex', gap: 4 },
        navBtn: (active) => ({ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400 }),
        main: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
        card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
        input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
        btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
        btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #1a2744', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
        staffCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.2s' },
        label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
        textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
        alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
    };

    return (
        <div style={styles.container}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <span style={styles.navBrand}>📚 SU Directory</span>
                <div style={styles.navLinks}>
                    <button style={styles.navBtn(view === 'search')} onClick={() => setView('search')}>Directory</button>
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
                {/* ── SEARCH VIEW ── */}
                {view === 'search' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>Find university personnel</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Search by name, department, role, or specialisation</p>

                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <input
                                    style={{ ...styles.input, flex: 1 }}
                                    placeholder="Search by name, department, specialisation..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch(1)}
                                />
                                <button style={styles.btn()} onClick={() => handleSearch(1)}>Search</button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {[['', 'All'], ['lecturer', 'Lecturers'], ['mentor', 'Mentors'], ['administrative', 'Admin Staff'], ['student_representative', 'Student Reps']].map(([val, label]) => (
                                    <button key={val} onClick={() => setStaffTypeFilter(val)}
                                        style={{ background: staffTypeFilter === val ? '#1a2744' : '#f1f5f9', color: staffTypeFilter === val ? '#fff' : '#475569', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {searchLoading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Searching...</div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                                {searchQuery ? 'No results found. Try a different search.' : 'Start typing to search the directory.'}
                            </div>
                        ) : (
                            <>
                                <div style={styles.grid}>
                                    {searchResults.map(staff => (
                                        <div key={staff.staff_id} style={styles.staffCard} onClick={() => openProfile(staff.staff_id)}
                                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                                <Avatar name={`${staff.first_name} ${staff.last_name}`} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744' }}>{staff.title ? `${staff.title} ` : ''}{staff.first_name} {staff.last_name}</div>
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>{staff.position || typeLabel(staff.staff_type)}</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{staff.department_name}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Badge label={typeLabel(staff.staff_type)} color="#1a2744" />
                                                <span style={{ fontSize: 11, color: staff.available_slots_count > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                    {staff.available_slots_count > 0 ? `${staff.available_slots_count} slots available` : 'No slots'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                                        <button onClick={() => handleSearch(page - 1)} disabled={page === 1} style={styles.btnOutline}>← Prev</button>
                                        <span style={{ padding: '9px 14px', fontSize: 13 }}>Page {page} of {totalPages}</span>
                                        <button onClick={() => handleSearch(page + 1)} disabled={page === totalPages} style={styles.btnOutline}>Next →</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── PROFILE + BOOKING VIEW ── */}
                {view === 'profile' && (
                    <div>
                        <button onClick={() => setView('search')} style={{ ...styles.btnOutline, marginBottom: 20 }}>← Back to search</button>
                        {profileLoading ? (
                            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading profile...</div>
                        ) : selectedStaff ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                {/* Profile info */}
                                <div>
                                    <div style={styles.card}>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <Avatar name={`${selectedStaff.first_name} ${selectedStaff.last_name}`} size={64} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 18, color: '#1a2744' }}>{selectedStaff.title ? `${selectedStaff.title} ` : ''}{selectedStaff.first_name} {selectedStaff.last_name}</div>
                                                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedStaff.position}</div>
                                                <div style={{ fontSize: 13, color: '#94a3b8' }}>{selectedStaff.department_name} · {selectedStaff.faculty}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                            {selectedStaff.office_location && <div><span style={{ color: '#64748b' }}>📍 Office: </span>{selectedStaff.office_location}</div>}
                                            {selectedStaff.official_email && <div><span style={{ color: '#64748b' }}>✉️ Email: </span><a href={`mailto:${selectedStaff.official_email}`} style={{ color: '#1a2744' }}>{selectedStaff.official_email}</a></div>}
                                            {selectedStaff.office_hours && <div><span style={{ color: '#64748b' }}>🕐 Hours: </span>{selectedStaff.office_hours}</div>}
                                        </div>
                                    </div>
                                    {selectedStaff.areas_of_specialization && (
                                        <div style={styles.card}>
                                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a2744' }}>Areas of Specialisation</div>
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

                                {/* Booking form */}
                                <div style={styles.card}>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2744', marginBottom: 16 }}>Book an Appointment</div>
                                    {bookingSuccess ? (
                                        <div style={styles.alert('success')}>{bookingSuccess}</div>
                                    ) : (
                                        <form onSubmit={handleBook}>
                                            {bookingError && <div style={styles.alert('error')}>{bookingError}</div>}

                                            <label style={styles.label}>Select available time slot *</label>
                                            {slots.length === 0 ? (
                                                <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>No availability slots set by this staff member yet.</div>
                                            ) : (
                                                <select style={{ ...styles.input, marginBottom: 12 }} value={bookingForm.slotId}
                                                    onChange={e => {
                                                        const slot = slots.find(s => s.slot_id === parseInt(e.target.value));
                                                        setBookingForm(prev => ({
                                                            ...prev, slotId: e.target.value,
                                                            startTime: slot?.start_time || '',
                                                            endTime: slot?.end_time || ''
                                                        }));
                                                    }}>
                                                    <option value="">Choose a slot...</option>
                                                    {slots.map(slot => (
                                                        <option key={slot.slot_id} value={slot.slot_id}>
                                                            {slot.is_recurring ? DAYS[slot.day_of_week] : new Date(slot.specific_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                            {' · '}{slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                                                            {slot.location ? ` · ${slot.location}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <label style={styles.label}>Appointment date *</label>
                                            <input type="date" style={{ ...styles.input, marginBottom: 12 }}
                                                min={new Date().toISOString().split('T')[0]}
                                                value={bookingForm.appointmentDate}
                                                onChange={e => setBookingForm(prev => ({ ...prev, appointmentDate: e.target.value }))} />

                                            <label style={styles.label}>Purpose of meeting *</label>
                                            <input style={{ ...styles.input, marginBottom: 12 }} placeholder="e.g. CAT result query, project guidance..."
                                                value={bookingForm.purpose}
                                                onChange={e => setBookingForm(prev => ({ ...prev, purpose: e.target.value }))} />

                                            <label style={styles.label}>Additional notes (optional)</label>
                                            <textarea style={{ ...styles.textarea, marginBottom: 16 }} placeholder="Any additional context..."
                                                value={bookingForm.additionalNotes}
                                                onChange={e => setBookingForm(prev => ({ ...prev, additionalNotes: e.target.value }))} />

                                            <button type="submit" style={{ ...styles.btn(), width: '100%' }} disabled={bookingLoading}>
                                                {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
                                            </button>
                                            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                                                You can cancel up to 2 hours before the appointment
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ── APPOINTMENTS VIEW ── */}
                {view === 'appointments' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>My Appointments</h1>
                        {appointments.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>
                                No appointments yet. <button onClick={() => setView('search')} style={{ color: '#1a2744', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Search the directory</button> to book one.
                            </div>
                        ) : appointments.map(appt => (
                            <div key={appt.appointment_id} style={styles.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, color: '#1a2744', marginBottom: 4 }}>
                                            {appt.staff_title ? `${appt.staff_title} ` : ''}{appt.staff_first_name} {appt.staff_last_name}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{appt.department_name}</div>
                                        <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                                            📅 {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            {' · '}{appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#475569' }}>📝 {appt.purpose}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <Badge label={appt.status.charAt(0).toUpperCase() + appt.status.slice(1)} color={statusColor(appt.status)} />
                                        {['pending', 'confirmed'].includes(appt.status) && (
                                            <button onClick={() => handleCancel(appt.appointment_id)}
                                                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── NOTIFICATIONS VIEW ── */}
                {view === 'notifications' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>Notifications</h1>
                            {unreadCount > 0 && (
                                <button onClick={async () => { await api.markAllNotificationsRead(); loadNotifications(); }} style={styles.btnOutline}>
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <div style={{ ...styles.card, textAlign: 'center', padding: 40, color: '#64748b' }}>No notifications yet.</div>
                        ) : notifications.map(notif => (
                            <div key={notif.notification_id} style={{ ...styles.card, background: notif.is_read ? '#fff' : '#eff6ff', borderColor: notif.is_read ? '#e2e8f0' : '#bfdbfe' }}
                                onClick={() => !notif.is_read && markRead(notif.notification_id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 4 }}>{notif.title}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div style={{ fontSize: 13, color: '#475569' }}>{notif.message}</div>
                                {!notif.is_read && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 4 }}>Click to mark as read</div>}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
