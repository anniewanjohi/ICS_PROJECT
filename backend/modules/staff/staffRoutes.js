// modules/staff/staffRoutes.js
const express = require('express');
const AuthMiddleware = require('../authentication/authMiddleware');
const { getPool, sql } = require('../../config/database');
const { logAction } = require('../../utils/logger');

const router = express.Router();
router.use(AuthMiddleware.protect);

// GET /api/v1/staff/profile  — staff gets own profile
router.get('/profile', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query(`
                SELECT sp.*, d.department_name, d.faculty
                FROM staff_profiles sp
                LEFT JOIN departments d ON sp.department_id = d.department_id
                WHERE sp.user_id = @user_id
            `);
        if (!result.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }
        return res.status(200).json({ success: true, data: { profile: result.recordset[0] } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// PATCH /api/v1/staff/profile  — staff updates their own profile
router.patch('/profile', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const { title, position, officeLocation, officeHours, officialEmail,
                areasOfSpecialization, biography, isAvailableForBooking, departmentId } = req.body;

        const pool = getPool();
        await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .input('title', sql.VarChar, title || null)
            .input('position', sql.VarChar, position || null)
            .input('office_location', sql.Text, officeLocation || null)
            .input('office_hours', sql.VarChar, officeHours || null)
            .input('official_email', sql.VarChar, officialEmail || null)
            .input('areas_of_specialization', sql.NVarChar, areasOfSpecialization || null)
            .input('biography', sql.Text, biography || null)
            .input('is_available_for_booking', sql.Bit, isAvailableForBooking !== undefined ? (isAvailableForBooking ? 1 : 0) : null)
            .input('department_id', sql.Int, departmentId || null)
            .query(`
                UPDATE staff_profiles SET
                    title = COALESCE(@title, title),
                    position = COALESCE(@position, position),
                    office_location = COALESCE(@office_location, office_location),
                    office_hours = COALESCE(@office_hours, office_hours),
                    official_email = COALESCE(@official_email, official_email),
                    areas_of_specialization = COALESCE(@areas_of_specialization, areas_of_specialization),
                    biography = COALESCE(@biography, biography),
                    is_available_for_booking = COALESCE(@is_available_for_booking, is_available_for_booking),
                    department_id = COALESCE(@department_id, department_id),
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

// GET /api/v1/staff/availability  — staff views own slots
router.get('/availability', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        const staffId = staffResult.recordset[0].staff_id;
        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .query('SELECT * FROM availability_slots WHERE staff_id = @staff_id ORDER BY day_of_week, start_time');

        return res.status(200).json({ success: true, data: { slots: result.recordset } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
});

// POST /api/v1/staff/availability  — add a slot (recurring or specific date)
router.post('/availability', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime, slotDuration, location, isRecurring, specificDate } = req.body;

        if (!startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'startTime and endTime are required' });
        }

        if (isRecurring && !dayOfWeek) {
            return res.status(400).json({ success: false, message: 'dayOfWeek is required for recurring slots' });
        }

        if (!isRecurring && !specificDate) {
            return res.status(400).json({ success: false, message: 'specificDate is required for non-recurring slots' });
        }

        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        const staffId = staffResult.recordset[0].staff_id;

        const result = await pool.request()
            .input('staff_id', sql.Int, staffId)
            .input('day_of_week', sql.Int, dayOfWeek || null)
            .input('start_time', sql.VarChar, startTime)
            .input('end_time', sql.VarChar, endTime)
            .input('slot_duration', sql.Int, slotDuration || 30)
            .input('location', sql.VarChar, location || null)
            .input('is_recurring', sql.Bit, isRecurring ? 1 : 0)
            .input('specific_date', sql.Date, specificDate || null)
            .query(`
                INSERT INTO availability_slots 
                    (staff_id, day_of_week, start_time, end_time, slot_duration, location, is_recurring, specific_date, is_available, created_at, updated_at)
                OUTPUT INSERTED.*
                VALUES 
                    (@staff_id, @day_of_week, @start_time, @end_time, @slot_duration, @location, @is_recurring, @specific_date, 1, GETDATE(), GETDATE())
            `);

        return res.status(201).json({ success: true, message: 'Availability slot added', data: { slot: result.recordset[0] } });
    } catch (error) {
        console.error('Add slot error:', error);
        return res.status(500).json({ success: false, message: 'Error adding availability slot' });
    }
});

// DELETE /api/v1/staff/availability/:slotId
router.delete('/availability/:slotId', AuthMiddleware.restrictTo('staff'), async (req, res) => {
    try {
        const pool = getPool();
        const staffResult = await pool.request()
            .input('user_id', sql.Int, req.user.userId)
            .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

        if (!staffResult.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        await pool.request()
            .input('slot_id', sql.Int, parseInt(req.params.slotId))
            .input('staff_id', sql.Int, staffResult.recordset[0].staff_id)
            .query('DELETE FROM availability_slots WHERE slot_id = @slot_id AND staff_id = @staff_id');

        return res.status(200).json({ success: true, message: 'Slot removed' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error removing slot' });
    }
});

module.exports = router;
