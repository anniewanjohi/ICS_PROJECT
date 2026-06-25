// modules/appointments/appointmentController.js
const AppointmentModel = require('./appointmentModel');
const NotificationModel = require('../notifications/notificationModel');
const { getPool, sql } = require('../../config/database');
const { logAction } = require('../../utils/logger');

class AppointmentController {

    // GET /api/v1/appointments/slots/:staffId
    static async getSlots(req, res) {
        try {
            const { staffId } = req.params;
            const slots = await AppointmentModel.getAvailableSlots(parseInt(staffId));
            const booked = await AppointmentModel.getBookedSlots(parseInt(staffId));
            return res.status(200).json({ success: true, data: { slots, booked } });
        } catch (error) {
            console.error('Get slots error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching availability' });
        }
    }

    // POST /api/v1/appointments
    static async book(req, res) {
        try {
            const { staffId, slotId, appointmentDate, startTime, endTime, purpose, additionalNotes, meetingLocation } = req.body;

            if (!staffId || !appointmentDate || !startTime || !endTime || !purpose) {
                return res.status(400).json({ success: false, message: 'staffId, appointmentDate, startTime, endTime, and purpose are required' });
            }

            // Get student record from user
            const pool = getPool();
            const studentResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT student_id FROM students WHERE user_id = @user_id');

            if (!studentResult.recordset[0]) {
                return res.status(400).json({ success: false, message: 'Student profile not found. Please complete your profile first.' });
            }

            const studentId = studentResult.recordset[0].student_id;

            // Check slot not already taken
            const taken = await AppointmentModel.isSlotTaken(parseInt(staffId), appointmentDate, startTime);
            if (taken) {
                return res.status(409).json({ success: false, message: 'This time slot has already been booked. Please select another.' });
            }

            const appointment = await AppointmentModel.create(studentId, parseInt(staffId), slotId || null, {
                appointmentDate, startTime, endTime, purpose, additionalNotes, meetingLocation
            });

            // Get staff user_id for notification
            const staffResult = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('SELECT user_id, first_name, last_name FROM staff_profiles WHERE staff_id = @staff_id');
            const staff = staffResult.recordset[0];

            // Notify staff
            await NotificationModel.create({
                userId: staff.user_id,
                appointmentId: appointment.appointment_id,
                title: 'New Appointment Request',
                message: `A student has requested an appointment on ${appointmentDate} at ${startTime}.`,
                type: 'appointment_created'
            });

            // Notify student (confirmation of submission)
            await NotificationModel.create({
                userId: req.user.userId,
                appointmentId: appointment.appointment_id,
                title: 'Booking Request Submitted',
                message: `Your appointment request with ${staff.first_name} ${staff.last_name} on ${appointmentDate} at ${startTime} is pending confirmation.`,
                type: 'appointment_created'
            });

            await logAction(req.user.userId, 'APPOINTMENT_CREATED', 'appointments', appointment.appointment_id, req);

            return res.status(201).json({ success: true, message: 'Appointment request submitted', data: { appointment } });

        } catch (error) {
            console.error('Book appointment error:', error);
            return res.status(500).json({ success: false, message: 'Error booking appointment' });
        }
    }

    // GET /api/v1/appointments/my  — student sees their own appointments
    static async getMyAppointments(req, res) {
        try {
            const { status } = req.query;

            if (req.user.role === 'student') {
                const pool = getPool();
                const studentResult = await pool.request()
                    .input('user_id', sql.Int, req.user.userId)
                    .query('SELECT student_id FROM students WHERE user_id = @user_id');

                if (!studentResult.recordset[0]) {
                    return res.status(400).json({ success: false, message: 'Student profile not found' });
                }

                const appointments = await AppointmentModel.getStudentAppointments(
                    studentResult.recordset[0].student_id, status || ''
                );
                return res.status(200).json({ success: true, data: { appointments } });

            } else if (req.user.role === 'staff') {
                const pool = getPool();
                const staffResult = await pool.request()
                    .input('user_id', sql.Int, req.user.userId)
                    .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

                if (!staffResult.recordset[0]) {
                    return res.status(400).json({ success: false, message: 'Staff profile not found' });
                }

                const appointments = await AppointmentModel.getStaffAppointments(
                    staffResult.recordset[0].staff_id, status || ''
                );
                return res.status(200).json({ success: true, data: { appointments } });
            }

            return res.status(403).json({ success: false, message: 'Access denied' });

        } catch (error) {
            console.error('Get appointments error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching appointments' });
        }
    }

    // PATCH /api/v1/appointments/:id/respond  — staff confirms or declines
    static async respond(req, res) {
        try {
            const { id } = req.params;
            const { status, cancellationReason } = req.body;

            if (!['confirmed', 'declined'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Status must be confirmed or declined' });
            }

            const appointment = await AppointmentModel.findById(parseInt(id));
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // Make sure this staff member owns this appointment
            const pool = getPool();
            const staffResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

            if (!staffResult.recordset[0] || staffResult.recordset[0].staff_id !== appointment.staff_id) {
                return res.status(403).json({ success: false, message: 'You can only respond to your own appointment requests' });
            }

            const updated = await AppointmentModel.updateStatus(parseInt(id), status === 'declined' ? 'cancelled' : status, { cancellationReason });

            // Notify student
            const notifTitle = status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Declined';
            const notifMsg = status === 'confirmed'
                ? `Your appointment on ${appointment.appointment_date} at ${appointment.start_time} has been confirmed.`
                : `Your appointment on ${appointment.appointment_date} at ${appointment.start_time} was declined. ${cancellationReason || ''}`;

            await NotificationModel.create({
                userId: appointment.student_user_id,
                appointmentId: parseInt(id),
                title: notifTitle,
                message: notifMsg,
                type: status === 'confirmed' ? 'appointment_confirmed' : 'appointment_cancelled'
            });

            await logAction(req.user.userId, `APPOINTMENT_${status.toUpperCase()}`, 'appointments', parseInt(id), req);

            return res.status(200).json({ success: true, message: `Appointment ${status}`, data: { appointment: updated } });

        } catch (error) {
            console.error('Respond to appointment error:', error);
            return res.status(500).json({ success: false, message: 'Error updating appointment' });
        }
    }

    // PATCH /api/v1/appointments/:id/cancel  — student cancels their own
    static async cancel(req, res) {
        try {
            const { id } = req.params;
            const { cancellationReason } = req.body;

            const appointment = await AppointmentModel.findById(parseInt(id));
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // Confirm this student owns it
            const pool = getPool();
            const studentResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT student_id FROM students WHERE user_id = @user_id');

            if (!studentResult.recordset[0] || studentResult.recordset[0].student_id !== appointment.student_id) {
                return res.status(403).json({ success: false, message: 'You can only cancel your own appointments' });
            }

            if (!['pending', 'confirmed'].includes(appointment.status)) {
                return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' });
            }

            // Enforce 2-hour rule
            const canCancel = await AppointmentModel.canStudentCancel(parseInt(id));
            if (!canCancel) {
                return res.status(400).json({ success: false, message: 'Appointments can only be cancelled more than 2 hours before the scheduled time' });
            }

            await AppointmentModel.updateStatus(parseInt(id), 'cancelled', { cancellationReason });

            // Notify staff
            await NotificationModel.create({
                userId: appointment.staff_user_id,
                appointmentId: parseInt(id),
                title: 'Appointment Cancelled',
                message: `${appointment.student_first_name} ${appointment.student_last_name} cancelled their appointment on ${appointment.appointment_date} at ${appointment.start_time}.`,
                type: 'appointment_cancelled'
            });

            await logAction(req.user.userId, 'APPOINTMENT_CANCELLED', 'appointments', parseInt(id), req);

            return res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });

        } catch (error) {
            console.error('Cancel appointment error:', error);
            return res.status(500).json({ success: false, message: 'Error cancelling appointment' });
        }
    }
}

module.exports = AppointmentController;
