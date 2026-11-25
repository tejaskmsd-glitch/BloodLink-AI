const Donor = require('../models/Donor');
const User = require('../models/User');
const { getCompatibleDonorGroups } = require('./matchingService');
const { createNotification } = require('./notificationService');

/**
 * Validate standard Indian mobile phone numbers.
 * Supports: +91 9876543210, 9876543210, +91-9876543210, etc.
 */
const validateIndianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[\s\-]/g, '');
  const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleaned);
};

/**
 * Find compatible campus donors based on blood compatibility, availability, and cooldown.
 * Note: Preliminary matching only. Final medical compatibility and donation approval
 * must be verified by certified blood bank medical staff.
 */
const findCompatibleDonors = async ({ bloodGroup, component = 'Whole Blood', college = null }) => {
  try {
    const compatibleGroups = getCompatibleDonorGroups(bloodGroup, component);
    const now = new Date();

    // Query active available donors matching compatible groups and not in cooldown
    const donors = await Donor.find({
      bloodGroup: { $in: compatibleGroups },
      availabilityStatus: 'AVAILABLE',
      $or: [
        { eligibilityStatus: 'ELIGIBLE' },
        { cooldownUntil: { $lte: now } },
        { cooldownUntil: null }
      ]
    }).populate('userId', 'name email phone college department userType isActive');

    // Filter active and eligible donors
    const eligibleDonors = donors.filter(d => {
      if (!d.userId || d.userId.isActive === false) return false;
      // Double check cooldown date if present
      if (d.cooldownUntil && new Date(d.cooldownUntil) > now) return false;
      return true;
    });

    // Sort by same campus first, then by donation cooldown availability
    eligibleDonors.sort((a, b) => {
      const aSameCollege = (a.college || a.userId?.college) === college ? 1 : 0;
      const bSameCollege = (b.college || b.userId?.college) === college ? 1 : 0;
      return bSameCollege - aSameCollege;
    });

    const matchingDonors = eligibleDonors.map(d => ({
      _id: d._id,
      userId: d.userId?._id,
      name: d.userId?.name || 'Campus Donor',
      phone: d.phone || d.userId?.phone || '',
      bloodGroup: d.bloodGroup,
      college: d.college || d.userId?.college || '',
      department: d.department || d.userId?.department || '',
      userType: d.userType || d.userId?.userType || 'STUDENT',
      hostel: d.hostel || '',
      availabilityStatus: d.availabilityStatus,
      eligibilityStatus: d.eligibilityStatus,
      lastDonationDate: d.lastDonationDate
    }));

    return {
      compatibleGroups,
      matchingDonors,
      totalCount: matchingDonors.length,
      medicalDisclaimer: 'Notice: Algorithmic donor matching is a coordination tool. Final medical clearance, vitals check, cross-matching, and donation approval must be confirmed by qualified medical staff at an authorized partner blood bank.'
    };
  } catch (error) {
    console.error('Error finding compatible donors:', error.message);
    throw error;
  }
};

/**
 * Broadcast emergency notifications to eligible campus donors.
 */
const broadcastEmergencyAlert = async ({
  requestId,
  bloodGroup,
  component = 'Whole Blood',
  requiredQuantity = 1,
  hospitalName = 'Medical Centre',
  campusLocation = '',
  reason = 'Urgent blood requirement',
  urgency = 'CRITICAL',
  college = null
}) => {
  try {
    const { compatibleGroups, matchingDonors } = await findCompatibleDonors({ bloodGroup, component, college });

    let notifiedCount = 0;
    const priorityIcon = (urgency === 'CRITICAL' || urgency === 'EMERGENCY') ? '🚨 CRITICAL' : '⚡ URGENT';

    for (const donor of matchingDonors) {
      if (donor.userId) {
        await createNotification({
          userId: donor.userId,
          type: 'EMERGENCY_ALERT',
          title: `${priorityIcon} BLOOD SOS: ${bloodGroup} Needed!`,
          message: `${priorityIcon} Emergency request from ${hospitalName}${campusLocation ? ` (${campusLocation})` : ''}: ${requiredQuantity} unit(s) of ${bloodGroup} (${component}) needed! Reason: ${reason}. Please open Emergency SOS to respond.`,
          relatedId: requestId ? requestId.toString() : donor._id.toString(),
          preventDuplicate: true
        });
        notifiedCount++;
      }
    }

    return {
      success: true,
      eligibleDonorsFound: matchingDonors.length,
      notifiedCount,
      compatibleGroups,
      matchingDonors
    };
  } catch (error) {
    console.error('Error broadcasting emergency alert:', error.message);
    throw error;
  }
};

module.exports = {
  validateIndianPhone,
  findCompatibleDonors,
  broadcastEmergencyAlert,
  notifyEmergencyDonors: broadcastEmergencyAlert
};
