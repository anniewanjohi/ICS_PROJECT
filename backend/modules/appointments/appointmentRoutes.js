// modules/appointments/appointmentRoutes.js
const express = require('express');
const AppointmentController = require('./appointmentController');
const AuthMiddleware = require('../authentication/authMiddleware');

const router = express.Router();

router.use(AuthMiddleware.protect);

// Get available slots for a staff member
router.get('/slots/:staffId', AppointmentController.getSlots);

// Book an appointment (students only)
router.post('/', AuthMiddleware.restrictTo('student'), AppointmentController.book);

// Get own appointments (students see theirs, staff see theirs)
router.get('/my', AppointmentController.getMyAppointments);

// Staff responds to a booking
router.patch('/:id/respond', AuthMiddleware.restrictTo('staff'), AppointmentController.respond);

// Student cancels their booking
router.patch('/:id/cancel', AuthMiddleware.restrictTo('student'), AppointmentController.cancel);

module.exports = router;
