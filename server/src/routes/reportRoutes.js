const express = require('express');
const { getReportData, getCampusSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'));

router.get('/campus-summary', getCampusSummary);
router.get('/:type', getReportData);

module.exports = router;
