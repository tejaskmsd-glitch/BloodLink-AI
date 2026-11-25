const Donor = require('../models/Donor');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const {
  generateRegistrationConfirmationPDF,
  generateDonationReceiptPDF,
  generateCertificatePDF
} = require('../utils/pdfGenerator');

// @desc    Get all available documents for the authenticated donor
// @route   GET /api/documents/my-documents
// @access  Private (Donor)
const getMyDocuments = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id }).populate('userId');
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor profile not found. Please complete donor registration first.'
      });
    }

    const documents = [];

    // 1. Donor Registration Confirmation (Always available for every registered donor)
    const donorIdStr = String(donor._id).slice(-8).toUpperCase();
    const regRef = `BLD-REG-${new Date(donor.createdAt || Date.now()).getFullYear()}-${String(donor._id).slice(-6).toUpperCase()}`;

    documents.push({
      id: `reg-${donor._id}`,
      type: 'REGISTRATION_CONFIRMATION',
      title: 'Donor Registration Confirmation',
      reference: regRef,
      issueDate: donor.createdAt || new Date(),
      status: 'VERIFIED',
      downloadUrl: '/api/documents/registration',
      filename: `BloodLink_Donor_Registration_${donorIdStr}.pdf`,
      description: 'Official confirmation of your voluntary enrollment in the Smart Campus Donor Registry.'
    });

    // 2. Verified Blood Donations (Receipt & Certificate for each completed donation)
    const verifiedDonations = await Donation.find({
      donorId: donor._id,
      status: { $in: ['DONATED', 'AVAILABLE'] }
    })
      .populate('hospitalId', 'hospitalName city')
      .sort({ createdAt: -1 });

    verifiedDonations.forEach((donation) => {
      const donationId = donation.donationId || String(donation._id).slice(-8).toUpperCase();
      const receiptRef = donation.receiptNumber || `RCP-2026-${String(donationId).slice(-6)}`;
      const certRef = donation.certificateNumber || `CERT-2026-${String(donationId).slice(-6)}`;

      // Donation Receipt
      documents.push({
        id: `rcp-${donation._id}`,
        donationId: donation._id,
        donationRef: donationId,
        type: 'DONATION_RECEIPT',
        title: 'Blood Donation Receipt',
        reference: receiptRef,
        issueDate: donation.createdAt || new Date(),
        status: 'COMPLETED & VERIFIED',
        downloadUrl: `/api/documents/receipt/${donation._id}`,
        filename: `BloodLink_Donation_Receipt_${donationId}.pdf`,
        description: `Official verified receipt for 1 unit of ${donation.bloodGroup} ${donation.donationType || 'Whole Blood'}.`
      });

      // Certificate of Appreciation
      documents.push({
        id: `cert-${donation._id}`,
        donationId: donation._id,
        donationRef: donationId,
        type: 'CERTIFICATE_OF_APPRECIATION',
        title: 'Certificate of Appreciation',
        reference: certRef,
        issueDate: donation.createdAt || new Date(),
        status: 'AWARDED',
        downloadUrl: `/api/documents/certificate/${donation._id}`,
        filename: `BloodLink_Certificate_${donationId}.pdf`,
        description: 'Prestigious certificate recognizing your life-saving voluntary blood donation on campus.'
      });
    });

    res.json({
      success: true,
      count: documents.length,
      verifiedDonationCount: verifiedDonations.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download Donor Registration Confirmation PDF
// @route   GET /api/documents/registration (or /api/documents/registration/:donorId)
// @access  Private (Donor or Admin)
const downloadRegistrationConfirmation = async (req, res, next) => {
  try {
    let donor = null;

    if (req.params.donorId) {
      // Admin / Staff lookup by donor ID
      if (req.user.role === ROLES.DONOR) {
        // Donor can only request their own donor profile
        const myDonor = await Donor.findOne({ userId: req.user._id });
        if (!myDonor || myDonor._id.toString() !== req.params.donorId) {
          return res.status(403).json({ success: false, message: 'You are only authorized to access your own documents.' });
        }
        donor = myDonor;
      } else {
        donor = await Donor.findById(req.params.donorId);
      }
    } else {
      // Default: Logged-in donor profile
      donor = await Donor.findOne({ userId: req.user._id });
    }

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor record not found.' });
    }

    const user = await User.findById(donor.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account associated with donor not found.' });
    }

    const donorIdStr = String(donor._id).slice(-8).toUpperCase();
    const filename = `BloodLink_Donor_Registration_${donorIdStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateRegistrationConfirmationPDF(donor, user, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Download Blood Donation Receipt PDF
// @route   GET /api/documents/receipt/:donationId
// @access  Private (Donor, Admin, Hospital)
const downloadDonationReceipt = async (req, res, next) => {
  try {
    let donation = await Donation.findById(req.params.donationId)
      .populate('hospitalId')
      .populate('donorId');

    // Also support querying by human-readable donationId (e.g. DON-2026-XXXXX)
    if (!donation) {
      donation = await Donation.findOne({ donationId: req.params.donationId })
        .populate('hospitalId')
        .populate('donorId');
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Blood donation record not found.' });
    }

    // Security check: Donor can only access their own donations
    if (req.user.role === ROLES.DONOR) {
      if (donation.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view or download receipts for this donation.'
        });
      }
    }

    // Hospital user: Can only access donations targeting their hospital
    if (req.user.role === ROLES.HOSPITAL) {
      if (donation.hospitalId?._id?.toString() !== req.user._id?.toString() && donation.hospitalId?.userId?.toString() !== req.user._id?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only view receipts for donations collected at your hospital facility.'
        });
      }
    }

    // Strict Medical Verification Gate:
    // Only generate receipt if donation is COMPLETED and VERIFIED (status DONATED or AVAILABLE)
    if (!['DONATED', 'AVAILABLE'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Donation receipt cannot be generated. Current status is '${donation.status}'. Receipts are only issued after a donation has been completed and verified by authorized medical staff.`
      });
    }

    const user = await User.findById(donation.userId);
    const donor = donation.donorId || (await Donor.findOne({ userId: donation.userId }));

    const donationIdStr = donation.donationId || String(donation._id).slice(-8).toUpperCase();
    const filename = `BloodLink_Donation_Receipt_${donationIdStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateDonationReceiptPDF(donation, donor, user || {}, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Download Certificate of Appreciation PDF
// @route   GET /api/documents/certificate/:donationId
// @access  Private (Donor, Admin, Hospital)
const downloadCertificate = async (req, res, next) => {
  try {
    let donation = await Donation.findById(req.params.donationId)
      .populate('hospitalId')
      .populate('donorId');

    if (!donation) {
      donation = await Donation.findOne({ donationId: req.params.donationId })
        .populate('hospitalId')
        .populate('donorId');
    }

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Blood donation record not found.' });
    }

    // Security check: Donor can only access their own certificate
    if (req.user.role === ROLES.DONOR) {
      if (donation.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view or download certificates for this donation.'
        });
      }
    }

    // Strict Medical Verification Gate:
    if (!['DONATED', 'AVAILABLE'].includes(donation.status)) {
      return res.status(400).json({
        success: false,
        message: `Certificate of Appreciation cannot be issued. Current status is '${donation.status}'. Certificates are only awarded after voluntary blood collection is verified by staff.`
      });
    }

    const user = await User.findById(donation.userId);
    const donor = donation.donorId || (await Donor.findOne({ userId: donation.userId }));

    const donationIdStr = donation.donationId || String(donation._id).slice(-8).toUpperCase();
    const filename = `BloodLink_Certificate_${donationIdStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateCertificatePDF(donation, donor, user || {}, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDocuments,
  downloadRegistrationConfirmation,
  downloadDonationReceipt,
  downloadCertificate
};
