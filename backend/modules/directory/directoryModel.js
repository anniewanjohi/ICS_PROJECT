// modules/directory/directoryModel.js
const { getPool, sql } = require('../../config/database');

const DirectoryModel = {

    search: async ({ query = '', staffType = '', departmentId = '', faculty = '', page = 1, limit = 12 }) => {
        const pool = getPool();
        const offset = (page - 1) * limit;

        let staffQuery = `
            SELECT 
                sp.staff_id AS id,
                sp.first_name,
                sp.last_name,
                sp.staff_type,
                sp.is_mentor,
                sp.phone_extension,
                sp.title,
                sp.position,
                sp.office_location,
                sp.official_email,
                sp.profile_picture_url,
                sp.is_available_for_booking,
                sp.faculty,
                u.email,
                u.is_active,
                'staff' AS source_type,
                NULL AS rep_role,
                NULL AS program,
                NULL AS year_of_study,
                NULL AS department_name,
                NULL AS student_id,
                d.department_name AS dept_name,
                d.department_id,
                d.faculty_code,
                (SELECT COUNT(*) FROM availability_slots av 
                 WHERE av.staff_id = sp.staff_id AND av.is_available = 1) AS available_slots_count
            FROM dbo.staff_profiles sp
            INNER JOIN dbo.users u ON sp.user_id = u.user_id
            LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
            WHERE u.is_active = 1
        `;

        let repQuery = `
            SELECT 
                s.student_id AS id,
                s.first_name,
                s.last_name,
                NULL AS staff_type,
                0 AS is_mentor,
                s.phone_number AS phone_extension,
                NULL AS title,
                s.rep_role AS position,
                NULL AS office_location,
                u.email AS official_email,
                s.profile_picture_url,
                1 AS is_available_for_booking,
                s.faculty,
                u.email,
                u.is_active,
                'student_rep' AS source_type,
                s.rep_role,
                s.program,
                s.year_of_study,
                s.department AS department_name,
                s.student_id,
                NULL AS dept_name,
                NULL AS department_id,
                NULL AS faculty_code,
                0 AS available_slots_count
            FROM dbo.students s
            INNER JOIN dbo.users u ON s.user_id = u.user_id
            WHERE u.is_active = 1 AND s.is_student_rep = 1
        `;

        let staffWhere = [];
        let repWhere = [];
        let showStaff = true;
        let showReps = true;

        if (query) {
            const searchPattern = `%${query}%`;
            staffWhere.push(`
                (sp.first_name LIKE @query OR 
                 sp.last_name LIKE @query OR 
                 sp.title LIKE @query OR 
                 sp.position LIKE @query OR 
                 sp.official_email LIKE @query OR
                 u.email LIKE @query OR
                 d.department_name LIKE @query OR
                 d.faculty LIKE @query OR
                 d.faculty_code LIKE @query OR
                 sp.faculty LIKE @query OR
                 sp.office_location LIKE @query OR
                 sp.areas_of_specialization LIKE @query)
            `);
            repWhere.push(`
                (s.first_name LIKE @query OR 
                 s.last_name LIKE @query OR 
                 s.rep_role LIKE @query OR 
                 s.program LIKE @query OR 
                 s.department LIKE @query OR
                 s.faculty LIKE @query OR
                 u.email LIKE @query)
            `);
        }

        if (faculty) {
            staffWhere.push(`(d.faculty_code = @faculty OR sp.faculty = @faculty)`);
            repWhere.push(`s.faculty = @faculty`);
        }

        if (staffType) {
            if (staffType === 'student_representative') {
                showStaff = false;
                showReps = true;
            } else if (staffType === 'mentor') {
                staffWhere.push(`sp.is_mentor = 1`);
                showReps = false;
                showStaff = true;
            } else if (staffType === 'lecturer') {
                staffWhere.push(`sp.staff_type = 'lecturer'`);
                showReps = false;
                showStaff = true;
            } else if (staffType === 'administrative' || staffType === 'admin_staff') {
                staffWhere.push(`sp.staff_type = 'administrative' OR sp.staff_type = 'administrator'`);
                showReps = false;
                showStaff = true;
            } else {
                staffWhere.push(`sp.staff_type = @staffType`);
                showReps = false;
                showStaff = true;
            }
        }

        if (departmentId && showStaff) {
            staffWhere.push(`sp.department_id = @departmentId`);
        }

        if (staffWhere.length > 0 && showStaff) {
            staffQuery += ` AND ${staffWhere.join(' AND ')}`;
        }

        if (repWhere.length > 0 && showReps) {
            repQuery += ` AND ${repWhere.join(' AND ')}`;
        }

        let finalQuery = '';
        if (showStaff && showReps) {
            finalQuery = `(${staffQuery}) UNION ALL (${repQuery})`;
        } else if (showStaff) {
            finalQuery = `(${staffQuery})`;
        } else if (showReps) {
            finalQuery = `(${repQuery})`;
        } else {
            return { staff: [], total: 0, page, limit, totalPages: 0 };
        }

        try {
            const request = pool.request();
            if (query) {
                request.input('query', sql.VarChar, `%${query}%`);
            }
            if (faculty) {
                request.input('faculty', sql.VarChar, faculty);
            }
            if (staffType && staffType !== 'student_representative' && staffType !== 'mentor' && staffType !== 'lecturer' && staffType !== 'administrative' && staffType !== 'admin_staff') {
                request.input('staffType', sql.VarChar, staffType);
            }
            if (departmentId) {
                request.input('departmentId', sql.Int, parseInt(departmentId));
            }
            request.input('limit', sql.Int, limit);
            request.input('offset', sql.Int, offset);

            const result = await request.query(`
                SELECT * FROM (${finalQuery}) AS combined
                ORDER BY last_name ASC, first_name ASC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

            let countQuery = `SELECT COUNT(*) AS total FROM (${finalQuery}) AS combined`;
            if (query) {
                countQuery = countQuery.replace(/@query/g, `'%${query}%'`);
            }
            if (faculty) {
                countQuery = countQuery.replace(/@faculty/g, `'${faculty}'`);
            }
            if (departmentId) {
                countQuery = countQuery.replace(/@departmentId/g, `${parseInt(departmentId)}`);
            }

            const countResult = await pool.request().query(countQuery);
            const total = countResult.recordset[0]?.total || 0;

            return {
                staff: result.recordset,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1
            };

        } catch (error) {
            console.error('Query error:', error);
            return {
                staff: [],
                total: 0,
                page,
                limit,
                totalPages: 1,
                error: error.message
            };
        }
    },

    getProfile: async (staffId, requesterRole = 'student') => {
        const pool = getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .query(`
                SELECT 
                    sp.staff_id, 
                    sp.first_name, 
                    sp.last_name, 
                    sp.title,
                    sp.position, 
                    sp.staff_type, 
                    sp.is_mentor,
                    sp.office_location, 
                    sp.office_hours, 
                    sp.official_email,
                    sp.areas_of_specialization, 
                    sp.biography,
                    sp.profile_picture_url, 
                    sp.is_available_for_booking,
                    sp.phone_extension,
                    sp.faculty,
                    u.email,
                    d.department_name,
                    d.faculty,
                    d.faculty_code,
                    d.department_id
                FROM dbo.staff_profiles sp
                INNER JOIN dbo.users u ON sp.user_id = u.user_id
                LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                WHERE sp.staff_id = @staff_id AND u.is_active = 1
            `);

        return result.recordset[0] || null;
    },

    getStudentRepProfile: async (studentId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('student_id', sql.Int, studentId)
            .query(`
                SELECT s.*, u.email
                FROM dbo.students s
                INNER JOIN dbo.users u ON s.user_id = u.user_id
                WHERE s.student_id = @student_id AND s.is_student_rep = 1
            `);
        return result.recordset[0] || null;
    },

    getDepartments: async () => {
        const pool = getPool();
        try {
            const result = await pool.request()
                .query(`SELECT department_id, department_name, department_code, faculty, faculty_code FROM dbo.departments ORDER BY faculty ASC, department_name ASC`);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching departments:', error);
            return [];
        }
    },

    getFaculties: async () => {
        const pool = getPool();
        try {
            const result = await pool.request()
                .query(`SELECT DISTINCT faculty_code, faculty FROM dbo.departments WHERE faculty_code IS NOT NULL ORDER BY faculty ASC`);
            return result.recordset;
        } catch (error) {
            console.error('Error fetching faculties:', error);
            return [];
        }
    },

    getFilters: async () => {
        const pool = getPool();
        try {
            const staffTypes = await pool.request()
                .query(`
                    SELECT DISTINCT staff_type 
                    FROM dbo.staff_profiles 
                    WHERE staff_type IS NOT NULL AND staff_type != ''
                    ORDER BY staff_type
                `);

            const departments = await pool.request()
                .query(`
                    SELECT department_id, department_name, faculty, faculty_code 
                    FROM dbo.departments 
                    ORDER BY faculty, department_name
                `);

            const faculties = await pool.request()
                .query(`
                    SELECT DISTINCT faculty_code, faculty 
                    FROM dbo.departments 
                    WHERE faculty_code IS NOT NULL
                    ORDER BY faculty
                `);

            return {
                staffTypes: staffTypes.recordset.map(s => s.staff_type),
                departments: departments.recordset,
                faculties: faculties.recordset
            };
        } catch (error) {
            console.error('Error fetching filters:', error);
            return { staffTypes: [], departments: [], faculties: [] };
        }
    }
};

module.exports = DirectoryModel;