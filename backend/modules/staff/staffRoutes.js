// modules/staff/staffRoutes.js
const express = require('express');
const AuthMiddleware = require('../authentication/authMiddleware');
const { getPool, sql } = require('../../config/database');
const { logAction } = require('../../utils/logger');
const GoogleCalendarService = require('../calendar/calendarService');

const router = express.Router();
router.use(AuthMiddleware.protect);

let calendarService = null;

const initCalendar = async () => {
    if (!calendarService) {
        calendarService = new GoogleCalendarService();
        await calendarService.init();
    }
    return calendarService;
};

function formatTimeField(value) {
    if (!value) return null;
    if (typeof value === 'string') return value;
    const hours = String(value.getUTCHours()).padStart(2, '0');
    const minutes = String(value.getUTCMinutes()).padStart(2, '0');
    const seconds = String(value.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function generateRandomMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return `https://meet.google.com/${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7, 12)}`;
}

// GET /api/v1/staff/profile
router.get('/profile', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query(`
                SELECT sp.*, d.department_name
                FROM dbo.staff_profiles sp
                LEFT JOIN dbo.departments d ON sp.department_id = d.department_id
                WHERE sp.user_id = @user_id
            `);
        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }
        return res.status(200).json({ success: true, data: { profile: result.recordset[0] } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// PATCH /api/v1/staff/profile
router.patch('/profile', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const {
            title, position, officeLocation, officeHours, officialEmail,
            areasOfSpecialization, biography, isAvailableForBooking,
            staffType, isMentor, phoneExtension,
            firstName, lastName, faculty
        } = req.body;

        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .input('first_name', sql.VarChar, firstName || null)
            .input('last_name', sql.VarChar, lastName || null)
            .input('title', sql.VarChar, title || null)
            .input('position', sql.VarChar, position || null)
            .input('office_location', sql.Text, officeLocation || null)
            .input('office_hours', sql.VarChar, officeHours || null)
            .input('official_email', sql.VarChar, officialEmail || null)
            .input('areas_of_specialization', sql.NVarChar, areasOfSpecialization || null)
            .input('biography', sql.Text, biography || null)
            .input('is_available_for_booking', sql.Bit, isAvailableForBooking !== undefined ? (isAvailableForBooking ? 1 : 0) : null)
            .input('staff_type', sql.VarChar, staffType || null)
            .input('is_mentor', sql.Bit, isMentor !== undefined ? (isMentor ? 1 : 0) : null)
            .input('phone_extension', sql.VarChar, phoneExtension || null)
            .input('faculty', sql.VarChar, faculty || null)
            .query(`
                UPDATE dbo.staff_profiles SET
                    first_name = COALESCE(@first_name, first_name),
                    last_name = COALESCE(@last_name, last_name),
                    title = COALESCE(@title, title),
                    position = COALESCE(@position, position),
                    office_location = COALESCE(@office_location, office_location),
                    office_hours = COALESCE(@office_hours, office_hours),
                    official_email = COALESCE(@official_email, official_email),
                    areas_of_specialization = COALESCE(@areas_of_specialization, areas_of_specialization),
                    biography = COALESCE(@biography, biography),
                    is_available_for_booking = COALESCE(@is_available_for_booking, is_available_for_booking),
                    staff_type = COALESCE(@staff_type, staff_type),
                    is_mentor = COALESCE(@is_mentor, is_mentor),
                    phone_extension = COALESCE(@phone_extension, phone_extension),
                    faculty = COALESCE(@faculty, faculty),
                    updated_at = GETDATE()
                WHERE user_id = @user_id
            `);

        await logAction(req.user.userId, 'PROFILE_UPDATED', 'staff_profiles', null, req);
        return res.status(200).json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// GET /api/v1/staff/availability
router.get('/availability', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM dbo.staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        const result = await pool.request()
            .input('staff_id', sql.Int, staffResult.recordset[0].staff_id)
            .query('SELECT * FROM dbo.availability_slots WHERE staff_id = @staff_id ORDER BY day_of_week, start_time');

        const slots = result.recordset.map(slot => ({
            ...slot,
            start_time: formatTimeField(slot.start_time),
            end_time: formatTimeField(slot.end_time),
        }));

        return res.status(200).json({ success: true, data: { slots } });
    } catch (error) {
        console.error('Get availability error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
});

// POST /api/v1/staff/availability - WITH GOOGLE MEET INTEGRATION
router.post('/availability', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime, slotDuration, location, isRecurring, specificDate, meetingLink } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
        }
        if (isRecurring && !dayOfWeek) {
            return res.status(400).json({ success: false, message: 'dayOfWeek required for recurring slots' });
        }
        if (!isRecurring && !specificDate) {
            return res.status(400).json({ success: false, message: 'specificDate required for one-off slots' });
        }

        const isOnline = (location || '').toLowerCase().includes('online');
        
        let finalMeetLink = meetingLink || null;
        let calendarEventId = null;

        // If online and no meeting link provided, try to create Google Meet
        if (isOnline && !meetingLink) {
            try {
                const calendar = await initCalendar();
                
                if (calendar.isAuthenticated()) {
                    // Create date objects for the event
                    const dateObj = specificDate ? new Date(specificDate) : new Date();
                    const startDateTime = new Date(dateObj);
                    const [startHour, startMinute] = (startTime || '09:00').split(':').map(Number);
                    startDateTime.setHours(startHour, startMinute, 0, 0);
                    
                    const endDateTime = new Date(startDateTime);
                    const [endHour, endMinute] = (endTime || '10:00').split(':').map(Number);
                    endDateTime.setHours(endHour, endMinute, 0, 0);

                    const meetResult = await calendar.createMeetEvent({
                        summary: `Availability Slot`,
                        description: `Booking slot created via SU Directory`,
                        startTime: startDateTime.toISOString(),
                        endTime: endDateTime.toISOString(),
                        location: 'Online - Google Meet',
                        attendees: []
                    });

                    if (meetResult.success) {
                        finalMeetLink = meetResult.meetLink;
                        calendarEventId = meetResult.eventId;
                        console.log('✅ Google Meet created:', finalMeetLink);
                    } else {
                        console.log('⚠️ Could not create Google Meet, using fallback');
                        finalMeetLink = generateRandomMeetLink();
                    }
                } else {
                    console.log('⚠️ Calendar not authenticated, using fallback link');
                    finalMeetLink = generateRandomMeetLink();
                }
            } catch (error) {
                console.error('❌ Google Meet creation failed:', error.message);
                finalMeetLink = generateRandomMeetLink();
            }
        }

        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM dbo.staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        const finalLocation = (isOnline && finalMeetLink) ? `Online — ${finalMeetLink}` : (location || null);

        const result = await pool.request()
            .input('staff_id', sql.Int, staffResult.recordset[0].staff_id)
            .input('day_of_week', sql.Int, dayOfWeek || null)
            .input('start_time', sql.VarChar, startTime)
            .input('end_time', sql.VarChar, endTime)
            .input('slot_duration', sql.Int, slotDuration || 30)
            .input('location', sql.VarChar, finalLocation)
            .input('meeting_link', sql.VarChar, finalMeetLink)
            .input('calendar_event_id', sql.VarChar, calendarEventId)
            .input('is_recurring', sql.Bit, isRecurring ? 1 : 0)
            .input('specific_date', sql.Date, specificDate || null)
            .query(`
                INSERT INTO dbo.availability_slots 
                    (staff_id, day_of_week, start_time, end_time, slot_duration, location, meeting_link, calendar_event_id, is_recurring, specific_date, is_available, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES (@staff_id, @day_of_week, @start_time, @end_time, @slot_duration, @location, @meeting_link, @calendar_event_id, @is_recurring, @specific_date, 1, GETDATE(), GETDATE())
            `);

        const newSlot = result.recordset[0];
        newSlot.start_time = formatTimeField(newSlot.start_time);
        newSlot.end_time = formatTimeField(newSlot.end_time);

        await logAction(req.user.userId, 'AVAILABILITY_SLOT_CREATED', 'availability_slots', newSlot.slot_id, req);

        return res.status(201).json({ success: true, message: 'Slot added', data: { slot: newSlot } });
    } catch (error) {
        console.error('Add slot error:', error);
        return res.status(500).json({ success: false, message: 'Error adding slot' });
    }
});

// DELETE /api/v1/staff/availability/:slotId
router.delete('/availability/:slotId', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        console.log('🔍 Delete slot request - Slot ID:', req.params.slotId);
        
        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM dbo.staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        const staffId = staffResult.recordset[0].staff_id;
        const slotId = parseInt(req.params.slotId);

        // Check if slot exists
        const checkSlot = await pool.request()
            .input('slot_id', sql.Int, slotId)
            .input('staff_id', sql.Int, staffId)
            .query('SELECT calendar_event_id FROM dbo.availability_slots WHERE slot_id = @slot_id AND staff_id = @staff_id');

        if (!checkSlot.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Slot not found' });
        }

        // Delete Google Calendar event if exists
        const calendarEventId = checkSlot.recordset[0].calendar_event_id;
        if (calendarEventId) {
            try {
                const calendar = await initCalendar();
                await calendar.deleteMeetEvent(calendarEventId);
                console.log('✅ Deleted Google Calendar event:', calendarEventId);
            } catch (error) {
                console.error('⚠️ Failed to delete calendar event:', error.message);
            }
        }

        // Check for appointments using this slot
        const checkAppointments = await pool.request()
            .input('slot_id', sql.Int, slotId)
            .query('SELECT COUNT(*) as count FROM dbo.appointments WHERE slot_id = @slot_id');

        const appointmentCount = checkAppointments.recordset[0].count;

        if (appointmentCount > 0) {
            await pool.request()
                .input('slot_id', sql.Int, slotId)
                .query('UPDATE dbo.appointments SET slot_id = NULL WHERE slot_id = @slot_id');
            console.log(`🔄 Updated ${appointmentCount} appointments to remove slot reference`);
        }

        // Delete the slot
        const result = await pool.request()
            .input('slot_id', sql.Int, slotId)
            .input('staff_id', sql.Int, staffId)
            .query('DELETE FROM dbo.availability_slots WHERE slot_id = @slot_id AND staff_id = @staff_id');

        await logAction(req.user.userId, 'AVAILABILITY_SLOT_DELETED', 'availability_slots', slotId, req);

        return res.status(200).json({ success: true, message: 'Slot removed' });
    } catch (error) {
        console.error('❌ Delete slot error:', error);
        return res.status(500).json({ success: false, message: 'Error removing slot' });
    }
});

// PATCH /api/v1/staff/student-profile
router.patch('/student-profile', AuthMiddleware.restrictTo('student'), async (req, res) => {
    try {
        const {
            firstName, lastName, program, yearOfStudy,
            faculty, phoneNumber, isStudentRep, repRole, studentRegNo
        } = req.body;

        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .input('first_name', sql.VarChar, firstName || null)
            .input('last_name', sql.VarChar, lastName || null)
            .input('student_reg_no', sql.VarChar, studentRegNo || null)
            .input('program', sql.VarChar, program || null)
            .input('year_of_study', sql.Int, yearOfStudy || null)
            .input('faculty', sql.VarChar, faculty || null)
            .input('phone_number', sql.VarChar, phoneNumber || null)
            .input('is_student_rep', sql.Bit, isStudentRep ? 1 : 0)
            .input('rep_role', sql.VarChar, repRole || null)
            .query(`
                UPDATE dbo.students SET
                    first_name = COALESCE(@first_name, first_name),
                    last_name = COALESCE(@last_name, last_name),
                    student_reg_no = COALESCE(@student_reg_no, student_reg_no),
                    program = COALESCE(@program, program),
                    year_of_study = COALESCE(@year_of_study, year_of_study),
                    faculty = COALESCE(@faculty, faculty),
                    phone_number = COALESCE(@phone_number, phone_number),
                    is_student_rep = @is_student_rep,
                    rep_role = @rep_role,
                    updated_at = GETDATE()
                WHERE user_id = @user_id
            `);

        await logAction(req.user.userId, 'STUDENT_PROFILE_UPDATED', 'students', null, req);
        return res.status(200).json({ success: true, message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

module.exports = router;