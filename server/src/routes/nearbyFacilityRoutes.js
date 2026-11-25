const express = require('express');
const {
  getDefaultCampus,
  geocodeLocation,
  searchNearbyFacilities
} = require('../controllers/nearbyFacilityController');

const router = express.Router();

// Public routes for campus discovery
router.get('/default-campus', getDefaultCampus);
router.get('/geocode', geocodeLocation);
router.get('/search', searchNearbyFacilities);

module.exports = router;
