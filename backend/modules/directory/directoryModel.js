// modules/directory/directoryModel.js
const { getPool, sql } = require('../../config/database');

const DirectoryModel = {

    // Search staff AND student reps
    search: async ({ query = '', staffType = '', departmentId = '', page = 1, limit = 12 }) => {
        const pool = getPool();
        const offset = (page - 1) * limit;

        // We search two sources: staff_profiles and students (who are reps)
        // and UNION them together

        const request = pool.request();
        request.input('limit', sql.Int, limit);
        request.input('offset', sql.Int, offset);

        let staffWhere = `WHERE sp.is_available_for_booking = 1 AND u.is_active = 1`;
        let repWhere = `WHERE s.is_student_rep = 1 AND u.is_active = 1`;

        if (query) {
            staffWhere += ` AND (
                sp.first_name LIKE @query OR sp.last_name LIKE @query OR
                sp.title LIKE @query OR sp.position LIKE @query OR
                sp.areas_of_specialization LIKE @query OR d.department_name LIKE @query
            )`;
            repWhere += ` AND (
                s.first_name LIKE @query OR s.last_name LIKE @query OR
                s.rep_role LIKE @query OR s.program LIKE @query
            )`;
            request.input('query', sql.VarChar, `%${query}%`);
        }

        // If filtering by student_representative, only show reps
        // If filtering by mentor, only show staff with is_mentor=1
        // Otherwise show staff filtered by type

        let staffTypeFilter = '';
        let showReps = true;
        let showStaff = true;

        if (staffType === 'student_representative') {
            showStaff = false;
        } else if (staffType === 'mentor') {
            staffWhere += ` AND sp.is_mentor = 1`;
            showReps = false;
        } else if (staffType) {
            staffWhere += ` AND sp.staff_type = @staffType`;
            request.input('staffType', sql.VarChar, staffType);
            showReps = false;
        }

        if (departmentId && showStaff) {
            staffWhere += ` AND sp.department_id = @departmentId`;
            request.input('departmentId', sql.Int, parseInt(departmentId));
        }

        // Build the combined query
        let parts = [];

        if (showStaff) {
            parts.push(`
                SELECT 
                    sp.staff_id AS id,
                    sp.first_name,
                    sp.last_name,
                    sp.title,
                    sp.position,
                    sp.staff_type,
                    sp.is_mentor,
                    sp.office_location,
                    sp.official_email,
                    sp.areas_of_specialization,
                    sp.profile_picture_url,
                    sp.is_available_for_booking,
                    d.department_name,
                    d.faculty,
                    'staff' AS source_type,
                    NULL AS rep_role,
                    NULL AS program,
                    NULL AS year_of_study,
                    (SELECT COUNT(*) FROM availability_slots av 
                     WHERE av.staff_id = sp.staff_id AND av.is_available = 1) AS available_slots_count
                FROM dbo.staff_profiles sp
                LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                INNER JOIN dbo.users u ON sp.user_id = u.user_id
                ${staffWhere}
            `);
        }

        if (showReps) {
            parts.push(`
                SELECT 
                    s.student_id AS id,
                    s.first_name,
                    s.last_name,
                    NULL AS title,
                    s.rep_role AS position,
                    'student_representative' AS staff_type,
                    0 AS is_mentor,
                    NULL AS office_location,
                    u.email AS official_email,
                    s.rep_role AS areas_of_specialization,
                    s.profile_picture_url,
                    1 AS is_available_for_booking,
                    s.department AS department_name,
                    NULL AS faculty,
                    'student_rep' AS source_type,
                    s.rep_role,
                    s.program,
                    s.year_of_study,
                    0 AS available_slots_count
                FROM dbo.students s
                INNER JOIN dbo.users u ON s.user_id = u.user_id
                ${repWhere}
            `);
        }

        if (parts.length === 0) {
            return { staff: [], total: 0, page, limit, totalPages: 0 };
        }

        const combinedQuery = parts.join(' UNION ALL ');

        const result = await request.query(`
            SELECT * FROM (${combinedQuery}) AS combined
            ORDER BY last_name ASC, first_name ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        const countResult = await pool.request()
            .input('query', sql.VarChar, query ? `%${query}%` : '%')
            .query(`SELECT COUNT(*) AS total FROM (${combinedQuery.replace(/@query/g, '@query').replace(/@staffType/g, `'${staffType}'`).replace(/@departmentId/g, departmentId || 'NULL')}) AS combined`);

        // Safe count fallback
        let total = result.recordset.length;
        try { total = countResult.recordset[0].total; } catch {}

        return {
            staff: result.recordset,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    },

    getProfile: async (staffId, requesterRole = 'student') => {
        const pool = getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .query(`
                SELECT 
                    sp.staff_id, sp.first_name, sp.last_name, sp.title,
                    sp.position, sp.staff_type, sp.is_mentor,
                    sp.office_location, sp.office_hours, sp.official_email,
                    sp.areas_of_specialization, sp.biography,
                    sp.profile_picture_url, sp.is_available_for_booking,
                    d.department_name, d.faculty, d.office_location AS department_office
                FROM dbo.staff_profiles sp
                LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                INNER JOIN dbo.users u ON sp.user_id = u.user_id
                WHERE sp.staff_id = @staff_id AND u.is_active = 1
            `);

        const profile = result.recordset[0] || null;
        if (!profile) return null;

        // Phone only visible to admin/staff
        if (requesterRole === 'admin' || requesterRole === 'staff') {
            const phoneResult = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('SELECT phone_extension FROM dbo.staff_profiles WHERE staff_id = @staff_id');
            if (phoneResult.recordset[0]) {
                profile.phone_extension = phoneResult.recordset[0].phone_extension;
            }
        }

        return profile;
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
        const result = await pool.request()
            .query(`SELECT department_id, department_name, department_code, faculty FROM dbo.departments ORDER BY faculty ASC, department_name ASC`);
        return result.recordset;
    }
};

module.exports = DirectoryModel;
