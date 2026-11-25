const BloodRequest = require('../models/BloodRequest');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const { allocateBloodUnitsFEFO, checkStockThresholdsAndAlert } = require('../services/inventoryService');
const { recordDemandEvent } = require('../services/demandService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { findIntelligentMatches, getCompatibleDonorGroups } = require('../services/matchingService');
const {
  validateIndianPhone,
  findCompatibleDonors,
  broadcastEmergencyAlert
} = require('../services/emergencyDonorService');
const { REQUEST_STATUS, ROLES, REQUEST_URGENCY } = require('../config/constants');
const { getAuthenticatedHospital } = require('../utils/authHelpers');

// Calculate priority score for queue ranking
const calculatePriorityScore = (urgency, createdAt) => {
  let urgencyWeight = 10;
  if (urgency === 'URGENT') urgencyWeight = 50;
  if (urgency === 'CRITICAL' || urgency === 'EMERGENCY') urgencyWeight = 100;

  const hoursPending = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60));
  return urgencyWeight + hoursPending * 2;
};

// @desc    Get all requests sorted by Priority Queue Score or Date
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res, next) => {
  try {
    const { status, urgency, bloodGroup, component, search, sortByPriority } = req.query;
    const query = {};

    if (req.user.role === ROLES.HOSPITAL || req.user.role === 'AUTHORIZED_BLOOD_BANK') {
      const hospitalProfile = await getAuthenticatedHospital(req);
      if (hospitalProfile) {
        query.hospitalId = hospitalProfile._id;
      }
    } else if (req.user.role === 'RECIPIENT') {
      query.requesterId = req.user._id;
    }

    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (component) query.component = component;

    let requests = await BloodRequest.find(query)
      .populate('hospitalId', 'hospitalName registrationNumber phone email city')
      .populate('approvedBy', 'name email')
      .populate('fulfilledUnits')
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      requests = requests.filter(r =>
        r.patientReference.toLowerCase().includes(searchLower) ||
        (r.hospitalId && r.hospitalId.hospitalName && r.hospitalId.hospitalName.toLowerCase().includes(searchLower)) ||
        (r.hospitalName && r.hospitalName.toLowerCase().includes(searchLower))
      );
    }

    const requestsWithPriority = requests.map(r => ({
      ...r.toObject(),
      priorityScore: calculatePriorityScore(r.urgency, r.createdAt),
      availableDonorsCount: (r.respondingDonors || []).filter(
        d => d.response === 'I_CAN_DONATE' || d.response === 'WILL_DONATE'
      ).length
    }));

    if (sortByPriority === 'true') {
      requestsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    res.json({
      success: true,
      count: requestsWithPriority.length,
      requests: requestsWithPriority
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active emergency SOS requests
// @route   GET /api/requests/emergency/active
// @access  Private (All authenticated roles)
const getActiveEmergencies = async (req, res, next) => {
  try {
    const { urgency, status, bloodGroup } = req.query;
    const query = {
      status: {
        $in: [
          REQUEST_STATUS.PENDING,
          REQUEST_STATUS.DONORS_FOUND,
          REQUEST_STATUS.APPROVED
        ]
      }
    };

    if (urgency) query.urgency = urgency;
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name email phone college department')
      .populate('hospitalId', 'hospitalName phone city')
      .sort({ createdAt: -1 });

    let currentDonor = null;
    if (req.user.role === ROLES.DONOR) {
      currentDonor = await Donor.findOne({ userId: req.user._id });
    }

    const emergencies = requests.map(r => {
      const rObj = r.toObject();
      const availableDonors = (r.respondingDonors || []).filter(
        d => d.response === 'I_CAN_DONATE' || d.response === 'WILL_DONATE'
      );
      const unavailableDonors = (r.respondingDonors || []).filter(
        d => d.response === 'UNAVAILABLE'
      );

      let myResponse = null;
      let isCompatible = false;

      if (currentDonor) {
        const existing = (r.respondingDonors || []).find(
          d => (d.userId && d.userId.toString() === req.user._id.toString()) ||
               (d.donorId && d.donorId.toString() === currentDonor._id.toString())
        );
        if (existing) myResponse = existing;

        const compatibleGroups = getCompatibleDonorGroups(r.bloodGroup, r.component);
        isCompatible = compatibleGroups.includes(currentDonor.bloodGroup);
      }

      return {
        ...rObj,
        priorityScore: calculatePriorityScore(r.urgency, r.createdAt),
        availableDonorsCount: availableDonors.length,
        unavailableDonorsCount: unavailableDonors.length,
        myResponse,
        isCompatible
      };
    });

    res.json({
      success: true,
      count: emergencies.length,
      emergencies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single blood request
// @route   GET /api/requests/:id
// @access  Private
const getRequestById = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('hospitalId')
      .populate('approvedBy', 'name email')
      .populate('fulfilledUnits')
      .populate('requesterId', 'name email phone college');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    res.json({ success: true, request });
  } catch (error) { next(error); }
};

// @desc    Get intelligent matches for a blood request (inventory-level)
// @route   GET /api/requests/:id/matches
// @access  Private
const getRequestMatches = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate('hospitalId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const matches = await findIntelligentMatches({
      bloodGroup: request.bloodGroup,
      component: request.component,
      requiredQuantity: request.quantity,
      city: request.hospitalId ? request.hospitalId.city : null
    });

    res.json({
      success: true,
      request,
      matches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get compatible campus donors for an emergency request
// @route   GET /api/requests/:id/matching-donors
// @access  Private
const getRequestMatchingDonors = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const matchData = await findCompatibleDonors({
      bloodGroup: request.bloodGroup,
      component: request.component,
      college: request.college
    });

    res.json({
      success: true,
      request,
      ...matchData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new blood request / Emergency SOS
// @route   POST /api/requests
// @access  Private (Campus Admin, Recipient, Hospital, Admin)
const createBloodRequest = async (req, res, next) => {
  try {
    const {
      patientReference,
      bloodGroup,
      component = 'Whole Blood',
      quantity = 1,
      urgency = 'NORMAL',
      requiredDate,
      reason,
      notes,
      hospitalName,
      contactPerson,
      contactPhone,
      campusLocation
    } = req.body;

    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required' });
    }

    if (!patientReference) {
      return res.status(400).json({ success: false, message: 'Patient reference or identifier is required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1 unit' });
    }

    // Validate Indian Phone Number
    const rawPhone = contactPhone || req.user.phone || '';
    if (rawPhone && !validateIndianPhone(rawPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Indian mobile number (10 digits starting with 6-9, or +91)'
      });
    }

    let hospitalProfile = null;
    if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(req.user.role)) {
      hospitalProfile = await getAuthenticatedHospital(req);
    }

    const resolvedHospitalName = hospitalProfile
      ? hospitalProfile.hospitalName
      : (hospitalName || req.user.college || 'Campus Health Centre');
    const resolvedContact = rawPhone || (hospitalProfile ? hospitalProfile.phone : req.user.phone || '');
    const resolvedContactPerson = contactPerson || req.user.name || 'Emergency Coordinator';

    const bloodRequest = await BloodRequest.create({
      hospitalId: hospitalProfile ? hospitalProfile._id : null,
      requesterId: req.user._id,
      hospitalName: resolvedHospitalName,
      contactPerson: resolvedContactPerson,
      contactPhone: resolvedContact,
      college: req.user.college || 'National Institute of Technology',
      campusLocation: campusLocation || '',
      patientReference: patientReference.trim(),
      bloodGroup,
      component,
      quantity: Number(quantity) || 1,
      urgency: urgency || 'NORMAL',
      requiredDate: requiredDate ? new Date(requiredDate) : new Date(),
      reason: reason || notes || 'Campus Emergency Blood Requirement',
      notes: notes || reason || '',
      status: REQUEST_STATUS.PENDING
    });

    await recordDemandEvent({
      bloodGroup,
      component,
      requested: Number(quantity) || 1,
      emergency: (urgency === 'CRITICAL' || urgency === 'EMERGENCY' || urgency === 'URGENT') ? 1 : 0
    });

    await notifyAdmins({
      type: 'REQUEST_CREATED',
      title: `${(urgency === 'CRITICAL' || urgency === 'EMERGENCY') ? '🚨 CRITICAL SOS' : (urgency === 'URGENT' ? '⚡ URGENT' : 'New')} Blood Request: ${bloodGroup}`,
      message: `${resolvedHospitalName} requested ${quantity} unit(s) of ${bloodGroup} (${component}). Priority: ${urgency}. Reason: ${reason || notes || 'N/A'}. Contact: ${resolvedContact}`,
      relatedId: bloodRequest._id.toString()
    });

    // Auto-trigger Smart Donor Matching & Broadcast for Urgent/Critical emergencies
    let emergencyBroadcast = null;
    if (['URGENT', 'CRITICAL', 'EMERGENCY'].includes(urgency)) {
      emergencyBroadcast = await broadcastEmergencyAlert({
        requestId: bloodRequest._id,
        bloodGroup,
        component,
        requiredQuantity: Number(quantity) || 1,
        hospitalName: resolvedHospitalName,
        campusLocation: campusLocation || '',
        reason: reason || notes || 'Urgent campus blood request',
        urgency,
        college: req.user.college
      });

      bloodRequest.notifiedDonorsCount = emergencyBroadcast.notifiedCount || 0;
      bloodRequest.matchedDonorsCount = emergencyBroadcast.eligibleDonorsFound || 0;

      if (emergencyBroadcast.eligibleDonorsFound > 0) {
        bloodRequest.status = REQUEST_STATUS.DONORS_FOUND;
      }
      await bloodRequest.save();
    }

    res.status(201).json({
      success: true,
      message: (urgency === 'CRITICAL' || urgency === 'EMERGENCY' || urgency === 'URGENT')
        ? 'Emergency SOS broadcasted successfully to compatible campus donors'
        : 'Blood request submitted successfully',
      request: bloodRequest,
      emergencyBroadcast
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Donor responds to Emergency Blood Request (I Can Donate / Unavailable)
// @route   POST /api/requests/:id/respond
// @access  Private (Donor)
const respondToRequest = async (req, res, next) => {
  try {
    const { response, notes } = req.body;
    const validResponses = ['I_CAN_DONATE', 'WILL_DONATE', 'UNAVAILABLE'];
    if (!response || !validResponses.includes(response)) {
      return res.status(400).json({
        success: false,
        message: "Invalid response option. Allowed options: 'I_CAN_DONATE', 'UNAVAILABLE'"
      });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    if (request.status === REQUEST_STATUS.FULFILLED || request.status === REQUEST_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: `This blood request is already ${request.status.toLowerCase()}`
      });
    }

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(400).json({
        success: false,
        message: 'No donor profile found for your account'
      });
    }

    const standardizedResponse = (response === 'WILL_DONATE' || response === 'I_CAN_DONATE')
      ? 'I_CAN_DONATE'
      : 'UNAVAILABLE';

    // Prevent duplicate response by updating existing or pushing new
    const existingIndex = request.respondingDonors.findIndex(
      r => (r.userId && r.userId.toString() === req.user._id.toString()) ||
           (r.donorId && r.donorId.toString() === donor._id.toString())
    );

    let recordedResponse;
    if (existingIndex >= 0) {
      request.respondingDonors[existingIndex].response = standardizedResponse;
      request.respondingDonors[existingIndex].notes = notes !== undefined ? notes : request.respondingDonors[existingIndex].notes;
      request.respondingDonors[existingIndex].respondedAt = new Date();
      recordedResponse = request.respondingDonors[existingIndex];
    } else {
      recordedResponse = {
        donorId: donor._id,
        userId: req.user._id,
        donorName: req.user.name,
        donorPhone: donor.phone || req.user.phone || '',
        bloodGroup: donor.bloodGroup,
        response: standardizedResponse,
        notes: notes || '',
        respondedAt: new Date()
      };
      request.respondingDonors.push(recordedResponse);
    }

    // Advance status to DONORS_FOUND if at least one donor can donate and currently PENDING
    if (standardizedResponse === 'I_CAN_DONATE') {
      if (request.status === REQUEST_STATUS.PENDING) {
        request.status = REQUEST_STATUS.DONORS_FOUND;
      }

      // Notify requester in-app
      if (request.requesterId && request.requesterId.toString() !== req.user._id.toString()) {
        await createNotification({
          userId: request.requesterId,
          type: 'DONOR_RESPONDED',
          title: '🟢 Donor Available for Blood Request!',
          message: `${req.user.name} (${donor.bloodGroup}) confirmed "I Can Donate" for request ${request.patientReference} at ${request.hospitalName}. Phone: ${donor.phone || req.user.phone || 'Available in SOS dashboard'}`,
          relatedId: request._id.toString(),
          preventDuplicate: false
        });
      }

      // Notify admins / campus admins
      await notifyAdmins({
        type: 'DONOR_RESPONDED',
        title: `Donor Responded: ${request.patientReference}`,
        message: `${req.user.name} (${donor.bloodGroup}) responded "I Can Donate" for emergency blood request ${request.patientReference} (${request.bloodGroup}).`,
        relatedId: request._id.toString(),
        college: request.college,
        preventDuplicate: false
      });
    }

    await request.save();

    res.json({
      success: true,
      message: standardizedResponse === 'I_CAN_DONATE'
        ? 'Thank you! Your response "I Can Donate" has been registered.'
        : 'Your response "Not Available" has been registered.',
      request,
      myResponse: recordedResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve blood request
// @route   PATCH /api/requests/:id/approve
// @access  Private (Admin, Campus Admin, Hospital)
const approveRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate('hospitalId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== REQUEST_STATUS.PENDING && request.status !== REQUEST_STATUS.DONORS_FOUND) {
      return res.status(400).json({ success: false, message: `Cannot approve request with status '${request.status}'` });
    }

    request.status = REQUEST_STATUS.APPROVED;
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    if (request.requesterId) {
      await createNotification({
        userId: request.requesterId,
        type: 'REQUEST_APPROVED',
        title: 'Blood Request Approved',
        message: `Your request for ${request.quantity} unit(s) of ${request.bloodGroup} (${request.component}) has been approved.`,
        relatedId: request._id.toString()
      });
    }

    res.json({
      success: true,
      message: 'Request approved successfully',
      request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject blood request
// @route   PATCH /api/requests/:id/reject
// @access  Private (Admin, Hospital)
const rejectRequest = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === REQUEST_STATUS.FULFILLED || request.status === REQUEST_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: `Cannot reject request with status '${request.status}'` });
    }

    request.status = REQUEST_STATUS.REJECTED;
    request.rejectionReason = rejectionReason;
    await request.save();

    await recordDemandEvent({
      bloodGroup: request.bloodGroup,
      component: request.component,
      rejected: request.quantity
    });

    if (request.requesterId) {
      await createNotification({
        userId: request.requesterId,
        type: 'REQUEST_REJECTED',
        title: 'Blood Request Rejected',
        message: `Your request for ${request.quantity} unit(s) of ${request.bloodGroup} was rejected. Reason: ${rejectionReason}`,
        relatedId: request._id.toString()
      });
    }

    res.json({
      success: true,
      message: 'Request rejected',
      request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fulfill blood request
// @route   PATCH /api/requests/:id/fulfill
// @access  Private (Admin, Campus Admin, Hospital, Authorized Blood Bank)
const fulfillRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status === REQUEST_STATUS.FULFILLED || request.status === REQUEST_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: `Cannot fulfill request with status '${request.status}'` });
    }

    let allocatedUnitIds = [];
    try {
      allocatedUnitIds = await allocateBloodUnitsFEFO(
        request.bloodGroup,
        request.component,
        request.quantity,
        req.user._id,
        request._id
      );
    } catch (_) {
      // In volunteer campus donor dispatch, inventory allocation is optional
      allocatedUnitIds = [];
    }

    request.status = REQUEST_STATUS.FULFILLED;
    request.fulfilledAt = new Date();
    request.fulfilledUnits = allocatedUnitIds;
    if (!request.approvedBy) request.approvedBy = req.user._id;
    if (!request.approvedAt) request.approvedAt = new Date();
    await request.save();

    await recordDemandEvent({
      bloodGroup: request.bloodGroup,
      component: request.component,
      fulfilled: request.quantity
    });

    if (request.requesterId) {
      await createNotification({
        userId: request.requesterId,
        type: 'REQUEST_FULFILLED',
        title: 'Blood Request Fulfilled! 🩸',
        message: `Your request for ${request.quantity} unit(s) of ${request.bloodGroup} (${request.component}) has been marked as fulfilled.`,
        relatedId: request._id.toString(),
        preventDuplicate: true
      });
    }

    // Notify responding donors who offered to donate
    if (Array.isArray(request.respondingDonors) && request.respondingDonors.length > 0) {
      const positiveDonors = request.respondingDonors.filter(
        d => (d.response === 'I_CAN_DONATE' || d.response === 'WILL_DONATE') && d.userId
      );
      for (const donor of positiveDonors) {
        if (donor.userId.toString() !== req.user._id.toString()) {
          await createNotification({
            userId: donor.userId,
            type: 'REQUEST_FULFILLED',
            title: `Blood Request Fulfilled: ${request.patientReference}`,
            message: `The blood requirement for ${request.bloodGroup} at ${request.hospitalName} has been fulfilled. Thank you for stepping forward to save lives on campus!`,
            relatedId: request._id.toString(),
            preventDuplicate: true
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Blood request fulfilled successfully',
      request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel request
// @route   PATCH /api/requests/:id/cancel
// @access  Private (Requester, Campus Admin, Hospital, Admin)
const cancelRequest = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only allow requester, admin or campus admin
    const isOwner = request.requesterId?.toString() === req.user._id.toString();
    const isAdmin = ['ADMIN', 'CAMPUS_ADMIN', 'HOSPITAL', 'AUTHORIZED_BLOOD_BANK', 'SUPER_ADMIN'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this request' });
    }

    if (request.status === REQUEST_STATUS.FULFILLED) {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already fulfilled request' });
    }

    request.status = REQUEST_STATUS.CANCELLED;
    await request.save();

    // Notify requester if cancelled by someone else
    if (request.requesterId && request.requesterId.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: request.requesterId,
        type: 'REQUEST_CANCELLED',
        title: `Blood Request Cancelled: ${request.patientReference}`,
        message: `Your blood request for ${request.quantity} unit(s) of ${request.bloodGroup} has been cancelled.`,
        relatedId: request._id.toString(),
        preventDuplicate: true
      });
    }

    // Notify responding donors that the request was cancelled
    if (Array.isArray(request.respondingDonors) && request.respondingDonors.length > 0) {
      const positiveDonors = request.respondingDonors.filter(
        d => (d.response === 'I_CAN_DONATE' || d.response === 'WILL_DONATE') && d.userId
      );
      for (const donor of positiveDonors) {
        if (donor.userId.toString() !== req.user._id.toString()) {
          await createNotification({
            userId: donor.userId,
            type: 'REQUEST_CANCELLED',
            title: `Emergency Standby Released: ${request.patientReference}`,
            message: `The emergency request for ${request.bloodGroup} at ${request.hospitalName} has been cancelled. Your emergency standby is released. Thank you!`,
            relatedId: request._id.toString(),
            preventDuplicate: true
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Request cancelled successfully',
      request
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
