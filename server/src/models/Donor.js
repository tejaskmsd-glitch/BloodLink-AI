const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('../config/constants');

const DonorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: [true, 'Blood group is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    userType: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'STAFF', 'OTHER'],
      default: 'STUDENT'
    },
    college: {
      type: String,
      default: 'National Institute of Technology',
      trim: true
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true
    },
    rollNumber: {
      type: String,
      default: '',
      trim: true
    },
    hostel: {
      type: String,
      default: 'Day Scholar',
      trim: true
    },
    availabilityStatus: {
      type: String,
      enum: ['AVAILABLE', 'TEMP_UNAVAILABLE', 'AWAY_FROM_CAMPUS'],
      default: 'AVAILABLE'
    },
    lastDonationDate: {
      type: Date,
      default: null
    },
    cooldownUntil: {
      type: Date,
      default: null
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    eligibilityStatus: {
      type: String,
      enum: ['ELIGIBLE', 'INELIGIBLE', 'TEMPORARILY_DEFERRED', 'COOLDOWN'],
      default: 'ELIGIBLE'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Donor', DonorSchema);
