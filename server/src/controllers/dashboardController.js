const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const CampusCamp = require('../models/CampusCamp');
const { getDynamicStockSummary } = require('../services/inventoryService');
const { calculateDaysUntilExpiry } = require('../services/expiryService');
const { INVENTORY_STATUS, REQUEST_STATUS, ROLES, BLOOD_GROUPS, COOLDOWN_DAYS } = require('../config/constants');

// Helper to compute cooldown details
const computeCooldown = (lastDonationDate) => {
  if (!lastDonationDate) return { isUnderCooldown: false, daysRemaining: 0, cooldownDate: null };
  const cooldownDate = new Date(lastDonationDate);
  cooldownDate.setDate(cooldownDate.getDate() + (COOLDOWN_DAYS || 90));
  const diffTime = cooldownDate.getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return {
    isUnderCooldown: daysRemaining > 0,
    daysRemaining,
    cooldownDate
  };
};

// @desc    Get top dashboard summary stats based on logged in user role
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      const donors = await Donor.find().populate('userId', 'name email phone college department userType');
      const totalDonors = donors.length;
      const availableDonors = donors.filter(d => d.availabilityStatus === 'AVAILABLE' && d.eligibilityStatus === 'ELIGIBLE').length;
      const tempUnavailable = donors.filter(d => d.availabilityStatus === 'TEMP_UNAVAILABLE').length;
      const awayFromCampus = donors.filter(d => d.availabilityStatus === 'AWAY_FROM_CAMPUS').length;

      // Real blood group distribution from registered campus donors
      const donorBloodDistribution = {};
      BLOOD_GROUPS.forEach(bg => { donorBloodDistribution[bg] = 0; });
      donors.forEach(d => {
        if (donorBloodDistribution[d.bloodGroup] !== undefined) {
          donorBloodDistribution[d.bloodGroup]++;
        }
      });

      // Department breakdown
      const departmentBreakdown = {};
      donors.forEach(d => {
        const dept = d.department || 'Other';
        departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;
      });

      // Upcoming Campus Camps with capacity metrics
      const camps = await CampusCamp.find().sort({ campDate: 1 });
      const upcomingCamps = camps.filter(c => c.status === 'UPCOMING' || c.status === 'ACTIVE').map(c => {
        const totalCapacity = c.slots.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalBooked = c.slots.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        return {
          ...c.toObject(),
          totalCapacity,
          totalBooked,
          availableSpots: Math.max(0, totalCapacity - totalBooked)
        };
      });
      const totalCamps = camps.length;
      const totalCampUnitsCollected = camps.reduce((sum, c) => sum + (c.unitsCollected || 0), 0);
      const totalCampRegistrations = camps.reduce((sum, c) => sum + (c.registeredDonors ? c.registeredDonors.length : 0), 0);

      // Active Emergency Requests
      const emergencyRequests = await BloodRequest.countDocuments({
        urgency: 'EMERGENCY',
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED] }
      });
      const activeEmergencies = await BloodRequest.find({
        urgency: 'EMERGENCY',
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED] }
      }).populate('hospitalId', 'hospitalName city contactPerson phone').sort({ createdAt: -1 }).limit(5);

      const totalHospitals = await Hospital.countDocuments();
      const pendingRequests = await BloodRequest.countDocuments({ status: REQUEST_STATUS.PENDING });
      const stockSummary = await getDynamicStockSummary();
      const lowStockGroups = stockSummary.detailedMatrix.filter(m => m.status === 'LOW STOCK' || m.status === 'CRITICAL');

      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSoon = await BloodInventory.countDocuments({
        status: INVENTORY_STATUS.AVAILABLE,
        expiryDate: { $gt: now, $lte: sevenDaysFromNow }
      });

      const recentRequests = await BloodRequest.find()
        .populate('hospitalId', 'hospitalName city')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentDonations = await BloodInventory.find({ donorId: { $ne: null } })
        .populate({
          path: 'donorId',
          populate: { path: 'userId', select: 'name' }
        })
        .sort({ collectionDate: -1 })
        .limit(5);

      return res.json({
        success: true,
        role: req.user.role,
        campus: req.user.college || 'National Institute of Technology',
        kpis: {
          totalDonors,
          availableDonors,
          tempUnavailable,
          awayFromCampus,
          upcomingCampsCount: upcomingCamps.length,
          emergencyRequests,
          totalHospitals,
          availableBloodUnits: stockSummary.totalAvailableUnits,
          pendingRequests,
          expiringSoon,
          lowStockCount: lowStockGroups.length
        },
        donorBloodDistribution,
        departmentBreakdown,
        upcomingCamps,
        activeEmergencies,
        inventoryOverview: stockSummary.byBloodGroup,
        lowStockGroups,
        recentRequests,
        recentDonations
      });
    } else if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(role)) {
      const hospitalProfile = await Hospital.findOne({ userId: req.user._id });
      if (!hospitalProfile) {
        return res.status(404).json({ success: false, message: 'Authorized Blood Bank profile not found' });
      }

      const totalSubmitted = await BloodRequest.countDocuments({ hospitalId: hospitalProfile._id });
      const pendingCount = await BloodRequest.countDocuments({ hospitalId: hospitalProfile._id, status: REQUEST_STATUS.PENDING });
      const approvedCount = await BloodRequest.countDocuments({ hospitalId: hospitalProfile._id, status: REQUEST_STATUS.APPROVED });
      const fulfilledCount = await BloodRequest.countDocuments({ hospitalId: hospitalProfile._id, status: REQUEST_STATUS.FULFILLED });
      const emergencyCount = await BloodRequest.countDocuments({ hospitalId: hospitalProfile._id, urgency: 'EMERGENCY' });

      // Campus camps organized with this blood bank
      const bloodBankCamps = await CampusCamp.find({
        partnerBloodBank: { $regex: new RegExp(hospitalProfile.hospitalName, 'i') }
      }).sort({ campDate: 1 });

      const stockSummary = await getDynamicStockSummary();
      const recentRequests = await BloodRequest.find({ hospitalId: hospitalProfile._id })
        .sort({ createdAt: -1 })
        .limit(5);

      return res.json({
        success: true,
        role: req.user.role,
        hospitalProfile,
        kpis: {
          totalSubmitted,
          pendingCount,
          approvedCount,
          fulfilledCount,
          emergencyCount,
          campsCount: bloodBankCamps.length
        },
        camps: bloodBankCamps,
        availableStock: stockSummary.byBloodGroup,
        recentRequests
      });
    } else if (role === ROLES.DONOR) {
      const donorProfile = await Donor.findOne({ userId: req.user._id });
      if (!donorProfile) {
        return res.status(404).json({ success: false, message: 'Donor profile not found' });
      }

      const cd = computeCooldown(donorProfile.lastDonationDate);

      const donations = await Donation.find({ donorId: donorProfile._id })
        .populate('bloodUnitRef')
        .sort({ createdAt: -1 });

      const activeStatuses = ['DONATION_REQUESTED', 'SCHEDULED', 'CHECK_IN', 'SCREENING', 'APPROVED', 'DONATED', 'TESTING'];
      const activeDonation = await Donation.findOne({ donorId: donorProfile._id, status: { $in: activeStatuses } }).sort({ createdAt: -1 });
      const completedCount = await Donation.countDocuments({ donorId: donorProfile._id, status: 'AVAILABLE' });
      const pendingCount = await Donation.countDocuments({ donorId: donorProfile._id, status: { $in: activeStatuses } });

      // Upcoming camps in the student's campus with registration check
      const rawCamps = await CampusCamp.find({
        status: { $in: ['UPCOMING', 'ACTIVE'] }
      }).sort({ campDate: 1 }).limit(5);

      const upcomingCamps = rawCamps.map(c => {
        const myReg = c.registeredDonors.find(
          r => (r.donorId && r.donorId.toString() === donorProfile._id.toString()) ||
               (r.userId && r.userId.toString() === req.user._id.toString())
        );
        const totalCapacity = c.slots.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalBooked = c.slots.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
        return {
          ...c.toObject(),
          isRegistered: Boolean(myReg),
          registeredSlot: myReg ? myReg.slotTime : null,
          totalCapacity,
          totalBooked,
          availableSpots: Math.max(0, totalCapacity - totalBooked)
        };
      });

      // Active emergencies for compatible/same blood group
      const activeEmergencies = await BloodRequest.find({
        urgency: 'EMERGENCY',
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED] }
      }).populate('hospitalId', 'hospitalName city phone').sort({ createdAt: -1 }).limit(3);

      return res.json({
        success: true,
        role: 'DONOR',
        donorProfile: {
          ...donorProfile.toObject(),
          cooldownDaysRemaining: cd.daysRemaining,
          isUnderCooldown: cd.isUnderCooldown
        },
        kpis: {
          bloodGroup: donorProfile.bloodGroup,
          availabilityStatus: donorProfile.availabilityStatus || 'AVAILABLE',
          totalDonations: Math.max(donorProfile.totalDonations || 0, completedCount),
          lastDonationDate: donorProfile.lastDonationDate,
          eligibilityStatus: cd.isUnderCooldown ? 'COOLDOWN' : donorProfile.eligibilityStatus,
          cooldownDaysRemaining: cd.daysRemaining,
          isUnderCooldown: cd.isUnderCooldown,
          college: donorProfile.college,
          department: donorProfile.department,
          completedCount,
          pendingCount
        },
        upcomingCamps,
        activeEmergencies,
        activeDonation,
        donations,
        donationHistory: donations
      });
    } else if (role === 'RECIPIENT') {
      const myRequests = await BloodRequest.find({ requesterId: req.user._id }).sort({ createdAt: -1 });
      const pendingRequests = myRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length;
      const fulfilledRequests = myRequests.filter(r => r.status === REQUEST_STATUS.FULFILLED).length;
      const activeEmergencies = await BloodRequest.find({
        urgency: 'EMERGENCY',
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED] }
      }).sort({ createdAt: -1 }).limit(5);

      return res.json({
        success: true,
        role: 'RECIPIENT',
        kpis: {
          totalRequests: myRequests.length,
          pendingRequests,
          fulfilledRequests
        },
        myRequests,
        activeEmergencies
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary
};
