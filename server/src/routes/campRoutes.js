const express = require('express');
const {
  getCamps,
  getCampById,
  createCamp,
  updateCamp,
  cancelCamp,
  deleteCamp,
  bookCampSlot,
  updateAttendeeStatus,
  removeAttendee
} = require('../controllers/campController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Public / Authenticated Camp Discovery
router.get('/', getCamps);
router.get('/:id', getCampById);

// Protected routes
router.use(protect);

// Camp Creation & Management
router.post('/', authorize(ROLES.CAMPUS_ADMIN, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.HOSPITAL), createCamp);
router.put('/:id', authorize(ROLES.CAMPUS_ADMIN, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.HOSPITAL), updateCamp);
router.patch('/:id/cancel', authorize(ROLES.CAMPUS_ADMIN, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.HOSPITAL), cancelCamp);
router.delete('/:id', authorize(ROLES.CAMPUS_ADMIN, ROLES.ADMIN), deleteCamp);

// Student / Faculty Camp Slot Booking
router.post('/:id/book', authorize(ROLES.DONOR), bookCampSlot);

// Attendance, Donation Recording & Queue Management
router.patch('/:id/attendees/:attendeeId', authorize(ROLES.CAMPUS_ADMIN, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.HOSPITAL), updateAttendeeStatus);
router.delete('/:id/attendees/:attendeeId', authorize(ROLES.CAMPUS_ADMIN, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.DONOR), removeAttendee);

module.exports = router;
