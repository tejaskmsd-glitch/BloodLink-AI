const Donor = require('../models/Donor');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const { COOLDOWN_DAYS } = require('../config/constants');

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

// @desc    Get all donors
// @route   GET /api/donors
// @access  Private (Admin / Campus Admin)
const getDonors = async (req, res, next) => {
  try {
    const { bloodGroup, eligibility, availability, department, college, search } = req.query;
    const query = {};

    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (eligibility) query.eligibilityStatus = eligibility;
    if (availability) query.availabilityStatus = availability;
    if (department) query.department = department;
    if (college) query.college = college;

    let donors = await Donor.find(query).populate('userId', 'name email phone address isActive role college department userType');

    if (search) {
      const searchLower = search.toLowerCase();
      donors = donors.filter(d => 
        (d.userId && d.userId.name && d.userId.name.toLowerCase().includes(searchLower)) ||
        (d.userId && d.userId.email && d.userId.email.toLowerCase().includes(searchLower)) ||
        (d.rollNumber && d.rollNumber.toLowerCase().includes(searchLower)) ||
        (d.department && d.department.toLowerCase().includes(searchLower)) ||
        (d.hostel && d.hostel.toLowerCase().includes(searchLower)) ||
        d.phone.includes(searchLower)
      );
    }

    // Attach dynamic cooldown metrics
    const donorsWithCooldown = donors.map(d => {
      const dObj = d.toObject();
      const cd = computeCooldown(d.lastDonationDate);
      return {
        ...dObj,
        cooldownDaysRemaining: cd.daysRemaining,
        isUnderCooldown: cd.isUnderCooldown
      };
    });

    res.json({
      success: true,
      count: donorsWithCooldown.length,
      donors: donorsWithCooldown
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single donor profile by ID
// @route   GET /api/donors/:id
// @access  Private
const getDonorById = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id).populate('userId', '-password');
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const cd = computeCooldown(donor.lastDonationDate);

    // Get donations linked to this donor
    const donations = await BloodInventory.find({ donorId: donor._id }).sort({ collectionDate: -1 });

    const donorObj = {
      ...donor.toObject(),
      cooldownDaysRemaining: cd.daysRemaining,
      isUnderCooldown: cd.isUnderCooldown
    };

    res.json({
      success: true,
      donor: donorObj,
      donations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new donor
// @route   POST /api/donors
// @access  Private (Admin / Campus Admin)
const createDonor = async (req, res, next) => {
  try {
    const {
      name, email, password, phone, bloodGroup, dateOfBirth, gender, address,
      college, department, userType, rollNumber, hostel, availabilityStatus
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'Donor@123',
      phone,
      role: 'DONOR',
      college: college || 'National Institute of Technology',
      department: department || 'Computer Science & Engineering',
      userType: userType || 'STUDENT',
      address
    });

    const donor = await Donor.create({
      userId: user._id,
      college: college || 'National Institute of Technology',
      department: department || 'Computer Science & Engineering',
      userType: userType || 'STUDENT',
      rollNumber: rollNumber || '',
      hostel: hostel || 'Day Scholar',
      availabilityStatus: availabilityStatus || 'AVAILABLE',
      bloodGroup,
      dateOfBirth,
      gender,
      phone,
      address
    });

    res.status(201).json({
      success: true,
      donor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update donor details
// @route   PUT /api/donors/:id
// @access  Private
const updateDonor = async (req, res, next) => {
  try {
    let donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Authorization check: Admin, Campus Admin or self
    const isAdmin = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin && donor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this profile' });
    }

    const allowed = [
      'college', 'department', 'userType', 'rollNumber', 'hostel',
      'bloodGroup', 'dateOfBirth', 'gender', 'phone', 'address',
      'availabilityStatus', 'lastDonationDate', 'totalDonations', 'eligibilityStatus'
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));

    // Handle cooldown update if lastDonationDate changed
    if (updates.lastDonationDate) {
      const cd = computeCooldown(updates.lastDonationDate);
      updates.cooldownUntil = cd.cooldownDate;
      if (cd.isUnderCooldown && updates.eligibilityStatus !== 'INELIGIBLE') {
        updates.eligibilityStatus = 'COOLDOWN';
      } else if (!cd.isUnderCooldown && updates.eligibilityStatus === 'COOLDOWN') {
        updates.eligibilityStatus = 'ELIGIBLE';
      }
    }

    donor = await Donor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('userId', '-password');

    if (donor.userId?._id) {
      const userUpdates = {};
      if (updates.phone) userUpdates.phone = updates.phone;
      if (updates.address) userUpdates.address = updates.address;
      if (updates.college) userUpdates.college = updates.college;
      if (updates.department) userUpdates.department = updates.department;
      if (updates.userType) userUpdates.userType = updates.userType;
      if (Object.keys(userUpdates).length) await User.findByIdAndUpdate(donor.userId._id, userUpdates, { runValidators: true });
    }

    const cd = computeCooldown(donor.lastDonationDate);
    const donorObj = {
      ...donor.toObject(),
      cooldownDaysRemaining: cd.daysRemaining,
      isUnderCooldown: cd.isUnderCooldown
    };

    res.json({
      success: true,
      donor: donorObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete donor
// @route   DELETE /api/donors/:id
// @access  Private (Admin / Campus Admin)
const deleteDonor = async (req, res, next) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    await User.findByIdAndDelete(donor.userId);
    await Donor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's donor profile
// @route   GET /api/donors/profile/me
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id }).populate('userId', '-password');
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }
    const cd = computeCooldown(donor.lastDonationDate);
    res.json({
      success: true,
      donor: {
        ...donor.toObject(),
        cooldownDaysRemaining: cd.daysRemaining,
        isUnderCooldown: cd.isUnderCooldown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user's donor profile
// @route   PUT /api/donors/profile/me
// @access  Private
const updateMyProfile = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }
    req.params.id = donor._id.toString();
    return updateDonor(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDonors,
  getDonorById,
  getMyProfile,
  updateMyProfile,
  createDonor,
  updateDonor,
  deleteDonor
};
