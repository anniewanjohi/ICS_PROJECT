import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ user }) => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState('Dashboard');

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.profile?.first_name && user?.profile?.last_name) {
            return `${user.profile.first_name[0]}${user.profile.last_name[0]}`;
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return 'S';
    };

    const getUserName = () => {
        if (user?.profile?.first_name) {
            return `${user.profile.first_name} ${user.profile.last_name || ''}`;
        }
        return user?.email?.split('@')[0] || 'Student';
    };

    const getUserProgram = () => {
        return user?.profile?.program || 'School of Computing and Engineering Sciences';
    };

    // ✅ FIXED: Logout function - guaranteed to work
    const handleLogout = () => {
        console.log('🔓 Logging out...');
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Storage cleared, redirecting...');
        // Redirect to landing page
        window.location.href = '/';
    };

    const handleMenuClick = (menuItem) => {
        setActiveMenu(menuItem);
        if (menuItem === 'Dashboard') {
            window.location.href = '/dashboard';
        } else if (menuItem === 'Browse Directory') {
            window.location.href = '/directory';
        } else if (menuItem === 'My Appointments') {
            window.location.href = '/appointments';
        }
    };

    // Personnel data
    const personnel = [
        {
            id: 1,
            name: 'Salome Monthe Chemiat',
            role: 'Lecturer · Project Supervisor',
            department: 'School of Computing & Engineering Sciences',
            avatar: 'SM',
            avatarClass: 'av-navy',
            availability: 'Available',
            statusClass: 'avail-on'
        },
        {
            id: 2,
            name: 'Dr. Kevin Otieno',
            role: 'Senior Lecturer',
            department: 'Dept. of Informatics & Computer Science',
            avatar: 'KO',
            avatarClass: 'av-gold',
            availability: 'Limited',
            statusClass: 'avail-ltd'
        },
        {
            id: 3,
            name: 'Agnes Wanjiku',
            role: 'Student Mentor',
            department: 'Student Welfare & Mentorship Office',
            avatar: 'AW',
            avatarClass: 'av-green',
            availability: 'Available',
            statusClass: 'avail-on'
        },
        {
            id: 4,
            name: 'Robert Mwangi',
            role: 'Registrar · Academic Affairs',
            department: 'Office of the Registrar',
            avatar: 'RM',
            avatarClass: 'av-navy',
            availability: 'Unavailable',
            statusClass: 'avail-off'
        },
        {
            id: 5,
            name: 'Faith Mutua',
            role: 'ICS Student Representative',
            department: 'Student Government · Year 3',
            avatar: 'FM',
            avatarClass: 'av-red',
            availability: 'Available',
            statusClass: 'avail-on'
        },
        {
            id: 6,
            name: 'Prof. Peter Kamau',
            role: 'Associate Professor',
            department: 'Dept. of Data Science & AI',
            avatar: 'PK',
            avatarClass: 'av-gold',
            availability: 'Limited',
            statusClass: 'avail-ltd'
        }
    ];

    // Filter personnel based on active filter
    const filteredPersonnel = personnel.filter(person => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Lecturers') return person.role.includes('Lecturer') || person.role.includes('Professor');
        if (activeFilter === 'Mentors') return person.role.includes('Mentor');
        if (activeFilter === 'Admin Staff') return person.role.includes('Registrar') || person.role.includes('Administrative');
        if (activeFilter === 'Student Reps') return person.role.includes('Student Representative');
        return true;
    });

    // Filter based on search
    const searchedPersonnel = filteredPersonnel.filter(person => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return person.name.toLowerCase().includes(query) ||
               person.role.toLowerCase().includes(query) ||
               person.department.toLowerCase().includes(query);
    });

    // Time slots
    const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM'];
    const unavailableSlots = ['8:00 AM', '12:00 PM'];

    const handleSlotClick = (slot) => {
        if (unavailableSlots.includes(slot)) return;
        setSelectedSlot(slot);
    };

    const handleBookAppointment = (personName) => {
        alert(`Booking appointment with ${personName}`);
    };

    const handleQuickBook = () => {
        if (!selectedSlot) {
            alert('Please select a time slot');
            return;
        }
        alert(`Appointment requested for ${selectedSlot}`);
    };

    return (
        <div style={{ 
            fontFamily: "'Inter', sans-serif",
            background: '#f7f4ee',
            color: '#1a1a2e',
            minHeight: '100vh',
            width: '100%',
            display: 'flex'
        }}>
            <style>{`
                /* ── Token system ─────────────────────────────────────────── */
                :root {
                    --navy:       #0d2240;
                    --navy-mid:   #163460;
                    --gold:       #c9952a;
                    --gold-light: #f0d080;
                    --cream:      #f7f4ee;
                    --white:      #ffffff;
                    --text:       #1a1a2e;
                    --muted:      #5a607a;
                    --border:     #ddd8cc;
                    --green:      #2a7a4b;
                    --green-bg:   #e6f4ed;
                    --amber-bg:   #fff4e0;
                    --red-bg:     #fdecea;
                    --red:        #b83232;
                    --radius:     10px;
                    --shadow:     0 2px 12px rgba(13,34,64,.10);
                }

                /* ── Sidebar ─────────────────────────────────────────────── */
                .sidebar {
                    width: 240px;
                    min-height: 100vh;
                    background: var(--navy);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    position: sticky;
                    top: 0;
                }

                .sidebar-brand {
                    padding: 28px 24px 20px;
                    border-bottom: 1px solid rgba(255,255,255,.10);
                }

                .brand-label {
                    font-family: 'Playfair Display', serif;
                    font-size: 13px;
                    letter-spacing: .12em;
                    text-transform: uppercase;
                    color: var(--gold-light);
                    line-height: 1.3;
                }

                .brand-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--white);
                    margin-top: 2px;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 20px 0;
                }

                .nav-section-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: .14em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.35);
                    padding: 12px 24px 6px;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 10px 24px;
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255,255,255,.65);
                    cursor: pointer;
                    transition: background .15s, color .15s;
                    border-left: 3px solid transparent;
                    text-decoration: none;
                    width: 100%;
                    background: none;
                    border-top: none;
                    border-right: none;
                    border-bottom: none;
                    text-align: left;
                }

                .nav-item:hover { background: rgba(255,255,255,.06); color: var(--white); }
                .nav-item.active {
                    background: rgba(201,149,42,.12);
                    color: var(--gold-light);
                    border-left-color: var(--gold);
                }

                .nav-icon { font-size: 16px; width: 20px; text-align: center; }

                .sidebar-footer {
                    padding: 20px 24px;
                    border-top: 1px solid rgba(255,255,255,.10);
                }

                .user-chip {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .user-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: var(--gold);
                    color: var(--navy);
                    font-weight: 700;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .user-info { overflow: hidden; }
                .user-name { font-size: 13px; font-weight: 600; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .user-role { font-size: 11px; color: rgba(255,255,255,.45); }

                .logout-btn {
                    margin-left: auto;
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,.35);
                    cursor: pointer;
                    font-size: 13px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: color .15s;
                }

                .logout-btn:hover { color: var(--gold-light); }

                /* ── Main content ────────────────────────────────────────── */
                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                /* ── Topbar ──────────────────────────────────────────────── */
                .topbar {
                    background: var(--white);
                    border-bottom: 1px solid var(--border);
                    padding: 0 32px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .search-wrap {
                    flex: 1;
                    max-width: 520px;
                    position: relative;
                }

                .search-wrap input {
                    width: 100%;
                    padding: 9px 16px 9px 40px;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    color: var(--text);
                    background: var(--cream);
                    transition: border-color .15s;
                    outline: none;
                }

                .search-wrap input:focus { border-color: var(--navy-mid); background: var(--white); }

                .search-icon {
                    position: absolute;
                    left: 13px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--muted);
                    font-size: 15px;
                }

                .topbar-actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }

                .notif-btn {
                    width: 38px; height: 38px;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    background: none;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 17px;
                    color: var(--muted);
                    position: relative;
                    transition: background .15s;
                }

                .notif-btn:hover { background: var(--cream); }

                .notif-dot {
                    position: absolute;
                    top: 7px; right: 8px;
                    width: 7px; height: 7px;
                    background: var(--gold);
                    border-radius: 50%;
                    border: 1.5px solid var(--white);
                }

                /* ── Page body ───────────────────────────────────────────── */
                .page-body { padding: 32px; flex: 1; }

                .page-header { margin-bottom: 28px; }
                .page-header h1 {
                    font-family: 'Playfair Display', serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: var(--navy);
                    line-height: 1.2;
                }
                .page-header p { font-size: 14px; color: var(--muted); margin-top: 4px; }

                /* ── Stats row ───────────────────────────────────────────── */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    margin-bottom: 28px;
                }

                .stat-card {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    padding: 18px 20px;
                    box-shadow: var(--shadow);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .stat-label { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
                .stat-value { font-size: 28px; font-weight: 700; color: var(--navy); line-height: 1; }
                .stat-sub { font-size: 12px; color: var(--muted); }
                .stat-accent { color: var(--gold); }

                /* ── Grid layout ─────────────────────────────────────────── */
                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 20px;
                }

                /* ── Panel ───────────────────────────────────────────────── */
                .panel {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                    box-shadow: var(--shadow);
                    overflow: hidden;
                }

                .panel-header {
                    padding: 18px 22px 14px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .panel-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--navy);
                }

                .panel-link {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--gold);
                    cursor: pointer;
                    text-decoration: none;
                    background: none;
                    border: none;
                }

                .panel-link:hover { text-decoration: underline; }

                /* ── Filter chips ────────────────────────────────────────── */
                .filter-row {
                    padding: 14px 22px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    border-bottom: 1px solid var(--border);
                }

                .chip {
                    padding: 5px 13px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1.5px solid var(--border);
                    cursor: pointer;
                    background: none;
                    color: var(--muted);
                    transition: all .15s;
                }

                .chip.active { background: var(--navy); color: var(--white); border-color: var(--navy); }
                .chip:not(.active):hover { border-color: var(--navy-mid); color: var(--navy); }

                /* ── Directory list ──────────────────────────────────────── */
                .dir-list { padding: 8px 0; }

                .dir-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 22px;
                    cursor: pointer;
                    transition: background .12s;
                    border-bottom: 1px solid var(--border);
                }

                .dir-item:last-child { border-bottom: none; }
                .dir-item:hover { background: var(--cream); }

                .dir-avatar {
                    width: 44px; height: 44px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 15px;
                    flex-shrink: 0;
                }

                .av-navy  { background: #e0e8f4; color: var(--navy-mid); }
                .av-gold  { background: #f5e8cc; color: #7a5500; }
                .av-green { background: var(--green-bg); color: var(--green); }
                .av-red   { background: var(--red-bg); color: var(--red); }

                .dir-info { flex: 1; min-width: 0; }
                .dir-name { font-size: 14px; font-weight: 600; color: var(--text); }
                .dir-role { font-size: 12px; color: var(--muted); margin-top: 1px; }
                .dir-dept { font-size: 11px; color: var(--muted); margin-top: 2px; }

                .dir-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }

                .avail-badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 9px;
                    border-radius: 20px;
                }

                .avail-on  { background: var(--green-bg); color: var(--green); }
                .avail-off { background: var(--red-bg); color: var(--red); }
                .avail-ltd { background: var(--amber-bg); color: #9a6200; }

                .book-btn {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 4px 11px;
                    border-radius: 6px;
                    background: var(--navy);
                    color: var(--white);
                    border: none;
                    cursor: pointer;
                    transition: background .15s;
                }

                .book-btn:hover { background: var(--navy-mid); }
                .book-btn:disabled { background: #aaa; cursor: not-allowed; }

                /* ── Right column ────────────────────────────────────────── */
                .right-col { display: flex; flex-direction: column; gap: 20px; }

                /* ── Upcoming appointments ───────────────────────────────── */
                .appt-list { padding: 4px 0; }

                .appt-item {
                    display: flex;
                    gap: 14px;
                    padding: 14px 22px;
                    border-bottom: 1px solid var(--border);
                    align-items: flex-start;
                }

                .appt-item:last-child { border-bottom: none; }

                .appt-date-block {
                    width: 42px;
                    text-align: center;
                    flex-shrink: 0;
                }

                .appt-day { font-size: 22px; font-weight: 700; color: var(--navy); line-height: 1; }
                .appt-mon { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--gold); margin-top: 1px; }

                .appt-details { flex: 1; }
                .appt-title { font-size: 13px; font-weight: 600; color: var(--text); }
                .appt-with { font-size: 12px; color: var(--muted); margin-top: 2px; }
                .appt-time { font-size: 11px; color: var(--muted); margin-top: 3px; }

                .appt-status {
                    font-size: 11px; font-weight: 600;
                    padding: 2px 9px; border-radius: 20px;
                }

                .status-confirmed { background: var(--green-bg); color: var(--green); }
                .status-pending   { background: var(--amber-bg); color: #9a6200; }

                /* ── Quick book panel ────────────────────────────────────── */
                .quick-book { padding: 18px 22px; }

                .form-row { margin-bottom: 14px; }
                .form-label { font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 5px; letter-spacing: .04em; }

                .form-input, .form-select {
                    width: 100%;
                    padding: 9px 12px;
                    border: 1.5px solid var(--border);
                    border-radius: 8px;
                    font-family: 'Inter', sans-serif;
                    font-size: 13px;
                    color: var(--text);
                    background: var(--cream);
                    outline: none;
                    transition: border-color .15s;
                }

                .form-input:focus, .form-select:focus { border-color: var(--navy-mid); background: var(--white); }

                .slot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }

                .slot {
                    padding: 7px 4px;
                    text-align: center;
                    border: 1.5px solid var(--border);
                    border-radius: 7px;
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    color: var(--muted);
                    transition: all .13s;
                }

                .slot:hover:not(.unavail) { border-color: var(--navy); color: var(--navy); }
                .slot.selected { background: var(--navy); color: var(--white); border-color: var(--navy); }
                .slot.unavail { background: var(--cream); color: #bbb; cursor: not-allowed; text-decoration: line-through; }

                .btn-primary {
                    width: 100%;
                    padding: 11px;
                    background: var(--gold);
                    color: var(--navy);
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 16px;
                    transition: background .15s;
                    letter-spacing: .01em;
                }

                .btn-primary:hover { background: #b8821e; color: var(--white); }

                /* ── Gold rule divider ───────────────────────────────────── */
                .gold-rule {
                    height: 3px;
                    background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 60%, transparent 100%);
                    border-radius: 2px;
                    margin-bottom: 28px;
                }

                /* ── Responsive ──────────────────────────────────────────── */
                @media (max-width: 1100px) {
                    .stats-row { grid-template-columns: repeat(2, 1fr); }
                    .content-grid { grid-template-columns: 1fr; }
                    .right-col { flex-direction: row; flex-wrap: wrap; }
                    .right-col .panel { flex: 1 1 300px; }
                }

                @media (max-width: 720px) {
                    .sidebar { display: none; }
                    .page-body { padding: 20px 16px; }
                    .topbar { padding: 0 16px; }
                    .stats-row { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>

            {/* ── SIDEBAR ── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-label">Strathmore University</div>
                    <div className="brand-name">SU Directory</div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Main</div>
                    <button 
                        className={`nav-item ${activeMenu === 'Dashboard' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('Dashboard')}
                    >
                        <span className="nav-icon">⊞</span> Dashboard
                    </button>
                    <button 
                        className={`nav-item ${activeMenu === 'Browse Directory' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('Browse Directory')}
                    >
                        <span className="nav-icon">🔍</span> Browse Directory
                    </button>
                    <button 
                        className={`nav-item ${activeMenu === 'My Appointments' ? 'active' : ''}`}
                        onClick={() => handleMenuClick('My Appointments')}
                    >
                        <span className="nav-icon">📅</span> My Appointments
                    </button>

                    <div className="nav-section-label" style={{ marginTop: '12px' }}>People</div>
                    <button 
                        className="nav-item"
                        onClick={() => { setActiveFilter('Lecturers'); setActiveMenu('Browse Directory'); window.location.href = '/directory'; }}
                    >
                        <span className="nav-icon">👨‍🏫</span> Lecturers
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => { setActiveFilter('Mentors'); setActiveMenu('Browse Directory'); window.location.href = '/directory'; }}
                    >
                        <span className="nav-icon">🧑‍💼</span> Mentors
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => { setActiveFilter('Admin Staff'); setActiveMenu('Browse Directory'); window.location.href = '/directory'; }}
                    >
                        <span className="nav-icon">🏢</span> Admin Staff
                    </button>
                    <button 
                        className="nav-item"
                        onClick={() => { setActiveFilter('Student Reps'); setActiveMenu('Browse Directory'); window.location.href = '/directory'; }}
                    >
                        <span className="nav-icon">🎓</span> Student Reps
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-chip">
                        <div className="user-avatar">{getUserInitials()}</div>
                        <div className="user-info">
                            <div className="user-name">{getUserName()}</div>
                            <div className="user-role">{user?.role || 'Student'}</div>
                        </div>
                        {/* ✅ FIXED: Logout button with inline onClick */}
                        <button 
                            className="logout-btn" 
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="main-content">

                {/* Topbar */}
                <header className="topbar">
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by name, department, or role…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="topbar-actions">
                        <button className="notif-btn" title="Notifications">
                            🔔
                            <span className="notif-dot"></span>
                        </button>
                    </div>
                </header>

                {/* Page body */}
                <div className="page-body">

                    <div className="page-header">
                        <h1>{getGreeting()}, {getUserName()} ☀️</h1>
                        <p>{getUserProgram()} · ICS Project I</p>
                    </div>

                    <div className="gold-rule"></div>

                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-label">Directory</span>
                            <span className="stat-value">142</span>
                            <span className="stat-sub">personnel listed</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Upcoming</span>
                            <span className="stat-value stat-accent">2</span>
                            <span className="stat-sub">appointments booked</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Available Now</span>
                            <span className="stat-value">38</span>
                            <span className="stat-sub">staff members</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Departments</span>
                            <span className="stat-value">14</span>
                            <span className="stat-sub">units &amp; faculties</span>
                        </div>
                    </div>

                    {/* Main grid */}
                    <div className="content-grid">

                        {/* Directory panel */}
                        <div className="panel">
                            <div className="panel-header">
                                <span className="panel-title">University Personnel</span>
                                <button className="panel-link">View all →</button>
                            </div>

                            <div className="filter-row">
                                {['All', 'Lecturers', 'Mentors', 'Admin Staff', 'Student Reps'].map((filter) => (
                                    <button
                                        key={filter}
                                        className={`chip ${activeFilter === filter ? 'active' : ''}`}
                                        onClick={() => setActiveFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            <div className="dir-list">
                                {searchedPersonnel.map((person) => (
                                    <div key={person.id} className="dir-item">
                                        <div className={`dir-avatar ${person.avatarClass}`}>
                                            {person.avatar}
                                        </div>
                                        <div className="dir-info">
                                            <div className="dir-name">{person.name}</div>
                                            <div className="dir-role">{person.role}</div>
                                            <div className="dir-dept">{person.department}</div>
                                        </div>
                                        <div className="dir-meta">
                                            <span className={`avail-badge ${person.statusClass}`}>
                                                {person.availability}
                                            </span>
                                            <button 
                                                className="book-btn"
                                                disabled={person.availability === 'Unavailable'}
                                                onClick={() => handleBookAppointment(person.name)}
                                            >
                                                Book
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="right-col">

                            {/* Upcoming appointments */}
                            <div className="panel">
                                <div className="panel-header">
                                    <span className="panel-title">My Appointments</span>
                                    <button className="panel-link">Manage →</button>
                                </div>
                                <div className="appt-list">
                                    <div className="appt-item">
                                        <div className="appt-date-block">
                                            <div className="appt-day">19</div>
                                            <div className="appt-mon">Jun</div>
                                        </div>
                                        <div className="appt-details">
                                            <div className="appt-title">Project Progress Review</div>
                                            <div className="appt-with">Salome Monthe Chemiat</div>
                                            <div className="appt-time">10:00 AM · Rm 4.06, SCES Block</div>
                                        </div>
                                        <span className="appt-status status-confirmed">Confirmed</span>
                                    </div>

                                    <div className="appt-item">
                                        <div className="appt-date-block">
                                            <div className="appt-day">24</div>
                                            <div className="appt-mon">Jun</div>
                                        </div>
                                        <div className="appt-details">
                                            <div className="appt-title">Academic Mentorship</div>
                                            <div className="appt-with">Agnes Wanjiku</div>
                                            <div className="appt-time">2:30 PM · Mentorship Centre</div>
                                        </div>
                                        <span className="appt-status status-pending">Pending</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick book */}
                            <div className="panel">
                                <div className="panel-header">
                                    <span className="panel-title">Quick Book</span>
                                </div>
                                <div className="quick-book">
                                    <div className="form-row">
                                        <label className="form-label">Staff Member</label>
                                        <select className="form-select">
                                            <option value="">Select person…</option>
                                            <option>Salome Monthe Chemiat</option>
                                            <option>Dr. Kevin Otieno</option>
                                            <option>Agnes Wanjiku</option>
                                            <option>Prof. Peter Kamau</option>
                                        </select>
                                    </div>

                                    <div className="form-row">
                                        <label className="form-label">Purpose</label>
                                        <select className="form-select">
                                            <option value="">Select reason…</option>
                                            <option>Academic / Course Query</option>
                                            <option>Project Supervision</option>
                                            <option>Mentorship Session</option>
                                            <option>Administrative Matter</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div className="form-row">
                                        <label className="form-label">Available Slots — Thu 19 Jun</label>
                                        <div className="slot-grid">
                                            {timeSlots.map((slot) => (
                                                <div
                                                    key={slot}
                                                    className={`slot ${unavailableSlots.includes(slot) ? 'unavail' : ''} ${selectedSlot === slot ? 'selected' : ''}`}
                                                    onClick={() => handleSlotClick(slot)}
                                                >
                                                    {slot}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <label className="form-label">Note (optional)</label>
                                        <input type="text" className="form-input" placeholder="Briefly describe what you need…" />
                                    </div>

                                    <button className="btn-primary" onClick={handleQuickBook}>
                                        Request Appointment
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;