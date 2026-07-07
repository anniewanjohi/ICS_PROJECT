// modules/appointments/appointmentController.js
const AppointmentModel = require('./appointmentModel');
const NotificationModel = require('../notifications/notificationModel');
const { getPool, sql } = require('../../config/database');
const { logAction } = require('../../utils/logger');

class AppointmentController {

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

    static async getSlotsByDate(req, res) {
        try {
            const { staffId, date } = req.params;
            const slots = await AppointmentModel.getSlotsForDate(parseInt(staffId), date);
            return res.status(200).json({ success: true, data: { slots } });
        } catch (error) {
            console.error('Get slots by date error:', error);
            return res.status(500).json({ success: false, message: 'Error fetching slots' });
        }
    }

    static async book(req, res) {
        try {
            const { staffId, appointmentDate, startTime, endTime, purpose, additionalNotes, meetingLocation } = req.body;

            if (!staffId || !appointmentDate || !startTime || !endTime || !purpose) {
                return res.status(400).json({ success: false, message: 'staffId, appointmentDate, startTime, endTime, and purpose are required' });
            }

            const pool = getPool();
            const studentResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT student_id FROM students WHERE user_id = @user_id');

            if (!studentResult.recordset[0]) {
                return res.status(400).json({ success: false, message: 'Student profile not found. Please complete your profile first.' });
            }

            const studentId = studentResult.recordset[0].student_id;

            const taken = await AppointmentModel.isSlotTaken(parseInt(staffId), appointmentDate, startTime);
            if (taken) {
                return res.status(409).json({ success: false, message: 'This time slot has already been booked. Please select another.' });
            }

            let extractedMeetingLink = null;
            if (meetingLocation && meetingLocation.startsWith('Online — ')) {
                extractedMeetingLink = meetingLocation.replace('Online — ', '').trim();
            }

            const appointment = await AppointmentModel.create(studentId, parseInt(staffId), null, {
                appointmentDate, startTime, endTime, purpose, additionalNotes,
                meetingLocation, meetingLink: extractedMeetingLink
            });

            const staffResult = await pool.request()
                .input('staff_id', sql.Int, staffId)
                .query('SELECT user_id, first_name, last_name FROM staff_profiles WHERE staff_id = @staff_id');
            const staff = staffResult.recordset[0];

            await NotificationModel.create({
                userId: staff.user_id,
                appointmentId: appointment.appointment_id,
                title: 'New Appointment Request',
                message: `A student has requested an appointment on ${appointmentDate} at ${startTime}.`,
                type: 'appointment_created'
            });

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

    static async getMyAppointments(req, res) {
        try {
            const { status } = req.query;
            const pool = getPool();

            // AUTO-UPDATE: Mark all past appointments as MISSED
            const updateResult = await pool.request()
                .query(`
                    UPDATE dbo.appointments 
                    SET meeting_status = 'missed', 
                        attended_at = GETDATE(),
                        updated_at = GETDATE()
                    WHERE status IN ('confirmed', 'pending')
                      AND (meeting_status IS NULL OR meeting_status = 'pending')
                      AND CAST(appointment_date AS DATETIME) + CAST(start_time AS DATETIME) < GETDATE()
                `);

            console.log(`✅ Auto-marked ${updateResult.rowsAffected ? updateResult.rowsAffected[0] : 0} past appointments as MISSED`);

            if (req.user.role === 'student') {
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

            const pool = getPool();
            const staffResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

            if (!staffResult.recordset[0] || staffResult.recordset[0].staff_id !== appointment.staff_id) {
                return res.status(403).json({ success: false, message: 'You can only respond to your own appointment requests' });
            }

            const updated = await AppointmentModel.updateStatus(parseInt(id), status === 'declined' ? 'cancelled' : status, { cancellationReason });

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

    static async cancel(req, res) {
        try {
            const { id } = req.params;
            const { cancellationReason } = req.body;

            console.log(`🔄 Cancelling appointment ${id} for user ${req.user.userId}`);

            const appointment = await AppointmentModel.findById(parseInt(id));
            if (!appointment) {
                console.log(`❌ Appointment ${id} not found`);
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            console.log(`📊 Appointment found: status=${appointment.status}, student_id=${appointment.student_id}`);

            const pool = getPool();
            const studentResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT student_id FROM students WHERE user_id = @user_id');

            if (!studentResult.recordset[0]) {
                console.log(`❌ Student profile not found for user ${req.user.userId}`);
                return res.status(400).json({ success: false, message: 'Student profile not found' });
            }

            console.log(`📊 Student ID: ${studentResult.recordset[0].student_id}, Appointment student_id: ${appointment.student_id}`);

            if (studentResult.recordset[0].student_id !== appointment.student_id) {
                console.log(`❌ Student ${studentResult.recordset[0].student_id} not authorized to cancel appointment ${id}`);
                return res.status(403).json({ success: false, message: 'You can only cancel your own appointments' });
            }

            if (!['pending', 'confirmed'].includes(appointment.status)) {
                console.log(`❌ Appointment status ${appointment.status} cannot be cancelled`);
                return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' });
            }

            const canCancel = await AppointmentModel.canStudentCancel(parseInt(id));
            if (!canCancel) {
                console.log(`❌ Appointment ${id} is within 2 hours, cannot cancel`);
                return res.status(400).json({ success: false, message: 'Appointments can only be cancelled more than 2 hours before the scheduled time' });
            }

            await AppointmentModel.updateStatus(parseInt(id), 'cancelled', { cancellationReason });

            await NotificationModel.create({
                userId: appointment.staff_user_id,
                appointmentId: parseInt(id),
                title: 'Appointment Cancelled',
                message: `${appointment.student_first_name} ${appointment.student_last_name} cancelled their appointment on ${appointment.appointment_date} at ${appointment.start_time}.`,
                type: 'appointment_cancelled'
            });

            await NotificationModel.create({
                userId: req.user.userId,
                appointmentId: parseInt(id),
                title: 'Appointment Cancelled',
                message: `You successfully cancelled your appointment on ${appointment.appointment_date} at ${appointment.start_time}.`,
                type: 'appointment_cancelled'
            });

            await logAction(req.user.userId, 'APPOINTMENT_CANCELLED', 'appointments', parseInt(id), req);

            console.log(`✅ Appointment ${id} cancelled successfully`);
            return res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });

        } catch (error) {
            console.error('❌ Cancel appointment error:', error);
            return res.status(500).json({ success: false, message: 'Error cancelling appointment', error: error.message });
        }
    }

    static async reschedule(req, res) {
        try {
            const { id } = req.params;
            const { appointmentDate, startTime, endTime, reason } = req.body;

            if (!appointmentDate || !startTime || !endTime) {
                return res.status(400).json({ success: false, message: 'appointmentDate, startTime, and endTime are required' });
            }

            const appointment = await AppointmentModel.findById(parseInt(id));
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            const pool = getPool();
            let isAuthorized = false;

            if (req.user.role === 'student') {
                const studentResult = await pool.request()
                    .input('user_id', sql.Int, req.user.userId)
                    .query('SELECT student_id FROM students WHERE user_id = @user_id');
                if (studentResult.recordset[0] && studentResult.recordset[0].student_id === appointment.student_id) {
                    isAuthorized = true;
                }
            } else if (req.user.role === 'staff') {
                const staffResult = await pool.request()
                    .input('user_id', sql.Int, req.user.userId)
                    .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');
                if (staffResult.recordset[0] && staffResult.recordset[0].staff_id === appointment.staff_id) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                return res.status(403).json({ success: false, message: 'You are not authorized to reschedule this appointment' });
            }

            const taken = await AppointmentModel.isSlotTaken(appointment.staff_id, appointmentDate, startTime);
            if (taken) {
                return res.status(409).json({ success: false, message: 'This time slot is already booked. Please select another.' });
            }

            const updated = await AppointmentModel.reschedule(parseInt(id), {
                appointmentDate,
                startTime,
                endTime,
                reason: reason || 'Rescheduled by user'
            });

            await NotificationModel.create({
                userId: appointment.student_user_id,
                appointmentId: parseInt(id),
                title: 'Appointment Rescheduled',
                message: `Your appointment has been rescheduled to ${appointmentDate} at ${startTime}.`,
                type: 'appointment_rescheduled'
            });

            await NotificationModel.create({
                userId: appointment.staff_user_id,
                appointmentId: parseInt(id),
                title: 'Appointment Rescheduled',
                message: `An appointment has been rescheduled to ${appointmentDate} at ${startTime}.`,
                type: 'appointment_rescheduled'
            });

            await logAction(req.user.userId, 'APPOINTMENT_RESCHEDULED', 'appointments', parseInt(id), req);

            return res.status(200).json({ success: true, message: 'Appointment rescheduled successfully', data: { appointment: updated } });

        } catch (error) {
            console.error('Reschedule appointment error:', error);
            return res.status(500).json({ success: false, message: 'Error rescheduling appointment' });
        }
    }

    static async markAttendance(req, res) {
        try {
            const { id } = req.params;
            const { meetingStatus } = req.body;

            if (!['attended', 'missed'].includes(meetingStatus)) {
                return res.status(400).json({ success: false, message: 'meetingStatus must be "attended" or "missed"' });
            }

            const appointment = await AppointmentModel.findById(parseInt(id));
            if (!appointment) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }

            // NEW: Check if today is the appointment date - prevents early/late marking
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const appointmentDate = new Date(appointment.appointment_date);
            appointmentDate.setHours(0, 0, 0, 0);

            if (appointmentDate.getTime() !== today.getTime()) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Attendance can only be marked on the day of the appointment' 
                });
            }

            if (req.user.role !== 'staff') {
                return res.status(403).json({ success: false, message: 'Only staff can mark attendance' });
            }

            const pool = getPool();
            const staffResult = await pool.request()
                .input('user_id', sql.Int, req.user.userId)
                .query('SELECT staff_id FROM staff_profiles WHERE user_id = @user_id');

            if (!staffResult.recordset[0] || staffResult.recordset[0].staff_id !== appointment.staff_id) {
                return res.status(403).json({ success: false, message: 'You can only mark attendance for your own appointments' });
            }

            if (appointment.status !== 'confirmed') {
                return res.status(400).json({ success: false, message: 'Only confirmed appointments can be marked for attendance' });
            }

            // Check if already marked
            if (appointment.meeting_status !== 'pending') {
                return res.status(400).json({ 
                    success: false, 
                    message: `This appointment is already marked as ${appointment.meeting_status}` 
                });
            }

            const updated = await AppointmentModel.updateMeetingStatus(parseInt(id), meetingStatus);

            const statusText = meetingStatus === 'attended' ? 'attended' : 'missed';
            
            // Update notification type to use allowed values
            await NotificationModel.create({
                userId: appointment.student_user_id,
                appointmentId: parseInt(id),
                title: `Appointment ${statusText === 'attended' ? 'Completed' : 'Missed'}`,
                message: `Your appointment on ${appointment.appointment_date} at ${appointment.start_time} was marked as ${statusText}.`,
                type: 'appointment_confirmed' // Use existing allowed type
            });

            await logAction(req.user.userId, `APPOINTMENT_${meetingStatus.toUpperCase()}`, 'appointments', parseInt(id), req);

            return res.status(200).json({ success: true, message: `Appointment marked as ${meetingStatus}`, data: { appointment: updated } });

        } catch (error) {
            console.error('Mark attendance error:', error);
            return res.status(500).json({ success: false, message: 'Error marking attendance' });
        }
    }
}

module.exports = AppointmentController;