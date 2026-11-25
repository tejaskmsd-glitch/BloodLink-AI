const express = require('express');
const {
  getDonors,
  getDonorById,
  getMyProfile,
  updateMyProfile,
  createDonor,
  updateDonor,
  deleteDonor
} = require('../controllers/donorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.route('/profile/me')
  .get(getMyProfile)
  .put(updateMyProfile);

router.route('/')
  .get(authorize('ADMIN', 'CAMPUS_ADMIN'), getDonors)
  .post(authorize('ADMIN', 'CAMPUS_ADMIN'), createDonor);

router.route('/:id')
  .get(getDonorById)
  .put(updateDonor)
  .delete(authorize('ADMIN', 'CAMPUS_ADMIN'), deleteDonor);

module.exports = router;
