const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    (() => {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
      return process.env.JWT_SECRET;
    })(),
    { expiresIn: '30d' }
  );
};

// @desc    Register user (Campus Admin, Donor, Authorized Blood Bank)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, college, department, userType, extraDetails = {} } = req.body;
    
    // Normalize role
    let role = req.body.role || 'DONOR';
    if (role === 'ADMIN') role = 'CAMPUS_ADMIN';
    if (role === 'HOSPITAL') role = 'AUTHORIZED_BLOOD_BANK';
    const validRoles = ['DONOR', 'RECIPIENT', 'CAMPUS_ADMIN', 'AUTHORIZED_BLOOD_BANK', 'ADMIN', 'HOSPITAL'];
    if (!validRoles.includes(role)) {
      role = 'DONOR';
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const userCollege = college || extraDetails.college || 'National Institute of Technology';
    const userDept = department || extraDetails.department || 'Computer Science & Engineering';
    const resolvedUserType = userType || extraDetails.userType || (role === 'CAMPUS_ADMIN' ? 'FACULTY' : 'STUDENT');

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      userType: resolvedUserType,
      college: userCollege,
      department: userDept,
      address
    });

    // Create role profile if applicable
    if (user.role === 'DONOR') {
      await Donor.create({
        userId: user._id,
        college: userCollege,
        department: userDept,
        userType: resolvedUserType,
        rollNumber: extraDetails.rollNumber || '',
        hostel: extraDetails.hostel || 'Day Scholar',
        bloodGroup: extraDetails.bloodGroup || 'O+',
        availabilityStatus: extraDetails.availabilityStatus || 'AVAILABLE',
        dateOfBirth: extraDetails.dateOfBirth || new Date('2002-01-01'),
        gender: extraDetails.gender || 'Other',
        phone: phone,
        address: address
      });
    } else if (['AUTHORIZED_BLOOD_BANK', 'HOSPITAL'].includes(user.role)) {
      await Hospital.create({
        userId: user._id,
        hospitalName: extraDetails.hospitalName || extraDetails.organizationName || name,
        registrationNumber: extraDetails.registrationNumber || extraDetails.licenseNumber || `LIC-BB-${Date.now()}`,
        contactPerson: extraDetails.contactPerson || name,
        phone: phone,
        email: email,
        address: address,
        city: extraDetails.city || 'Campus Regional Zone',
        emergencyContact: extraDetails.emergencyContact || phone
      });
    }

    const token = generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;
    let profile = null;
    if (user.role === 'DONOR') profile = await Donor.findOne({ userId: user._id });
    if (['AUTHORIZED_BLOOD_BANK', 'HOSPITAL'].includes(user.role)) profile = await Hospital.findOne({ userId: user._id });

    res.status(201).json({
      success: true,
      token,
      user: { ...userObj, profile }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' });
    }

    const token = generateToken(user._id);

    // Fetch associated profile details
    let profile = null;
    if (user.role === 'DONOR') {
      profile = await Donor.findOne({ userId: user._id });
    } else if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) {
      profile = await Hospital.findOne({ userId: user._id });
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      token,
      user: {
        ...userObj,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profile = null;

    if (user.role === 'DONOR') {
      profile = await Donor.findOne({ userId: user._id });
    } else if (['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(user.role)) {
      profile = await Hospital.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};
