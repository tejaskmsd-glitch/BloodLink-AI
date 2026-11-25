const mongoose = require('mongoose');
const { BLOOD_GROUPS, BLOOD_COMPONENTS, REQUEST_URGENCY, REQUEST_STATUS } = require('../config/constants');

const BloodRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: false,
      default: null,
      index: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    hospitalName: {
      type: String,
      default: 'Associated Hospital / Medical Centre',
      trim: true
    },
    contactPhone: {
      type: String,
      default: '',
      trim: true
    },
    contactPerson: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    notifiedDonorsCount: {
      type: Number,
      default: 0
    },
    matchedDonorsCount: {
      type: Number,
      default: 0
    },
    college: {
      type: String,
      default: 'National Institute of Technology',
      trim: true
    },
    campusLocation: {
      type: String,
      default: '',
      trim: true
    },
    patientReference: {
      type: String,
      required: [true, 'Patient reference/ID is required'],
      trim: true
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: [true, 'Blood group is required']
    },
    component: {
      type: String,
      enum: BLOOD_COMPONENTS,
      required: [true, 'Component is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    urgency: {
      type: String,
      enum: Object.values(REQUEST_URGENCY),
      default: REQUEST_URGENCY.NORMAL
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required']
    },
    reason: {
      type: String,
      required: [true, 'Medical reason for request is required']
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    fulfilledAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    fulfilledUnits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodInventory'
      }
    ],
    respondingDonors: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        donorName: String,
        donorPhone: String,
        bloodGroup: String,
        response: {
          type: String,
          enum: ['I_CAN_DONATE', 'WILL_DONATE', 'UNAVAILABLE'],
          default: 'I_CAN_DONATE'
        },
        notes: { type: String, default: '' },
        respondedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

BloodRequestSchema.index({ hospitalId: 1, status: 1 });

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
