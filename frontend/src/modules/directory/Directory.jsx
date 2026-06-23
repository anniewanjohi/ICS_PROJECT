import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffCard from './StaffCard';
import DirectoryFilters from './DirectoryFilters';

const Directory = ({ user }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [availabilityFilter, setAvailabilityFilter] = useState('All');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sample personnel data (will be replaced with API call)
    const [personnel, setPersonnel] = useState([
        {
            id: 1,
            name: 'Salome Monthe Chemiat',
            title: 'Dr.',
            role: 'Lecturer · Project Supervisor',
            department: 'School of Computing & Engineering Sciences',
            departmentCode: 'SCES',
            email: 'salome.chemiat@strathmore.edu',
            phone: '+254 712 345 678',
            office: 'Room 4.06, SCES Block',
            specialization: ['Project Management', 'Software Engineering', 'Informatics'],
            biography: 'Dr. Salome Monthe Chemiat is a senior lecturer at the School of Computing and Engineering Sciences. She specializes in project management and software engineering, with over 10 years of teaching experience.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'SM',
            avatarClass: 'av-navy'
        },
        {
            id: 2,
            name: 'Kevin Otieno',
            title: 'Dr.',
            role: 'Senior Lecturer',
            department: 'Dept. of Informatics & Computer Science',
            departmentCode: 'ICS',
            email: 'kevin.otieno@strathmore.edu',
            phone: '+254 723 456 789',
            office: 'Room 3.12, ICS Block',
            specialization: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
            biography: 'Dr. Kevin Otieno is a senior lecturer specializing in Artificial Intelligence and Machine Learning. He has published numerous research papers in international journals.',
            availability: 'Limited',
            statusClass: 'avail-ltd',
            avatar: 'KO',
            avatarClass: 'av-gold'
        },
        {
            id: 3,
            name: 'Agnes Wanjiku',
            title: 'Ms.',
            role: 'Student Mentor',
            department: 'Student Welfare & Mentorship Office',
            departmentCode: 'SWM',
            email: 'agnes.wanjiku@strathmore.edu',
            phone: '+254 734 567 890',
            office: 'Room 2.08, Mentorship Centre',
            specialization: ['Academic Advising', 'Career Development', 'Student Welfare'],
            biography: 'Agnes Wanjiku is a dedicated student mentor with over 5 years of experience in student welfare and career development.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'AW',
            avatarClass: 'av-green'
        },
        {
            id: 4,
            name: 'Robert Mwangi',
            title: 'Mr.',
            role: 'Registrar · Academic Affairs',
            department: 'Office of the Registrar',
            departmentCode: 'REG',
            email: 'robert.mwangi@strathmore.edu',
            phone: '+254 745 678 901',
            office: 'Room 1.03, Administration Block',
            specialization: ['Academic Administration', 'Student Records', 'Policy Management'],
            biography: 'Robert Mwangi serves as the Registrar for Academic Affairs. He manages student records and academic policies.',
            availability: 'Unavailable',
            statusClass: 'avail-off',
            avatar: 'RM',
            avatarClass: 'av-navy'
        },
        {
            id: 5,
            name: 'Faith Mutua',
            title: 'Ms.',
            role: 'ICS Student Representative',
            department: 'Student Government · Year 3',
            departmentCode: 'SG',
            email: 'faith.mutua@strathmore.edu',
            phone: '+254 756 789 012',
            office: 'Student Centre, Room 0.15',
            specialization: ['Student Advocacy', 'Peer Support', 'Event Coordination'],
            biography: 'Faith Mutua is the Year 3 ICS Student Representative. She advocates for student rights and coordinates student events.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'FM',
            avatarClass: 'av-red'
        },
        {
            id: 6,
            name: 'Peter Kamau',
            title: 'Prof.',
            role: 'Associate Professor',
            department: 'Dept. of Data Science & AI',
            departmentCode: 'DSAI',
            email: 'peter.kamau@strathmore.edu',
            phone: '+254 767 890 123',
            office: 'Room 5.02, DSAI Block',
            specialization: ['Data Science', 'Big Data', 'Cloud Computing'],
            biography: 'Prof. Peter Kamau is an Associate Professor in Data Science and AI. He leads several research projects in big data analytics.',
            availability: 'Limited',
            statusClass: 'avail-ltd',
            avatar: 'PK',
            avatarClass: 'av-gold'
        }
    ]);

    // Get unique departments for filter
    const departments = ['All', ...new Set(personnel.map(p => p.department))];

    // Filter personnel based on all criteria
    const filteredPersonnel = personnel.filter(person => {
        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            person.name.toLowerCase().includes(query) ||
            person.role.toLowerCase().includes(query) ||
            person.department.toLowerCase().includes(query) ||
            person.specialization?.some(s => s.toLowerCase().includes(query));

        // Category filter
        let matchesCategory = true;
        if (activeFilter !== 'All') {
            if (activeFilter === 'Lecturers') {
                matchesCategory = person.role.includes('Lecturer') || person.role.includes('Professor');
            } else if (activeFilter === 'Mentors') {
                matchesCategory = person.role.includes('Mentor');
            } else if (activeFilter === 'Admin Staff') {
                matchesCategory = person.role.includes('Registrar') || person.role.includes('Administrative');
            } else if (activeFilter === 'Student Reps') {
                matchesCategory = person.role.includes('Student Representative');
            }
        }

        // Department filter
        const matchesDepartment = selectedDepartment === 'All' || person.department === selectedDepartment;

        // Availability filter
        let matchesAvailability = true;
        if (availabilityFilter === 'Available') {
            matchesAvailability = person.availability === 'Available';
        } else if (availabilityFilter === 'Limited') {
            matchesAvailability = person.availability === 'Limited';
        } else if (availabilityFilter === 'Unavailable') {
            matchesAvailability = person.availability === 'Unavailable';
        }

        return matchesSearch && matchesCategory && matchesDepartment && matchesAvailability;
    });

    const handleViewProfile = (personId) => {
        navigate(`/directory/${personId}`);
    };

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            background: '#f7f4ee',
            color: '#1a1a2e',
            minHeight: '100vh',
            padding: '32px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '26px',
                    fontWeight: 700,
                    color: '#0d2240'
                }}>
                    Staff Directory
                </h1>
                <p style={{ fontSize: '14px', color: '#5a607a' }}>
                    Find and connect with university personnel
                </p>
            </div>

            {/* Search Bar */}
            <div style={{
                background: 'white',
                borderRadius: '10px',
                padding: '20px',
                marginBottom: '24px',
                boxShadow: '0 2px 12px rgba(13,34,64,.10)',
                border: '1px solid #ddd8cc'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                        <span style={{
                            position: 'absolute',
                            left: '13px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#5a607a',
                            fontSize: '15px'
                        }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name, department, role, or specialization..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '11px 16px 11px 40px',
                                border: '1.5px solid #ddd8cc',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#1a1a2e',
                                background: '#f7f4ee',
                                outline: 'none',
                                transition: 'border-color .15s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#163460'}
                            onBlur={(e) => e.target.style.borderColor = '#ddd8cc'}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#5a607a',
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: '4px'
                        }}>
                            Results: {filteredPersonnel.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <DirectoryFilters
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                selectedDepartment={selectedDepartment}
                setSelectedDepartment={setSelectedDepartment}
                availabilityFilter={availabilityFilter}
                setAvailabilityFilter={setAvailabilityFilter}
                departments={departments}
            />

            {/* Personnel List */}
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '60px 0'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #c9952a',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            ) : error ? (
                <div style={{
                    background: '#fdecea',
                    color: '#b83232',
                    padding: '20px',
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    ❌ {error}
                </div>
            ) : filteredPersonnel.length === 0 ? (
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '1px solid #ddd8cc'
                }}>
                    <p style={{ fontSize: '18px', color: '#5a607a' }}>😕 No staff members found</p>
                    <p style={{ fontSize: '14px', color: '#5a607a', marginTop: '8px' }}>
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #ddd8cc',
                    boxShadow: '0 2px 12px rgba(13,34,64,.10)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #ddd8cc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#faf8f5'
                    }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#0d2240' }}>
                            {filteredPersonnel.length} {filteredPersonnel.length === 1 ? 'Person' : 'People'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#5a607a' }}>
                            Showing {filteredPersonnel.length} of {personnel.length}
                        </span>
                    </div>

                    {filteredPersonnel.map((person) => (
                        <StaffCard
                            key={person.id}
                            person={person}
                            onViewProfile={handleViewProfile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Directory;