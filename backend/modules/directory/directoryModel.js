// modules/directory/directoryModel.js
const { getPool, sql } = require('../../config/database');

const DirectoryModel = {

    // Search staff by name, department, role, or specialization
    // Phone number is deliberately excluded from all results
    search: async ({ query = '', staffType = '', departmentId = '', page = 1, limit = 12 }) => {
        const pool = getPool();
        const offset = (page - 1) * limit;

        let whereClause = `WHERE sp.is_available_for_booking = 1 AND u.is_active = 1`;
        const request = pool.request();

        if (query) {
            whereClause += ` AND (
                sp.first_name LIKE @query OR
                sp.last_name LIKE @query OR
                sp.title LIKE @query OR
                sp.position LIKE @query OR
                sp.areas_of_specialization LIKE @query OR
                d.department_name LIKE @query
            )`;
            request.input('query', sql.VarChar, `%${query}%`);
        }

        if (staffType) {
            whereClause += ` AND sp.staff_type = @staffType`;
            request.input('staffType', sql.VarChar, staffType);
        }

        if (departmentId) {
            whereClause += ` AND sp.department_id = @departmentId`;
            request.input('departmentId', sql.Int, parseInt(departmentId));
        }

        request.input('limit', sql.Int, limit);
        request.input('offset', sql.Int, offset);

        const result = await request.query(`
            SELECT 
                sp.staff_id,
                sp.first_name,
                sp.last_name,
                sp.title,
                sp.position,
                sp.staff_type,
                sp.office_location,
                sp.official_email,
                sp.areas_of_specialization,
                sp.profile_picture_url,
                sp.is_available_for_booking,
                d.department_name,
                d.faculty,
                -- No phone_number or phone_extension here
                (SELECT COUNT(*) FROM availability_slots av 
                 WHERE av.staff_id = sp.staff_id AND av.is_available = 1) AS available_slots_count
            FROM staff_profiles sp
            LEFT JOIN departments d ON sp.department_id = d.department_id
            INNER JOIN users u ON sp.user_id = u.user_id
            ${whereClause}
            ORDER BY sp.last_name ASC, sp.first_name ASC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        // Get total count for pagination
        const countRequest = pool.request();
        if (query) countRequest.input('query', sql.VarChar, `%${query}%`);
        if (staffType) countRequest.input('staffType', sql.VarChar, staffType);
        if (departmentId) countRequest.input('departmentId', sql.Int, parseInt(departmentId));

        const countResult = await countRequest.query(`
            SELECT COUNT(*) AS total
            FROM staff_profiles sp
            LEFT JOIN departments d ON sp.department_id = d.department_id
            INNER JOIN users u ON sp.user_id = u.user_id
            ${whereClause}
        `);

        return {
            staff: result.recordset,
            total: countResult.recordset[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult.recordset[0].total / limit)
        };
    },

    // Get full staff profile by staff_id
    // Phone excluded for students; phone visible if requester is admin/staff
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
                    sp.office_location,
                    sp.office_hours,
                    sp.official_email,
                    sp.areas_of_specialization,
                    sp.biography,
                    sp.profile_picture_url,
                    sp.is_available_for_booking,
                    d.department_name,
                    d.faculty,
                    d.office_location AS department_office
                FROM staff_profiles sp
                LEFT JOIN departments d ON sp.department_id = d.department_id
                INNER JOIN users u ON sp.user_id = u.user_id
                WHERE sp.staff_id = @staff_id AND u.is_active = 1
            `);

        const profile = result.recordset[0] || null;
        if (!profile) return null;

        // Only admins and other staff can see phone extension
        if (requesterRole === 'admin' || requesterRole === 'staff') {
            const phoneResult = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('SELECT phone_extension FROM staff_profiles WHERE staff_id = @staff_id');
            if (phoneResult.recordset[0]) {
                profile.phone_extension = phoneResult.recordset[0].phone_extension;
            }
        }

        return profile;
    },

    // Get all departments for filter dropdown
    getDepartments: async () => {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT department_id, department_name, department_code, faculty
                FROM departments
                ORDER BY faculty ASC, department_name ASC
            `);
        return result.recordset;
    }
};

module.exports = DirectoryModel;
