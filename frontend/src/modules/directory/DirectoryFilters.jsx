import React from 'react';

const DirectoryFilters = ({
    activeFilter,
    setActiveFilter,
    selectedDepartment,
    setSelectedDepartment,
    availabilityFilter,
    setAvailabilityFilter,
    departments
}) => {
    const categories = ['All', 'Lecturers', 'Mentors', 'Admin Staff', 'Student Reps'];
    const availabilityOptions = ['All', 'Available', 'Limited', 'Unavailable'];

    return (
        <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            boxShadow: '0 2px 12px rgba(13,34,64,.10)',
            border: '1px solid #ddd8cc'
        }}>
            {/* Category Filters */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    color: '#5a607a',
                    marginBottom: '8px'
                }}>
                    Personnel Type
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveFilter(category)}
                            style={{
                                padding: '5px 13px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: '1.5px solid #ddd8cc',
                                cursor: 'pointer',
                                background: activeFilter === category ? '#0d2240' : 'none',
                                color: activeFilter === category ? 'white' : '#5a607a',
                                transition: 'all .15s'
                            }}
                            onMouseEnter={(e) => {
                                if (activeFilter !== category) {
                                    e.target.style.borderColor = '#163460';
                                    e.target.style.color = '#0d2240';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeFilter !== category) {
                                    e.target.style.borderColor = '#ddd8cc';
                                    e.target.style.color = '#5a607a';
                                }
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                paddingTop: '12px',
                borderTop: '1px solid #eee9e0'
            }}>
                {/* Department Filter */}
                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                        color: '#5a607a',
                        marginBottom: '6px'
                    }}>
                        Department
                    </div>
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            border: '1.5px solid #ddd8cc',
                            borderRadius: '8px',
                            fontSize: '12px',
                            background: '#f7f4ee',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Availability Filter */}
                <div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                        color: '#5a607a',
                        marginBottom: '6px'
                    }}>
                        Availability
                    </div>
                    <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            border: '1.5px solid #ddd8cc',
                            borderRadius: '8px',
                            fontSize: '12px',
                            background: '#f7f4ee',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '120px'
                        }}
                    >
                        {availabilityOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default DirectoryFilters;