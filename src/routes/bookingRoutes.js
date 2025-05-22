const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Existing routes
router.route('/').get(bookingController.getAllBookings);
router.route('/available').get(bookingController.getAvailableSlots);
router.route('/create').post(bookingController.createTimeSlot);
router.route('/book').put(bookingController.bookTimeSlot);

// Add new debug email route
router.post('/debug-email', bookingController.debugEmailSetup);

// Additional useful routes
router.post('/test-email', bookingController.testEmail);
router.post('/simple-test-email', bookingController.simpleTestEmail);  // NEW LINE ADDED HERE
router.get('/creator/:creatorId', bookingController.getBookingsByCreator);
router.get('/sme/:smeId', bookingController.getBookingsBySME);
router.post('/resend-email', bookingController.resendConfirmationEmail);
router.post('/notify-survey', bookingController.notifySurveyCreation);
router.post('/cancel', bookingController.cancelBooking);

module.exports = router;