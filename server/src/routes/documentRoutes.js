const express = require('express');
const {
  getMyDocuments,
  downloadRegistrationConfirmation,
  downloadDonationReceipt,
  downloadCertificate
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Document listings for logged-in donor
router.get('/my-documents', getMyDocuments);

// Document download routes
router.get('/registration', downloadRegistrationConfirmation);
router.get('/registration/:donorId', downloadRegistrationConfirmation);
router.get('/receipt/:donationId', downloadDonationReceipt);
router.get('/certificate/:donationId', downloadCertificate);

module.exports = router;
