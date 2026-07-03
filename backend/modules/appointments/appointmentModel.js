// modules/appointments/appointmentModel.js
const { getPool, sql } = require('../../config/database');

function formatTimeField(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const hours = String(value.getUTCHours()).padStart(2, '0');
    const minutes = String(value.getUTCMinutes()).padStart(2, '0');
    const seconds = String(value.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

const AppointmentModel = {

    getAvailableSlots: async (staffId, weeksAhead = 2) => {
        const pool = getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .query(`
                SELECT 
                    av.slot_id, av.day_of_week, av.start_time, av.end_time,
                    av.slot_duration, av.location, av.is_recurring,
                    av.specific_date, av.is_available
                FROM availability_slots av
                WHERE av.staff_id = @staff_id
                  AND av.is_available = 1
                  AND (
                      av.is_recurring = 1
                      OR (av.specific_date IS NOT NULL AND av.specific_date >= CAST(GETDATE() AS DATE))
                  )
                ORDER BY av.day_of_week ASC, av.start_time ASC
            `);
        return result.recordset.map(slot => ({
            ...slot,
            start_time: formatTimeField(slot.start_time),
            end_time: formatTimeField(slot.end_time),
        }));
    },

    // NEW: Get slots for a specific date
    getSlotsForDate: async (staffId, date) => {
        const pool = getPool();
        const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 1=Monday, etc.
        
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .input('day_of_week', sql.Int, dayOfWeek)
            .input('specific_date', sql.Date, date)
            .query(`
                SELECT 
                    slot_id, day_of_week, start_time, end_time,
                    slot_duration, location, is_recurring,
                    specific_date, is_available
                FROM availability_slots
                WHERE staff_id = @staff_id
                  AND is_available = 1
                  AND (
                      (is_recurring = 1 AND day_of_week = @day_of_week)
                      OR (specific_date = @specific_date)
                  )
                ORDER BY start_time ASC
            `);
        return result.recordset.map(slot => ({
            ...slot,
            start_time: formatTimeField(slot.start_time),
            end_time: formatTimeField(slot.end_time),
        }));
    },

    getBookedSlots: async (staffId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .query(`
                SELECT appointment_date, start_time, end_time, slot_id
                FROM appointments
                WHERE staff_id = @staff_id
                  AND status IN ('pending', 'confirmed')
                  AND appointment_date >= CAST(GETDATE() AS DATE)
            `);
        return result.recordset.map(row => ({
            ...row,
            start_time: formatTimeField(row.start_time),
            end_time: formatTimeField(row.end_time),
        }));
    },

    create: async (studentId, staffId, slotId, data) => {
        const pool = getPool();
        const result = await pool.request()
            .input('student_id', sql.Int, studentId)
            .input('staff_id', sql.Int, staffId)
            .input('slot_id', sql.Int, slotId)
            .input('appointment_date', sql.Date, data.appointmentDate)
            .input('start_time', sql.VarChar, data.startTime)
            .input('end_time', sql.VarChar, data.endTime)
            .input('purpose', sql.Text, data.purpose)
            .input('additional_notes', sql.Text, data.additionalNotes || null)
            .input('meeting_location', sql.VarChar, data.meetingLocation || null)
            .input('meeting_link', sql.VarChar, data.meetingLink || null)
            .query(`
                INSERT INTO appointments 
                    (student_id, staff_id, slot_id, appointment_date, start_time, end_time, purpose, additional_notes, meeting_location, meeting_link, status, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES 
                    (@student_id, @staff_id, @slot_id, @appointment_date, @start_time, @end_time, @purpose, @additional_notes, @meeting_location, @meeting_link, 'pending', GETDATE(), GETDATE())
            `);
        const appointment = result.recordset[0];
        appointment.start_time = formatTimeField(appointment.start_time);
        appointment.end_time = formatTimeField(appointment.end_time);
        return appointment;
    },

    isSlotTaken: async (staffId, appointmentDate, startTime) => {
        const pool = getPool();
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .input('appointment_date', sql.Date, appointmentDate)
            .input('start_time', sql.VarChar, startTime)
            .query(`
                SELECT COUNT(*) AS count 
                FROM appointments
                WHERE staff_id = @staff_id
                  AND appointment_date = @appointment_date
                  AND start_time = @start_time
                  AND status IN ('pending', 'confirmed')
            `);
        return result.recordset[0].count > 0;
    },

    getStudentAppointments: async (studentId, status = '') => {
        const pool = getPool();
        const request = pool.request().input('student_id', sql.Int, studentId);
        let where = 'WHERE a.student_id = @student_id';
        if (status) {
            where += ' AND a.status = @status';
            request.input('status', sql.VarChar, status);
        }

        const result = await request.query(`
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.purpose,
                a.additional_notes,
                a.status,
                a.meeting_location,
                a.meeting_link,
                a.created_at,
                sp.first_name AS staff_first_name,
                sp.last_name AS staff_last_name,
                sp.title AS staff_title,
                sp.position AS staff_position,
                sp.office_location,
                sp.official_email AS staff_email,
                d.department_name
            FROM appointments a
            INNER JOIN staff_profiles sp ON a.staff_id = sp.staff_id
            LEFT JOIN departments d ON sp.department_id = d.department_id
            ${where}
            ORDER BY a.appointment_date DESC, a.start_time DESC
        `);
        return result.recordset.map(row => ({
            ...row,
            start_time: formatTimeField(row.start_time),
            end_time: formatTimeField(row.end_time),
        }));
    },

    getStaffAppointments: async (staffId, status = '') => {
        const pool = getPool();
        const request = pool.request().input('staff_id', sql.Int, staffId);
        let where = 'WHERE a.staff_id = @staff_id';
        if (status) {
            where += ' AND a.status = @status';
            request.input('status', sql.VarChar, status);
        }

        const result = await request.query(`
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.start_time,
                a.end_time,
                a.purpose,
                a.additional_notes,
                a.status,
                a.meeting_location,
                a.meeting_link,
                a.created_at,
                s.first_name AS student_first_name,
                s.last_name AS student_last_name,
                s.student_reg_no,
                s.program,
                s.year_of_study
            FROM appointments a
            INNER JOIN students s ON a.student_id = s.student_id
            ${where}
            ORDER BY a.appointment_date ASC, a.start_time ASC
        `);
        return result.recordset.map(row => ({
            ...row,
            start_time: formatTimeField(row.start_time),
            end_time: formatTimeField(row.end_time),
        }));
    },

    findById: async (appointmentId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('appointment_id', sql.Int, appointmentId)
            .query(`
                SELECT a.*, 
                    s.first_name AS student_first_name, s.last_name AS student_last_name,
                    s.student_reg_no, s.user_id AS student_user_id,
                    sp.first_name AS staff_first_name, sp.last_name AS staff_last_name,
                    sp.user_id AS staff_user_id
                FROM appointments a
                INNER JOIN students s ON a.student_id = s.student_id
                INNER JOIN staff_profiles sp ON a.staff_id = sp.staff_id
                WHERE a.appointment_id = @appointment_id
            `);
        const row = result.recordset[0];
        if (!row) return null;
        row.start_time = formatTimeField(row.start_time);
        row.end_time = formatTimeField(row.end_time);
        return row;
    },

    updateStatus: async (appointmentId, status, extra = {}) => {
        const pool = getPool();
        let setClause = 'status = @status, updated_at = GETDATE()';
        const request = pool.request()
            .input('appointment_id', sql.Int, appointmentId)
            .input('status', sql.VarChar, status);

        if (status === 'confirmed') {
            setClause += ', confirmed_at = GETDATE()';
        }
        if (status === 'cancelled') {
            setClause += ', cancelled_at = GETDATE()';
            if (extra.cancellationReason) {
                setClause += ', cancellation_reason = @cancellationReason';
                request.input('cancellationReason', sql.VarChar, extra.cancellationReason);
            }
        }

        const result = await request.query(`
            UPDATE appointments SET ${setClause}
            OUTPUT INSERTED.*
            WHERE appointment_id = @appointment_id
        `);
        const row = result.recordset[0];
        if (row) {
            row.start_time = formatTimeField(row.start_time);
            row.end_time = formatTimeField(row.end_time);
        }
        return row;
    },

    // NEW: Reschedule appointment
    reschedule: async (appointmentId, data) => {
        const pool = getPool();
        const result = await pool.request()
            .input('appointment_id', sql.Int, appointmentId)
            .input('appointment_date', sql.Date, data.appointmentDate)
            .input('start_time', sql.VarChar, data.startTime)
            .input('end_time', sql.VarChar, data.endTime)
            .input('reschedule_reason', sql.VarChar, data.reason || null)
            .query(`
                UPDATE appointments 
                SET 
                    appointment_date = @appointment_date,
                    start_time = @start_time,
                    end_time = @end_time,
                    reschedule_reason = @reschedule_reason,
                    rescheduled_at = GETDATE(),
                    status = 'pending',
                    updated_at = GETDATE()
                OUTPUT INSERTED.*
                WHERE appointment_id = @appointment_id
            `);
        const row = result.recordset[0];
        if (row) {
            row.start_time = formatTimeField(row.start_time);
            row.end_time = formatTimeField(row.end_time);
        }
        return row;
    },

    canStudentCancel: async (appointmentId) => {
        const pool = getPool();
        const result = await pool.request()
            .input('appointment_id', sql.Int, appointmentId)
            .query(`
                SELECT 
                    CASE 
                        WHEN DATEDIFF(MINUTE, GETDATE(), CAST(CAST(appointment_date AS VARCHAR) + ' ' + CAST(start_time AS VARCHAR) AS DATETIME)) > 120
                        THEN 1 ELSE 0 
                    END AS can_cancel
                FROM appointments
                WHERE appointment_id = @appointment_id
            `);
        return result.recordset[0]?.can_cancel === 1;
    }
};

module.exports = AppointmentModel;