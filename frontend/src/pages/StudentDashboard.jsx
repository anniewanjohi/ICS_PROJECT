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
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{label}</span>
);

const typeLabel = (t) => ({
    lecturer: 'Lecturer', mentor: 'Mentor',
    administrative: 'Admin Staff', student_representative: 'Student Rep'
}[t] || t);

const typeColor = (t) => ({
    lecturer: '#1a2744', mentor: '#7c3aed',
    administrative: '#0369a1', student_representative: '#b45309'
}[t] || '#64748b');

const statusColor = (s) => ({ pending: '#f59e0b', confirmed: '#10b981', cancelled: '#ef4444', completed: '#6366f1' }[s] || '#6b7280');

const styles = {
    container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    navbar: { background: '#1a2744', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 },
    navBtn: (active) => ({ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400 }),
    main: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
    card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
    input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
    btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #1a2744', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
    label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
    textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' },
    alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
};

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [staffTypeFilter, setStaffTypeFilter] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [slots, setSlots] = useState([]);
    const [bookingForm, setBookingForm] = useState({ slotId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '', additionalNotes: '' });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [bookingError, setBookingError] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // My profile state
    const [myProfile, setMyProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({});
    const [profileMsg, setProfileMsg] = useState('');
    const [profileErr, setProfileErr] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => { handleSearch(1); loadNotifications(); }, []);
    useEffect(() => { handleSearch(1); }, [staffTypeFilter]);

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

    const openProfile = async (item) => {
        // student reps don't have staff booking — just show info
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
        if (profileRes.success) setSelectedStaff({ ...profileRes.data.profile, isRep: false });
        if (slotsRes.success) setSlots(slotsRes.data.slots);
        setProfileLoading(false);
    };

    const loadMyProfile = async () => {
        const res = await api.getMe();
        if (res.success) {
            setMyProfile(res.data.user.profile);
            setProfileForm({
                firstName: res.data.user.profile?.first_name || '',
                lastName: res.data.user.profile?.last_name || '',
                program: res.data.user.profile?.program || '',
                yearOfStudy: res.data.user.profile?.year_of_study || '',
                department: res.data.user.profile?.department || '',
                phoneNumber: res.data.user.profile?.phone_number || '',
                isStudentRep: res.data.user.profile?.is_student_rep || false,
                repRole: res.data.user.profile?.rep_role || '',
            });
        }
    };

    const saveMyProfile = async () => {
        setProfileSaving(true); setProfileMsg(''); setProfileErr('');
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/staff/student-profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}` },
            body: JSON.stringify(profileForm),
        });
        const data = await res.json();
        if (data.success) { setProfileMsg('Profile updated!'); setEditMode(false); loadMyProfile(); }
        else setProfileErr(data.message || 'Update failed');
        setProfileSaving(false);
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
            setBookingSuccess('Appointment request submitted! You will be notified once confirmed.');
            setBookingForm({ slotId: '', appointmentDate: '', startTime: '', endTime: '', purpose: '', additionalNotes: '' });
        } else {
            setBookingError(res.message || 'Booking failed. Please try again.');
        }
        setBookingLoading(false);
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this appointment?')) return;
        const res = await api.cancelAppointment(id);
        if (res.success) loadAppointments();
        else alert(res.message);
    };

    const filters = [
        { val: '', label: 'All' },
        { val: 'lecturer', label: 'Lecturers' },
        { val: 'mentor', label: 'Mentors' },
        { val: 'administrative', label: 'Admin Staff' },
        { val: 'student_representative', label: 'Student Reps' },
    ];

    return (
        <div style={styles.container}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>📚 SU Directory</span>
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

                {/* ── SEARCH ── */}
                {view === 'search' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 4 }}>Find university personnel</h1>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Search by name, department, role, or specialisation</p>

                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <input style={{ ...styles.input, flex: 1 }} placeholder="Search by name, department, specialisation..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch(1)} />
                                <button style={styles.btn()} onClick={() => handleSearch(1)}>Search</button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {filters.map(({ val, label }) => (
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
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No results found.</div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                    {searchResults.map((item, i) => (
                                        <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, cursor: 'pointer', transition: 'all 0.2s' }}
                                            onClick={() => openProfile(item)}
                                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                                <Avatar name={`${item.first_name} ${item.last_name}`} bg={typeColor(item.staff_type)} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744' }}>
                                                        {item.title ? `${item.title} ` : ''}{item.first_name} {item.last_name}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#64748b' }}>{item.position || item.rep_role}</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.department_name || item.program}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    <Badge label={typeLabel(item.staff_type)} color={typeColor(item.staff_type)} />
                                                    {item.is_mentor === true || item.is_mentor === 1 ? <Badge label="Mentor" color="#7c3aed" /> : null}
                                                </div>
                                                {item.source_type !== 'student_rep' && (
                                                    <span style={{ fontSize: 11, color: item.available_slots_count > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                        {item.available_slots_count > 0 ? `${item.available_slots_count} slots` : 'No slots'}
                                                    </span>
                                                )}
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

                {/* ── PROFILE VIEW (staff or rep) ── */}
                {view === 'profile' && (
                    <div>
                        <button onClick={() => setView('search')} style={{ ...styles.btnOutline, marginBottom: 20 }}>← Back to search</button>
                        {profileLoading ? (
                            <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading profile...</div>
                        ) : selectedStaff ? (
                            <div style={{ display: 'grid', gridTemplateColumns: selectedStaff.isRep ? '1fr' : '1fr 1fr', gap: 20 }}>
                                <div>
                                    <div style={styles.card}>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                            <Avatar name={`${selectedStaff.first_name} ${selectedStaff.last_name}`} size={64} bg={typeColor(selectedStaff.staff_type)} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 18, color: '#1a2744' }}>
                                                    {selectedStaff.title ? `${selectedStaff.title} ` : ''}{selectedStaff.first_name} {selectedStaff.last_name}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#64748b' }}>{selectedStaff.position || selectedStaff.rep_role}</div>
                                                <div style={{ fontSize: 13, color: '#94a3b8' }}>{selectedStaff.department_name || selectedStaff.program}</div>
                                                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                                    <Badge label={typeLabel(selectedStaff.staff_type)} color={typeColor(selectedStaff.staff_type)} />
                                                    {(selectedStaff.is_mentor === true || selectedStaff.is_mentor === 1) && <Badge label="Mentor" color="#7c3aed" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                            {selectedStaff.office_location && <div><span style={{ color: '#64748b' }}>📍 </span>{selectedStaff.office_location}</div>}
                                            {selectedStaff.official_email && <div><span style={{ color: '#64748b' }}>✉️ </span><a href={`mailto:${selectedStaff.official_email}`} style={{ color: '#1a2744' }}>{selectedStaff.official_email}</a></div>}
                                            {selectedStaff.office_hours && <div><span style={{ color: '#64748b' }}>🕐 </span>{selectedStaff.office_hours}</div>}
                                            {selectedStaff.year_of_study && <div><span style={{ color: '#64748b' }}>📚 </span>Year {selectedStaff.year_of_study}</div>}
                                        </div>
                                    </div>
                                    {selectedStaff.areas_of_specialization && (
                                        <div style={styles.card}>
                                            <div style={{ fontWeight: 600, marginBottom: 8, color: '#1a2744' }}>
                                                {selectedStaff.isRep ? 'Role & Responsibilities' : 'Areas of Specialisation'}
                                            </div>
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

                                {/* Booking — only for actual staff, not student reps */}
                                {!selectedStaff.isRep && (
                                    <div style={styles.card}>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2744', marginBottom: 16 }}>Book an Appointment</div>
                                        {bookingSuccess ? (
                                            <div style={styles.alert('success')}>{bookingSuccess}</div>
                                        ) : (
                                            <form onSubmit={handleBook}>
                                                {bookingError && <div style={styles.alert('error')}>{bookingError}</div>}
                                                <label style={styles.label}>Select time slot *</label>
                                                {slots.length === 0 ? (
                                                    <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>No availability slots set yet.</div>
                                                ) : (
                                                    <select style={{ ...styles.input, marginBottom: 12 }} value={bookingForm.slotId}
                                                        onChange={e => {
                                                            const slot = slots.find(s => s.slot_id === parseInt(e.target.value));
                                                            setBookingForm(p => ({ ...p, slotId: e.target.value, startTime: slot?.start_time || '', endTime: slot?.end_time || '' }));
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
                                                    onChange={e => setBookingForm(p => ({ ...p, appointmentDate: e.target.value }))} />
                                                <label style={styles.label}>Purpose *</label>
                                                <input style={{ ...styles.input, marginBottom: 12 }} placeholder="e.g. CAT result query, project guidance..."
                                                    value={bookingForm.purpose} onChange={e => setBookingForm(p => ({ ...p, purpose: e.target.value }))} />
                                                <label style={styles.label}>Additional notes (optional)</label>
                                                <textarea style={{ ...styles.textarea, marginBottom: 16 }} value={bookingForm.additionalNotes}
                                                    onChange={e => setBookingForm(p => ({ ...p, additionalNotes: e.target.value }))} />
                                                <button type="submit" style={{ ...styles.btn(), width: '100%' }} disabled={bookingLoading}>
                                                    {bookingLoading ? 'Submitting...' : 'Submit Booking Request'}
                                                </button>
                                                <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>You can cancel up to 2 hours before the appointment</div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

                {/* ── MY PROFILE ── */}
                {view === 'myprofile' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>My Profile</h1>
                            <button style={editMode ? styles.btnOutline : styles.btn()} onClick={() => { setEditMode(!editMode); setProfileMsg(''); setProfileErr(''); }}>
                                {editMode ? 'Cancel' : '✏️ Edit profile'}
                            </button>
                        </div>

                        {profileMsg && <div style={styles.alert('success')}>{profileMsg}</div>}
                        {profileErr && <div style={styles.alert('error')}>{profileErr}</div>}

                        {!myProfile ? (
                            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
                        ) : !editMode ? (
                            /* VIEW MODE */
                            <div style={styles.card}>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                                    <Avatar name={`${myProfile.first_name} ${myProfile.last_name}`} size={72} />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 20, color: '#1a2744' }}>{myProfile.first_name} {myProfile.last_name}</div>
                                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{myProfile.program} {myProfile.year_of_study ? `· Year ${myProfile.year_of_study}` : ''}</div>
                                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{myProfile.department}</div>
                                        {myProfile.is_student_rep ? (
                                            <div style={{ marginTop: 8 }}>
                                                <Badge label={`Student Rep · ${myProfile.rep_role || 'Representative'}`} color="#b45309" />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                                    <div><span style={{ color: '#64748b', fontWeight: 600, width: 120, display: 'inline-block' }}>Reg Number</span>{myProfile.student_reg_no}</div>
                                    <div><span style={{ color: '#64748b', fontWeight: 600, width: 120, display: 'inline-block' }}>Email</span>{user?.email}</div>
                                    {myProfile.phone_number && <div><span style={{ color: '#64748b', fontWeight: 600, width: 120, display: 'inline-block' }}>Phone</span>{myProfile.phone_number}</div>}
                                </div>
                            </div>
                        ) : (
                            /* EDIT MODE */
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
                                        <label style={styles.label}>Program</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} placeholder="e.g. BSc Informatics" value={profileForm.program || ''} onChange={e => setProfileForm(p => ({ ...p, program: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Year of study</label>
                                        <input type="number" min={1} max={6} style={{ ...styles.input, marginBottom: 12 }} value={profileForm.yearOfStudy || ''} onChange={e => setProfileForm(p => ({ ...p, yearOfStudy: parseInt(e.target.value) }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Department</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} placeholder="e.g. Informatics" value={profileForm.department || ''} onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Phone number (optional)</label>
                                        <input style={{ ...styles.input, marginBottom: 12 }} placeholder="+254..." value={profileForm.phoneNumber || ''} onChange={e => setProfileForm(p => ({ ...p, phoneNumber: e.target.value }))} />
                                    </div>
                                </div>

                                {/* Student rep toggle */}
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 16, background: '#f8fafc' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: profileForm.isStudentRep ? 12 : 0 }}>
                                        <input type="checkbox" checked={!!profileForm.isStudentRep} onChange={e => setProfileForm(p => ({ ...p, isStudentRep: e.target.checked, repRole: e.target.checked ? p.repRole : '' }))} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2744' }}>I am a student representative</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>Check this if you hold a rep role — class rep, club chair, student council, etc.</div>
                                        </div>
                                    </label>
                                    {profileForm.isStudentRep && (
                                        <div>
                                            <label style={styles.label}>Your rep role</label>
                                            <input style={styles.input} placeholder="e.g. ICS Class Rep Year 3, Basketball Club Chair, Student Council Secretary"
                                                value={profileForm.repRole || ''} onChange={e => setProfileForm(p => ({ ...p, repRole: e.target.value }))} />
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

                {/* ── APPOINTMENTS ── */}
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

                {/* ── NOTIFICATIONS ── */}
                {view === 'notifications' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>Notifications</h1>
                            {unreadCount > 0 && (
                                <button onClick={async () => { await api.markAllNotificationsRead(); loadNotifications(); }} style={styles.btnOutline}>Mark all as read</button>
                            )}
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
        </div>
    );
}
