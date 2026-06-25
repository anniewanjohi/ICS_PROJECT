// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [view, setView] = useState('stats');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [departments, setDepartments] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const [newUserForm, setNewUserForm] = useState({ email: '', password: '', role: 'staff' });
    const [deptForm, setDeptForm] = useState({ departmentName: '', departmentCode: '', faculty: '', officeLocation: '', description: '' });
    const [showNewUser, setShowNewUser] = useState(false);
    const [showNewDept, setShowNewDept] = useState(false);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        const res = await api.getAdminStats();
        if (res.success) setStats(res.data);
    };

    const loadUsers = async (p = 1) => {
        setLoading(true);
        const res = await api.getAdminUsers({ role: userRoleFilter, search: userSearch, page: p, limit: 20 });
        if (res.success) { setUsers(res.data.users); setUsersTotal(res.data.total); setUsersTotalPages(res.data.totalPages); setUsersPage(p); }
        setLoading(false);
    };

    const loadDepartments = async () => {
        const res = await api.getAdminDepartments();
        if (res.success) setDepartments(res.data.departments);
    };

    const loadLogs = async () => {
        const res = await api.getAdminLogs({ limit: 100 });
        if (res.success) setLogs(res.data.logs);
    };

    const handleViewChange = (v) => {
        setView(v); setMsg(''); setError('');
        if (v === 'users') loadUsers(1);
        if (v === 'departments') loadDepartments();
        if (v === 'logs') loadLogs();
    };

    const handleToggleStatus = async (userId, isActive) => {
        const res = await api.updateUserStatus(userId, !isActive);
        if (res.success) loadUsers(usersPage);
        else alert(res.message);
    };

    const handleRoleChange = async (userId, currentRole) => {
        const roles = ['student', 'staff', 'admin'];
        const next = roles[(roles.indexOf(currentRole) + 1) % roles.length];
        if (!window.confirm(`Change role to ${next}?`)) return;
        const res = await api.updateUserRole(userId, next);
        if (res.success) loadUsers(usersPage);
        else alert(res.message);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(''); setError('');
        const res = await api.createAdminUser(newUserForm);
        if (res.success) { setMsg('User created successfully.'); setShowNewUser(false); setNewUserForm({ email: '', password: '', role: 'staff' }); loadUsers(1); }
        else setError(res.message || 'Failed to create user.');
        setLoading(false);
    };

    const handleCreateDept = async (e) => {
        e.preventDefault(); setLoading(true); setMsg(''); setError('');
        const res = await api.createDepartment(deptForm);
        if (res.success) { setMsg('Department created.'); setShowNewDept(false); setDeptForm({ departmentName: '', departmentCode: '', faculty: '', officeLocation: '', description: '' }); loadDepartments(); }
        else setError(res.message || 'Failed to create department.');
        setLoading(false);
    };

    const roleColor = (r) => ({ student: '#3b82f6', staff: '#10b981', admin: '#8b5cf6' }[r] || '#6b7280');

    const styles = {
        container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
        navbar: { background: '#1a2744', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100 },
        navBtn: (active) => ({ background: active ? 'rgba(255,255,255,0.15)' : 'transparent', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400 }),
        main: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
        card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 16 },
        input: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 },
        label: { fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4, display: 'block' },
        btn: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }),
        btnSm: (color = '#1a2744') => ({ background: color, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontWeight: 600, fontSize: 11, cursor: 'pointer' }),
        btnOutline: { background: '#fff', color: '#1a2744', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
        alert: (type) => ({ background: type === 'error' ? '#fef2f2' : '#f0fdf4', border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: type === 'error' ? '#dc2626' : '#16a34a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }),
        badge: (color) => ({ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }),
        th: { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
        td: { padding: '12px', fontSize: 13, color: '#475569', borderBottom: '1px solid #f1f5f9' },
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>📚 SU Directory — Admin</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button style={styles.navBtn(view === 'stats')} onClick={() => handleViewChange('stats')}>Overview</button>
                    <button style={styles.navBtn(view === 'users')} onClick={() => handleViewChange('users')}>Users</button>
                    <button style={styles.navBtn(view === 'departments')} onClick={() => handleViewChange('departments')}>Departments</button>
                    <button style={styles.navBtn(view === 'logs')} onClick={() => handleViewChange('logs')}>Audit Logs</button>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, opacity: 0.8 }}>{user?.email}</span>
                    <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Sign out</button>
                </div>
            </nav>

            <main style={styles.main}>
                {msg && <div style={styles.alert('success')}>{msg}</div>}
                {error && <div style={styles.alert('error')}>{error}</div>}

                {/* ── STATS ── */}
                {view === 'stats' && stats && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>System Overview</h1>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'Total users', value: stats.total_users, color: '#3b82f6' },
                                { label: 'Students', value: stats.total_students, color: '#10b981' },
                                { label: 'Staff', value: stats.total_staff, color: '#8b5cf6' },
                                { label: 'Staff profiles', value: stats.total_staff_profiles, color: '#f59e0b' },
                                { label: 'Total appointments', value: stats.total_appointments, color: '#6366f1' },
                                { label: 'Pending appointments', value: stats.pending_appointments, color: '#ef4444' },
                                { label: 'Confirmed appointments', value: stats.confirmed_appointments, color: '#10b981' },
                                { label: "Today's appointments", value: stats.todays_appointments, color: '#1a2744' },
                                { label: 'Departments', value: stats.total_departments, color: '#64748b' },
                            ].map((s, i) => (
                                <div key={i} style={{ ...styles.card, marginBottom: 0, borderLeft: `4px solid ${s.color}` }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value ?? '—'}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── USERS ── */}
                {view === 'users' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>User Accounts</h1>
                            <button style={styles.btn()} onClick={() => setShowNewUser(!showNewUser)}>+ Create user</button>
                        </div>

                        {showNewUser && (
                            <div style={styles.card}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 14 }}>Create new user account</div>
                                <form onSubmit={handleCreateUser}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={styles.label}>Email *</label>
                                            <input style={styles.input} type="email" placeholder="user@strathmore.edu" value={newUserForm.email} onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Password *</label>
                                            <input style={styles.input} type="password" placeholder="Min 8 chars" value={newUserForm.password} onChange={e => setNewUserForm(p => ({ ...p, password: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Role *</label>
                                            <select style={styles.input} value={newUserForm.role} onChange={e => setNewUserForm(p => ({ ...p, role: e.target.value }))}>
                                                <option value="student">Student</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button type="submit" style={styles.btn()} disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
                                        <button type="button" style={styles.btnOutline} onClick={() => setShowNewUser(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={styles.card}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                <input style={{ ...styles.input, flex: 1, marginBottom: 0 }} placeholder="Search by email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers(1)} />
                                <select style={{ ...styles.input, width: 140, marginBottom: 0 }} value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); }}>
                                    <option value="">All roles</option>
                                    <option value="student">Student</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button style={styles.btn()} onClick={() => loadUsers(1)}>Search</button>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>Loading...</div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Name / Email</th>
                                            <th style={styles.th}>Role</th>
                                            <th style={styles.th}>Reg No / Staff No</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Last login</th>
                                            <th style={styles.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.user_id}>
                                                <td style={styles.td}>
                                                    <div style={{ fontWeight: 600, color: '#1a2744' }}>{u.full_name || '—'}</div>
                                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.badge(roleColor(u.role))}>{u.role}</span>
                                                </td>
                                                <td style={styles.td}>{u.student_reg_no || u.staff_number || '—'}</td>
                                                <td style={styles.td}>
                                                    <span style={styles.badge(u.is_active ? '#10b981' : '#ef4444')}>{u.is_active ? 'Active' : 'Suspended'}</span>
                                                </td>
                                                <td style={styles.td}>{u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</td>
                                                <td style={styles.td}>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button style={styles.btnSm(u.is_active ? '#ef4444' : '#10b981')} onClick={() => handleToggleStatus(u.user_id, u.is_active)}>
                                                            {u.is_active ? 'Suspend' : 'Activate'}
                                                        </button>
                                                        <button style={styles.btnSm('#8b5cf6')} onClick={() => handleRoleChange(u.user_id, u.role)}>
                                                            Role ↻
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {usersTotalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                                    <button onClick={() => loadUsers(usersPage - 1)} disabled={usersPage === 1} style={styles.btnOutline}>← Prev</button>
                                    <span style={{ padding: '9px 14px', fontSize: 13 }}>Page {usersPage} of {usersTotalPages} ({usersTotal} users)</span>
                                    <button onClick={() => loadUsers(usersPage + 1)} disabled={usersPage === usersTotalPages} style={styles.btnOutline}>Next →</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── DEPARTMENTS ── */}
                {view === 'departments' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744' }}>Departments</h1>
                            <button style={styles.btn()} onClick={() => setShowNewDept(!showNewDept)}>+ Add department</button>
                        </div>

                        {showNewDept && (
                            <div style={styles.card}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 14 }}>Add new department</div>
                                <form onSubmit={handleCreateDept}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                        <div>
                                            <label style={styles.label}>Department name *</label>
                                            <input style={styles.input} placeholder="e.g. Informatics" value={deptForm.departmentName} onChange={e => setDeptForm(p => ({ ...p, departmentName: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Code *</label>
                                            <input style={styles.input} placeholder="e.g. ICS" value={deptForm.departmentCode} onChange={e => setDeptForm(p => ({ ...p, departmentCode: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Faculty *</label>
                                            <input style={styles.input} placeholder="e.g. SCES" value={deptForm.faculty} onChange={e => setDeptForm(p => ({ ...p, faculty: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={styles.label}>Office location</label>
                                            <input style={styles.input} placeholder="e.g. Block C" value={deptForm.officeLocation} onChange={e => setDeptForm(p => ({ ...p, officeLocation: e.target.value }))} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={styles.label}>Description</label>
                                            <input style={styles.input} placeholder="Brief description..." value={deptForm.description} onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button type="submit" style={styles.btn()} disabled={loading}>{loading ? 'Saving...' : 'Save department'}</button>
                                        <button type="button" style={styles.btnOutline} onClick={() => setShowNewDept(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {departments.map(d => (
                                <div key={d.department_id} style={styles.card}>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2744', marginBottom: 4 }}>{d.department_name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{d.department_code} · {d.faculty}</div>
                                    {d.office_location && <div style={{ fontSize: 12, color: '#64748b' }}>📍 {d.office_location}</div>}
                                    {d.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{d.description}</div>}
                                </div>
                            ))}
                            {departments.length === 0 && (
                                <div style={{ ...styles.card, color: '#64748b', textAlign: 'center', padding: 30 }}>No departments yet. Add one above.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── AUDIT LOGS ── */}
                {view === 'logs' && (
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a2744', marginBottom: 20 }}>Audit Logs</h1>
                        <div style={styles.card}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Time</th>
                                        <th style={styles.th}>User</th>
                                        <th style={styles.th}>Action</th>
                                        <th style={styles.th}>Entity</th>
                                        <th style={styles.th}>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.log_id}>
                                            <td style={styles.td}>{new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td style={styles.td}>{log.email || `User ${log.user_id}` || 'System'}</td>
                                            <td style={styles.td}><span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{log.action}</span></td>
                                            <td style={styles.td}>{log.entity_type ? `${log.entity_type} #${log.entity_id}` : '—'}</td>
                                            <td style={styles.td}>{log.ip_address || '—'}</td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>No logs yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
