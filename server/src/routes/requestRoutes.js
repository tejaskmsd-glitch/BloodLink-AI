const express = require('express');
const {
  getRequests,
  getActiveEmergencies,
  getRequestById,
  getRequestMatches,
  getRequestMatchingDonors,
  createBloodRequest,
  respondToRequest,
  approveRequest,
  rejectRequest,
  fulfillRequest,
  cancelRequest
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Emergency active requests (Must be before /:id)
router.get('/emergency/active', getActiveEmergencies);

router.route('/')
  .get(getRequests)
  .post(
    authorize(ROLES.HOSPITAL, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.RECIPIENT),
    createBloodRequest
  );

router.get('/:id/matches', getRequestMatches);
router.get('/:id/matching-donors', getRequestMatchingDonors);

// Donor response to emergency SOS ("I Can Donate" / "Unavailable")
router.post('/:id/respond', authorize(ROLES.DONOR), respondToRequest);

router.route('/:id')
  .get(getRequestById);

router.patch(
  '/:id/approve',
  authorize(ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HOSPITAL, ROLES.AUTHORIZED_BLOOD_BANK),
  approveRequest
);
router.patch(
  '/:id/reject',
  authorize(ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HOSPITAL, ROLES.AUTHORIZED_BLOOD_BANK),
  rejectRequest
);
router.patch(
  '/:id/fulfill',
  authorize(ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HOSPITAL, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.RECIPIENT),
  fulfillRequest
);
router.patch(
  '/:id/cancel',
  authorize(ROLES.ADMIN, ROLES.CAMPUS_ADMIN, ROLES.HOSPITAL, ROLES.AUTHORIZED_BLOOD_BANK, ROLES.RECIPIENT),
  cancelRequest
);

module.exports = router;
