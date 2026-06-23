import React from 'react';

const StaffCard = ({ person, onViewProfile }) => {
    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2);
    };

    const getAvatarClass = (person) => {
        if (person.avatarClass) return person.avatarClass;
        const classes = ['av-navy', 'av-gold', 'av-green', 'av-red'];
        return classes[person.id % classes.length];
    };

    return (
        <div
            className="staff-card"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 22px',
                cursor: 'pointer',
                transition: 'background .12s',
                borderBottom: '1px solid #ddd8cc'
            }}
            onClick={() => onViewProfile(person.id)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f7f4ee'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <div
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '15px',
                    flexShrink: 0,
                    background: ['#e0e8f4', '#f5e8cc', '#e6f4ed', '#fdecea'][person.id % 4],
                    color: ['#163460', '#7a5500', '#2a7a4b', '#b83232'][person.id % 4]
                }}
            >
                {person.avatar || getInitials(person.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
                    {person.title ? `${person.title} ` : ''}{person.name}
                </div>
                <div style={{ fontSize: '12px', color: '#5a607a', marginTop: '1px' }}>
                    {person.role}
                </div>
                <div style={{ fontSize: '11px', color: '#5a607a', marginTop: '2px' }}>
                    {person.department}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 9px',
                        borderRadius: '20px',
                        background: person.availability === 'Available' ? '#e6f4ed' :
                                  person.availability === 'Limited' ? '#fff4e0' : '#fdecea',
                        color: person.availability === 'Available' ? '#2a7a4b' :
                               person.availability === 'Limited' ? '#9a6200' : '#b83232'
                    }}
                >
                    {person.availability}
                </span>
                <button
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 11px',
                        borderRadius: '6px',
                        background: person.availability === 'Unavailable' ? '#aaa' : '#0d2240',
                        color: 'white',
                        border: 'none',
                        cursor: person.availability === 'Unavailable' ? 'not-allowed' : 'pointer',
                        transition: 'background .15s'
                    }}
                    disabled={person.availability === 'Unavailable'}
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile(person.id);
                    }}
                >
                    View Profile
                </button>
            </div>
        </div>
    );
};

export default StaffCard;