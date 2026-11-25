const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const DemandRecord = require('../models/DemandRecord');
const CampusCamp = require('../models/CampusCamp');
const { getDynamicStockSummary } = require('../services/inventoryService');
const { calculateDaysUntilExpiry, getExpiryCategory } = require('../services/expiryService');

/**
 * Generate real campus blood bank analytics summary using live database queries.
 * Strict: No AI demand forecasting, no synthetic or simulated data.
 */
const getCampusSummary = async (req, res, next) => {
  try {
    const { startDate, endDate, college } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.$gte = startDate ? new Date(startDate) : new Date(0);
      dateFilter.$lte = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    }

    const donorQuery = {};
    if (college) donorQuery.college = college;
    if (startDate || endDate) donorQuery.createdAt = dateFilter;

    // 1. Donors Metrics
    const totalDonors = await Donor.countDocuments(donorQuery);
    const availableDonors = await Donor.countDocuments({ ...donorQuery, availabilityStatus: 'AVAILABLE' });
    const tempUnavailableDonors = await Donor.countDocuments({ ...donorQuery, availabilityStatus: 'TEMP_UNAVAILABLE' });
    const awayDonors = await Donor.countDocuments({ ...donorQuery, availabilityStatus: 'AWAY_FROM_CAMPUS' });
    const eligibleDonors = await Donor.countDocuments({ ...donorQuery, eligibilityStatus: 'ELIGIBLE' });

    const now = new Date();
    const inCooldownDonors = await Donor.countDocuments({
      ...donorQuery,
      cooldownUntil: { $gt: now }
    });

    // Donors Blood Group Breakdown
    const bloodGroupCounts = {};
    for (const bg of ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']) {
      bloodGroupCounts[bg] = await Donor.countDocuments({ ...donorQuery, bloodGroup: bg });
    }

    // Donors User Type Breakdown
    const userTypeCounts = {
      STUDENT: await Donor.countDocuments({ ...donorQuery, userType: 'STUDENT' }),
      FACULTY: await Donor.countDocuments({ ...donorQuery, userType: 'FACULTY' }),
      STAFF: await Donor.countDocuments({ ...donorQuery, userType: 'STAFF' }),
      OTHER: await Donor.countDocuments({ ...donorQuery, userType: 'OTHER' })
    };

    // 2. Blood Requests Metrics
    const requestQuery = {};
    if (college) requestQuery.college = college;
    if (startDate || endDate) requestQuery.createdAt = dateFilter;

    const totalRequests = await BloodRequest.countDocuments(requestQuery);
    const pendingRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'PENDING' });
    const donorsFoundRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'DONORS_FOUND' });
    const approvedRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'APPROVED' });
    const fulfilledRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'FULFILLED' });
    const cancelledRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'CANCELLED' });
    const rejectedRequests = await BloodRequest.countDocuments({ ...requestQuery, status: 'REJECTED' });

    const emergencyRequests = await BloodRequest.countDocuments({
      ...requestQuery,
      urgency: { $in: ['URGENT', 'CRITICAL', 'EMERGENCY'] }
    });
    const fulfilledEmergencyRequests = await BloodRequest.countDocuments({
      ...requestQuery,
      urgency: { $in: ['URGENT', 'CRITICAL', 'EMERGENCY'] },
      status: 'FULFILLED'
    });

    const fulfillmentRate = totalRequests > 0
      ? Math.round((fulfilledRequests / totalRequests) * 100)
      : 0;
    const emergencyFulfillmentRate = emergencyRequests > 0
      ? Math.round((fulfilledEmergencyRequests / emergencyRequests) * 100)
      : 0;

    // Units requested & fulfilled
    const allRequests = await BloodRequest.find(requestQuery).select('quantity status');
    let totalUnitsRequested = 0;
    let totalUnitsFulfilled = 0;
    allRequests.forEach(r => {
      totalUnitsRequested += Number(r.quantity) || 0;
      if (r.status === 'FULFILLED') {
        totalUnitsFulfilled += Number(r.quantity) || 0;
      }
    });

    // 3. Campus Donation Camps Metrics
    const campQuery = {};
    if (college) campQuery.college = college;
    if (startDate || endDate) campQuery.campDate = dateFilter;

    const totalCamps = await CampusCamp.countDocuments(campQuery);
    const upcomingCamps = await CampusCamp.countDocuments({ ...campQuery, status: 'UPCOMING' });
    const activeCamps = await CampusCamp.countDocuments({ ...campQuery, status: 'ACTIVE' });
    const completedCamps = await CampusCamp.countDocuments({ ...campQuery, status: 'COMPLETED' });
    const cancelledCamps = await CampusCamp.countDocuments({ ...campQuery, status: 'CANCELLED' });

    const camps = await CampusCamp.find(campQuery).select('registeredDonors unitsCollected targetUnits');
    let totalRegisteredCampDonors = 0;
    let totalCampAttendees = 0;
    let totalCampDonations = 0;
    let totalUnitsCollectedInCamps = 0;

    camps.forEach(c => {
      totalUnitsCollectedInCamps += Number(c.unitsCollected) || 0;
      if (Array.isArray(c.registeredDonors)) {
        totalRegisteredCampDonors += c.registeredDonors.length;
        c.registeredDonors.forEach(rd => {
          if (rd.attended || rd.attendanceStatus === 'ATTENDED' || rd.attendanceStatus === 'DONATED') {
            totalCampAttendees++;
          }
          if (rd.donated || rd.attendanceStatus === 'DONATED') {
            totalCampDonations++;
          }
        });
      }
    });

    // 4. Blood Inventory Units Available
    const inventoryQuery = { status: 'AVAILABLE' };
    if (startDate || endDate) inventoryQuery.createdAt = dateFilter;
    const availableInventoryUnits = await BloodInventory.countDocuments(inventoryQuery);

    const summary = {
      generatedAt: new Date(),
      filters: { startDate: startDate || null, endDate: endDate || null, college: college || null },
      donors: {
        total: totalDonors,
        available: availableDonors,
        temporarilyUnavailable: tempUnavailableDonors,
        awayFromCampus: awayDonors,
        eligible: eligibleDonors,
        inCooldown: inCooldownDonors,
        bloodGroupBreakdown: bloodGroupCounts,
        userTypeBreakdown: userTypeCounts
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        donorsFound: donorsFoundRequests,
        approved: approvedRequests,
        fulfilled: fulfilledRequests,
        cancelled: cancelledRequests,
        rejected: rejectedRequests,
        emergencyTotal: emergencyRequests,
        emergencyFulfilled: fulfilledEmergencyRequests,
        fulfillmentRate,
        emergencyFulfillmentRate,
        totalUnitsRequested,
        totalUnitsFulfilled
      },
      camps: {
        total: totalCamps,
        upcoming: upcomingCamps,
        active: activeCamps,
        completed: completedCamps,
        cancelled: cancelledCamps,
        totalRegisteredDonors: totalRegisteredCampDonors,
        totalAttendees: totalCampAttendees,
        totalDonations: totalCampDonations,
        totalUnitsCollected: totalUnitsCollectedInCamps
      },
      inventory: {
        availableUnits: availableInventoryUnits
      }
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate reports based on report type and date range filters
// @route   GET /api/reports/:type
// @access  Private (Admin, Campus Admin, Super Admin)
const getReportData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, bloodGroup, component } = req.query;

    if (type === 'campus-summary') {
      return getCampusSummary(req, res, next);
    }

    let reportTitle = '';
    let reportData = [];

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.$gte = startDate ? new Date(startDate) : new Date(0);
      dateFilter.$lte = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    }

    if (type === 'inventory') {
      reportTitle = 'Current Blood Inventory Report';
      const query = {};
      if (startDate || endDate) query.createdAt = dateFilter;
      if (bloodGroup) query.bloodGroup = bloodGroup;
      if (component) query.component = component;

      reportData = await BloodInventory.find(query)
        .populate({ path: 'donorId', populate: { path: 'userId', select: 'name' } })
        .sort({ expiryDate: 1 });

      reportData = reportData.map(u => ({
        unitId: u.unitId,
        bloodGroup: u.bloodGroup,
        component: u.component,
        quantity: u.quantity,
        collectionDate: u.collectionDate,
        expiryDate: u.expiryDate,
        storageLocation: u.storageLocation,
        status: u.status,
        donorName: u.donorId && u.donorId.userId ? u.donorId.userId.name : 'N/A'
      }));
    } else if (type === 'donations') {
      reportTitle = 'Blood Donation Report';
      const query = { donorId: { $ne: null } };
      if (startDate || endDate) query.collectionDate = dateFilter;
      if (bloodGroup) query.bloodGroup = bloodGroup;

      const donations = await BloodInventory.find(query)
        .populate({ path: 'donorId', populate: { path: 'userId', select: 'name email phone' } })
        .sort({ collectionDate: -1 });

      reportData = donations.map(d => ({
        unitId: d.unitId,
        donorName: d.donorId && d.donorId.userId ? d.donorId.userId.name : 'Unknown',
        bloodGroup: d.bloodGroup,
        component: d.component,
        quantity: d.quantity,
        collectionDate: d.collectionDate,
        storageLocation: d.storageLocation
      }));
    } else if (type === 'requests') {
      reportTitle = 'Campus Blood Requests Report';
      const query = {};
      if (startDate || endDate) query.createdAt = dateFilter;
      if (bloodGroup) query.bloodGroup = bloodGroup;
      if (component) query.component = component;

      const requests = await BloodRequest.find(query)
        .populate('hospitalId', 'hospitalName city')
        .sort({ createdAt: -1 });

      reportData = requests.map(r => ({
        requestId: r._id,
        hospitalName: r.hospitalId ? r.hospitalId.hospitalName : r.hospitalName || 'N/A',
        patientReference: r.patientReference,
        bloodGroup: r.bloodGroup,
        component: r.component,
        quantity: r.quantity,
        urgency: r.urgency,
        status: r.status,
        createdAt: r.createdAt
      }));
    } else if (type === 'demand') {
      reportTitle = 'Blood Demand & Consumption Report';
      const query = {};
      if (startDate || endDate) query.date = dateFilter;
      if (bloodGroup) query.bloodGroup = bloodGroup;

      reportData = await DemandRecord.find(query).sort({ date: -1 });
    } else if (type === 'expiry') {
      reportTitle = 'Blood Expiry Risk Report';
      const units = await BloodInventory.find({ status: { $in: ['AVAILABLE', 'EXPIRED'] } }).sort({ expiryDate: 1 });
      reportData = units
        .map(u => {
          const daysRemaining = calculateDaysUntilExpiry(u.expiryDate);
          return {
            unitId: u.unitId,
            bloodGroup: u.bloodGroup,
            component: u.component,
            quantity: u.quantity,
            expiryDate: u.expiryDate,
            daysRemaining,
            category: getExpiryCategory(daysRemaining),
            status: u.status
          };
        })
        .filter(u => u.daysRemaining <= 10 || u.status === 'EXPIRED');
    } else if (type === 'low-stock') {
      reportTitle = 'Low Stock & Replenishment Report';
      const summary = await getDynamicStockSummary();
      reportData = summary.detailedMatrix.filter(m => m.status === 'LOW STOCK' || m.status === 'CRITICAL');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type requested' });
    }

    res.json({
      success: true,
      reportType: type,
      title: reportTitle,
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCampusSummary,
  getReportData
};
