import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const StaffProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sample data - will be replaced with API call
    const personnelData = [
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
            biography: 'Dr. Salome Monthe Chemiat is a senior lecturer at the School of Computing and Engineering Sciences. She specializes in project management and software engineering, with over 10 years of teaching experience. She has supervised numerous undergraduate and postgraduate projects.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'SM',
            avatarClass: 'av-navy',
            officeHours: 'Monday - Friday: 9:00 AM - 4:00 PM',
            consultationHours: 'Tuesday & Thursday: 2:00 PM - 4:00 PM'
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
            biography: 'Dr. Kevin Otieno is a senior lecturer specializing in Artificial Intelligence and Machine Learning. He has published numerous research papers in international journals. He leads the AI Research Lab at Strathmore University.',
            availability: 'Limited',
            statusClass: 'avail-ltd',
            avatar: 'KO',
            avatarClass: 'av-gold',
            officeHours: 'Monday - Friday: 10:00 AM - 5:00 PM',
            consultationHours: 'Wednesday: 3:00 PM - 5:00 PM'
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
            biography: 'Agnes Wanjiku is a dedicated student mentor with over 5 years of experience in student welfare and career development. She provides guidance to students on academic and personal matters.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'AW',
            avatarClass: 'av-green',
            officeHours: 'Monday - Friday: 8:00 AM - 5:00 PM',
            consultationHours: 'Monday & Wednesday: 10:00 AM - 12:00 PM'
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
            biography: 'Robert Mwangi serves as the Registrar for Academic Affairs. He manages student records and academic policies. He has over 15 years of experience in higher education administration.',
            availability: 'Unavailable',
            statusClass: 'avail-off',
            avatar: 'RM',
            avatarClass: 'av-navy',
            officeHours: 'Monday - Friday: 8:00 AM - 6:00 PM',
            consultationHours: 'By appointment only'
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
            biography: 'Faith Mutua is the Year 3 ICS Student Representative. She advocates for student rights and coordinates student events. She is passionate about improving the student experience.',
            availability: 'Available',
            statusClass: 'avail-on',
            avatar: 'FM',
            avatarClass: 'av-red',
            officeHours: 'Monday - Friday: 9:00 AM - 4:00 PM',
            consultationHours: 'Friday: 11:00 AM - 1:00 PM'
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
            biography: 'Prof. Peter Kamau is an Associate Professor in Data Science and AI. He leads several research projects in big data analytics. He has published over 30 papers in top-tier journals.',
            availability: 'Limited',
            statusClass: 'avail-ltd',
            avatar: 'PK',
            avatarClass: 'av-gold',
            officeHours: 'Monday - Friday: 9:00 AM - 6:00 PM',
            consultationHours: 'Tuesday & Thursday: 2:00 PM - 4:00 PM'
        }
    ];

    useEffect(() => {
        // Find staff member by id
        const foundStaff = personnelData.find(p => p.id === parseInt(id));
        if (foundStaff) {
            setStaff(foundStaff);
            setLoading(false);
        } else {
            setError('Staff member not found');
            setLoading(false);
        }
    }, [id]);

    const handleBookAppointment = () => {
        alert(`Booking appointment with ${staff.title} ${staff.name}`);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
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
        );
    }

    if (error) {
        return (
            <div style={{
                background: '#fdecea',
                color: '#b83232',
                padding: '40px',
                borderRadius: '10px',
                textAlign: 'center'
            }}>
                ❌ {error}
                <br />
                <button
                    onClick={() => navigate('/directory')}
                    style={{
                        marginTop: '16px',
                        padding: '10px 24px',
                        background: '#0d2240',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    Back to Directory
                </button>
            </div>
        );
    }

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif",
            background: '#f7f4ee',
            color: '#1a1a2e',
            minHeight: '100vh',
            padding: '32px'
        }}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/directory')}
                style={{
                    background: 'none',
                    border: 'none',
                    color: '#5a607a',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                ← Back to Directory
            </button>

            {/* Profile Card */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(13,34,64,.10)',
                border: '1px solid #ddd8cc',
                overflow: 'hidden',
                maxWidth: '800px'
            }}>
                {/* Header */}
                <div style={{
                    background: '#0d2240',
                    padding: '24px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '28px',
                        background: ['#e0e8f4', '#f5e8cc', '#e6f4ed', '#fdecea'][staff.id % 4],
                        color: ['#163460', '#7a5500', '#2a7a4b', '#b83232'][staff.id % 4]
                    }}>
                        {staff.avatar || staff.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 700,
                            fontFamily: "'Playfair Display', serif"
                        }}>
                            {staff.title} {staff.name}
                        </h1>
                        <p style={{ color: '#f0d080', fontSize: '14px' }}>{staff.role}</p>
                        <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px' }}>
                            {staff.department}
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            padding: '4px 14px',
                            borderRadius: '20px',
                            background: staff.availability === 'Available' ? '#e6f4ed' :
                                      staff.availability === 'Limited' ? '#fff4e0' : '#fdecea',
                            color: staff.availability === 'Available' ? '#2a7a4b' :
                                   staff.availability === 'Limited' ? '#9a6200' : '#b83232'
                        }}>
                            {staff.availability}
                        </span>
                        <button
                            onClick={handleBookAppointment}
                            style={{
                                marginTop: '8px',
                                padding: '8px 20px',
                                background: '#c9952a',
                                color: '#0d2240',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background .15s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#b8821e'}
                            onMouseLeave={(e) => e.target.style.background = '#c9952a'}
                        >
                            📅 Book Appointment
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '24px 32px' }}>
                    {/* Contact Info */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Email
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.email}</p>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Phone
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.phone}</p>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Office
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.office}</p>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Department
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.department}</p>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #ddd8cc', marginBottom: '20px' }} />

                    {/* Specialization */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
                            Areas of Specialization
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {staff.specialization.map((spec, index) => (
                                <span key={index} style={{
                                    background: '#f0f0ee',
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    color: '#0d2240'
                                }}>
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Biography */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
                            Biography
                        </div>
                        <p style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: '1.6' }}>
                            {staff.biography}
                        </p>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #ddd8cc', marginBottom: '20px' }} />

                    {/* Office & Consultation Hours */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Office Hours
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.officeHours}</p>
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: '#5a607a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                Consultation Hours
                            </div>
                            <p style={{ fontSize: '14px', color: '#0d2240' }}>{staff.consultationHours}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffProfile;