const express = require('express');
const { getHospitals, getHospitalById, createHospital, updateHospital } = require('../controllers/hospitalController');
const { getDefaultCampus, geocodeLocation, searchNearbyFacilities } = require('../controllers/nearbyFacilityController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public discovery endpoints for nearby facilities
router.get('/default-campus', getDefaultCampus);
router.get('/geocode', geocodeLocation);
router.get('/nearby', searchNearbyFacilities);

// Protected routes
router.use(protect);

router.route('/')
  .get(getHospitals)
  .post(authorize('ADMIN'), createHospital);

router.route('/:id')
  .get(getHospitalById)
  .put(updateHospital);

module.exports = router;
