// modules/directory/directoryModel.js
const { getPool, sql } = require('../../config/database');

const DirectoryModel = {

    // Main search with proper filtering
    search: async ({ query = '', staffType = '', departmentId = '', page = 1, limit = 12 }) => {
        const pool = getPool();
        const offset = (page - 1) * limit;

        // Build the base queries
        let staffQuery = `
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
                sp.phone_extension,
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
            WHERE u.is_active = 1
        `;

        let repQuery = `
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
                0 AS available_slots_count,
                NULL AS phone_extension
            FROM dbo.students s
            INNER JOIN dbo.users u ON s.user_id = u.user_id
            WHERE u.is_active = 1 AND s.is_student_rep = 1
        `;

        // Apply filters
        let staffWhere = [];
        let repWhere = [];

        // Search query filter
        if (query) {
            const searchPattern = `%${query}%`;
            staffWhere.push(`
                (sp.first_name LIKE @query OR 
                 sp.last_name LIKE @query OR 
                 sp.title LIKE @query OR 
                 sp.position LIKE @query OR 
                 sp.areas_of_specialization LIKE @query OR 
                 d.department_name LIKE @query)
            `);
            repWhere.push(`
                (s.first_name LIKE @query OR 
                 s.last_name LIKE @query OR 
                 s.rep_role LIKE @query OR 
                 s.program LIKE @query OR 
                 s.department LIKE @query)
            `);
        }

        // Staff type filter
        if (staffType) {
            if (staffType === 'student_representative') {
                // Only show student reps
                staffQuery = ''; // Don't include staff
            } else if (staffType === 'mentor') {
                staffWhere.push(`sp.is_mentor = 1`);
                repQuery = ''; // Don't show reps when filtering mentors
            } else if (staffType === 'lecturer' || staffType === 'admin_staff') {
                staffWhere.push(`sp.staff_type = @staffType`);
                repQuery = ''; // Don't show reps when filtering specific staff type
            }
        } else {
            // If no staff type filter, show both staff and reps
            // But reps are only shown if they exist
        }

        // Department filter
        if (departmentId && staffQuery) {
            staffWhere.push(`sp.department_id = @departmentId`);
        }

        // Build final queries
        if (staffWhere.length > 0 && staffQuery) {
            staffQuery += ` AND ${staffWhere.join(' AND ')}`;
        }

        if (repWhere.length > 0 && repQuery) {
            repQuery += ` AND ${repWhere.join(' AND ')}`;
        }

        // Combine queries
        let combinedQuery = '';
        const hasStaff = staffQuery && staffQuery.trim().length > 0;
        const hasReps = repQuery && repQuery.trim().length > 0;

        if (hasStaff && hasReps) {
            combinedQuery = `(${staffQuery}) UNION ALL (${repQuery})`;
        } else if (hasStaff) {
            combinedQuery = `(${staffQuery})`;
        } else if (hasReps) {
            combinedQuery = `(${repQuery})`;
        } else {
            return { staff: [], total: 0, page, limit, totalPages: 0 };
        }

        // Prepare request with parameters
        const request = pool.request();
        if (query) {
            request.input('query', sql.VarChar, `%${query}%`);
        }
        if (staffType && staffType !== 'student_representative' && staffType !== 'mentor') {
            request.input('staffType', sql.VarChar, staffType);
        }
        if (departmentId) {
            request.input('departmentId', sql.Int, parseInt(departmentId));
        }

        // Get total count
        let countQuery = `SELECT COUNT(*) AS total FROM (${combinedQuery}) AS combined`;
        // Clean up parameters in count query (replace @params with values for count)
        let cleanCountQuery = countQuery;
        if (query) {
            cleanCountQuery = cleanCountQuery.replace(/@query/g, `'%${query}%'`);
        }
        if (staffType && staffType !== 'student_representative' && staffType !== 'mentor') {
            cleanCountQuery = cleanCountQuery.replace(/@staffType/g, `'${staffType}'`);
        }
        if (departmentId) {
            cleanCountQuery = cleanCountQuery.replace(/@departmentId/g, `${parseInt(departmentId)}`);
        }

        try {
            const countResult = await pool.request().query(cleanCountQuery);
            const total = countResult.recordset[0]?.total || 0;

            // Get paginated results
            const result = await request.query(`
                SELECT * FROM (${combinedQuery}) AS combined
                ORDER BY last_name ASC, first_name ASC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);

            return {
                staff: result.recordset,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Search error:', error);
            // Fallback - try without count
            const result = await request.query(`
                SELECT * FROM (${combinedQuery}) AS combined
                ORDER BY last_name ASC, first_name ASC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);
            return {
                staff: result.recordset,
                total: result.recordset.length,
                page,
                limit,
                totalPages: 1
            };
        }
    },

    // Get single staff profile with full details
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
                    d.department_name, 
                    d.faculty, 
                    d.office_location AS department_office
                FROM dbo.staff_profiles sp
                LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                INNER JOIN dbo.users u ON sp.user_id = u.user_id
                WHERE sp.staff_id = @staff_id AND u.is_active = 1
            `);

        const profile = result.recordset[0] || null;
        if (!profile) return null;

        return profile;
    },

    // Get student rep profile
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

    // Get all departments for filter dropdown
    getDepartments: async () => {
        const pool = getPool();
        const result = await pool.request()
            .query(`
                SELECT department_id, department_name, department_code, faculty 
                FROM dbo.departments 
                ORDER BY faculty ASC, department_name ASC
            `);
        return result.recordset;
    },

    // Get filter options (staff types, etc.)
    getFilters: async () => {
        const pool = getPool();
        
        // Get unique staff types
        const staffTypes = await pool.request()
            .query(`
                SELECT DISTINCT staff_type 
                FROM dbo.staff_profiles 
                WHERE staff_type IS NOT NULL AND staff_type != ''
                ORDER BY staff_type
            `);

        // Get departments
        const departments = await pool.request()
            .query(`
                SELECT department_id, department_name, faculty 
                FROM dbo.departments 
                ORDER BY faculty, department_name
            `);

        return {
            staffTypes: staffTypes.recordset.map(s => s.staff_type),
            departments: departments.recordset
        };
    }
};

module.exports = DirectoryModel;