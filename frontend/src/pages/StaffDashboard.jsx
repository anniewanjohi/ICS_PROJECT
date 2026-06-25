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

const statusColor = (s) => ({ pending: '#f59e0b', confirmed: '#10b981', cancelled: '#ef4444', completed: '#6366f1' }[s] || '#6b7280');

export default function StaffDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('appointments');
    const [appointments, setAppointments] = useState([]);
    const [profile, setProfile] = useState(null);
    const [slots, setSlots] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const [profileForm, setProfileForm] = useState({ title: '', position: '', officeLocation: '', officeHours: '', officialEmail: '', areasOfSpecialization: '', biography: '', isAvailableForBooking: true });
    const [slotForm, setSlotForm] = useState({ dayOfWeek: '', startTime: '', endTime: '', slotDuration: 30, location: '', isRecurring: true, specificDate: '' });

    useEffect(() => { loadAppointments(); loadNotifications(); }, []);

    const loadAppointments = async () => {
        const res = await api.getMyAppointments();
        if (res.success) setAppointments(res.data.appointments);
    };

    const loadProfile = async () => {
        const res = await api.getMyStaffProfile();
        if (res.success) { setProfile(res.data.profile); setProfileForm({ title: res.data.profile.title || '', position: res.data.profile.position || '', officeLocation: res.data.profile.office_location || '', officeHours: res.data.profile.office_hours || '', officialEmail: res.data.profile.official_email || '', areasOfSpecialization: res.data.profile.areas_of_specialization || '', biography: res.data.profile.biography || '', isAvailableForBooking: res.data.profile.is_available_for_booking }); }
    };

    const loadSlots = async () => {
        const res = await api.getMyAvailability();
        if (res.success) setSlots(res.data.slots);
    };

    const loadNotifications = async () => {
        const res = await api.getNotifications();
        if (res.success) { setNotifications(res.data.notifications); setUnreadCount(res.data.unreadCount); }
    };

    const handleViewChange = (v) => {
        setView(v); setMsg(''); setError('');
        if (v === 'profile' && !profile) loadProfile();
        if (v === 'availability') loadSlots();
        if (v === 'notifications') loadNotifications();
    };

    const handleRespond = async (appointmentId, status) => {
        const reason = status === 'declined' ? prompt('Reason for declining (optional):') : '';
        const res = await api.respondToAppointment(appointmentId, status, reason || '');
        if (res.success) { loadAppointments(); loadNotifications(); }
        else alert(res.message);
    };

    const handleProfileSave = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(''); setError('');
        const res = await api.updateStaffProfile(profileForm);
        if (res.success) setMsg('Profile updated successfully.');
        else setError(res.message || 'Update failed.');
        setLoading(false);
    };

    const handleAddSlot = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(''); setError('');
        const res = await api.addAvailabilitySlot(slotForm);
        if (res.success) { setMsg('Slot added.'); loadSlots(); setSlotForm({ dayOfWeek: '', startTime: '', endTime: '', slotDuration: 30, location: '', isRecurring: true, specificDate: '' }); }
        else setError(res.message || 'Failed to add slot.');
        setLoading(false);
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Remove this availability slot?')) return;
        const res = await api.deleteAvailabilitySlot(slotId);
        if (res.success) loadSlots();
        else alert(res.message);
    };

    const pending = appointments.filter(a => a.status === 'pending');
    const upcoming = appointments.filter(a => a.status === 'confirmed' && new Date(a.appointment_date) >= new Date());

    const styles = {
        container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
        navbar: { background: '#1a2744', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 },
        navBtn: (active) => ({ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400 }),
        main: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
        card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
        input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
        label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
        btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
        btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
        alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
        textarea: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', marginBottom: 12 },
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>📚 SU Directory — Staff</span>
                <div style={{ display: 'flex', gap: 4 }}>
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
                {/* ── APPOINTMENTS ── */}
                {view === 'appointments' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Appointment Inbox</h1>

                        {pending.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>⏳ Pending requests ({pending.length})</div>
                                {pending.map(appt => (
                                    <div key={appt.appointment_id} style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 2 }}>
                                                    {appt.student_first_name} {appt.student_last_name}
                                                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>({appt.student_reg_no})</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{appt.program} · Year {appt.year_of_study}</div>
                                                <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                                                    📅 {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#475569' }}>📝 {appt.purpose}</div>
                                                {appt.additional_notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Note: {appt.additional_notes}</div>}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleRespond(appt.appointment_id, 'confirmed')} style={styles.btn('#10b981')}>✓ Confirm</button>
                                                <button onClick={() => handleRespond(appt.appointment_id, 'declined')} style={{ ...styles.btn(), background: '#fff', color: '#dc2626', border: '1px solid #fecaca' }}>✕ Decline</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>📅 Upcoming confirmed ({upcoming.length})</div>
                            {upcoming.length === 0 ? (
                                <div style={{ ...styles.card, color: '#64748b', textAlign: 'center', padding: 30 }}>No upcoming appointments.</div>
                            ) : upcoming.map(appt => (
                                <div key={appt.appointment_id} style={{ ...styles.card, borderLeft: '4px solid #10b981' }}>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744', marginBottom: 2 }}>{appt.student_first_name} {appt.student_last_name}</div>
                                    <div style={{ fontSize: 13, color: '#64748b' }}>
                                        {new Date(appt.appointment_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {appt.start_time?.substring(0, 5)} – {appt.end_time?.substring(0, 5)}
                                    </div>
                                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>📝 {appt.purpose}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── PROFILE ── */}
                {view === 'profile' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>My Profile</h1>
                        {msg && <div style={styles.alert('success')}>{msg}</div>}
                        {error && <div style={styles.alert('error')}>{error}</div>}
                        <div style={styles.card}>
                            <form onSubmit={handleProfileSave}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={styles.label}>Title (Dr., Prof., Mr., Ms.)</label>
                                        <input style={styles.input} value={profileForm.title} onChange={e => setProfileForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Dr." />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Position</label>
                                        <input style={styles.input} value={profileForm.position} onChange={e => setProfileForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Senior Lecturer" />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Office location</label>
                                        <input style={styles.input} value={profileForm.officeLocation} onChange={e => setProfileForm(p => ({ ...p, officeLocation: e.target.value }))} placeholder="e.g. Block C, Room 214" />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Office hours</label>
                                        <input style={styles.input} value={profileForm.officeHours} onChange={e => setProfileForm(p => ({ ...p, officeHours: e.target.value }))} placeholder="e.g. Mon–Fri, 9am–12pm" />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Official email</label>
                                        <input style={styles.input} type="email" value={profileForm.officialEmail} onChange={e => setProfileForm(p => ({ ...p, officialEmail: e.target.value }))} placeholder="you@strathmore.edu" />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                                        <input type="checkbox" id="available" checked={profileForm.isAvailableForBooking} onChange={e => setProfileForm(p => ({ ...p, isAvailableForBooking: e.target.checked }))} />
                                        <label htmlFor="available" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>Available for bookings</label>
                                    </div>
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    <label style={styles.label}>Areas of specialisation</label>
                                    <input style={styles.input} value={profileForm.areasOfSpecialization} onChange={e => setProfileForm(p => ({ ...p, areasOfSpecialization: e.target.value }))} placeholder="e.g. Automata Theory, Algorithms, Software Engineering" />
                                </div>
                                <div>
                                    <label style={styles.label}>Biography</label>
                                    <textarea style={styles.textarea} value={profileForm.biography} onChange={e => setProfileForm(p => ({ ...p, biography: e.target.value }))} placeholder="A brief bio about yourself..." />
                                </div>
                                <button type="submit" style={styles.btn()} disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── AVAILABILITY ── */}
                {view === 'availability' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Availability Slots</h1>
                        {msg && <div style={styles.alert('success')}>{msg}</div>}
                        {error && <div style={styles.alert('error')}>{error}</div>}

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
                                            <label style={styles.label}>Day of week *</label>
                                            <select style={{ ...styles.input, marginBottom: 0 }} value={slotForm.dayOfWeek} onChange={e => setSlotForm(p => ({ ...p, dayOfWeek: e.target.value }))}>
                                                <option value="">Select day...</option>
                                                {DAYS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={styles.label}>Specific date *</label>
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
                                        <label style={styles.label}>Location (optional)</label>
                                        <input style={{ ...styles.input, marginBottom: 0 }} placeholder="e.g. Office, Online" value={slotForm.location} onChange={e => setSlotForm(p => ({ ...p, location: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={styles.label}>Slot duration (minutes)</label>
                                        <input type="number" style={{ ...styles.input, marginBottom: 0 }} value={slotForm.slotDuration} min={15} max={120} step={15} onChange={e => setSlotForm(p => ({ ...p, slotDuration: parseInt(e.target.value) }))} />
                                    </div>
                                </div>
                                <button type="submit" style={{ ...styles.btn(), marginTop: 14 }} disabled={loading}>{loading ? 'Adding...' : '+ Add slot'}</button>
                            </form>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 12 }}>Current slots ({slots.length})</div>
                        {slots.length === 0 ? (
                            <div style={{ ...styles.card, color: '#64748b', textAlign: 'center', padding: 30 }}>No availability slots set. Add one above.</div>
                        ) : slots.map(slot => (
                            <div key={slot.slot_id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2744' }}>
                                        {slot.is_recurring ? DAYS[slot.day_of_week] : new Date(slot.specific_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        {' · '}{slot.start_time?.substring(0, 5)} – {slot.end_time?.substring(0, 5)}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                        {slot.slot_duration} min · {slot.is_recurring ? 'Recurring weekly' : 'One-off'}{slot.location ? ` · ${slot.location}` : ''}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteSlot(slot.slot_id)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {view === 'notifications' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Notifications</h1>
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
        </div>
    );
}
