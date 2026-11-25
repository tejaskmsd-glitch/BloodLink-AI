const mongoose = require('mongoose');

const CampusCampSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Camp title is required'],
      trim: true
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      default: 'National Institute of Technology',
      trim: true
    },
    venue: {
      type: String,
      required: [true, 'Venue / Location on campus is required'],
      trim: true
    },
    description: {
      type: String,
      default: 'Annual voluntary blood donation drive organized for students and faculty in collaboration with authorized blood bank.',
      trim: true
    },
    campDate: {
      type: Date,
      required: [true, 'Camp date is required']
    },
    registrationDeadline: {
      type: Date,
      default: null
    },
    startTime: {
      type: String,
      required: true,
      default: '09:00 AM'
    },
    endTime: {
      type: String,
      required: true,
      default: '04:00 PM'
    },
    organizer: {
      type: String,
      default: 'Campus Red Cross & NSS Unit'
    },
    partnerBloodBank: {
      type: String,
      required: [true, 'Authorized Partner Blood Bank name is required'],
      default: 'District Red Cross Society Blood Bank'
    },
    targetUnits: {
      type: Number,
      default: 100
    },
    unitsCollected: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING'
    },
    slots: [
      {
        slotTime: { type: String, required: true },
        capacity: { type: Number, default: 25 },
        bookedCount: { type: Number, default: 0 }
      }
    ],
    registeredDonors: [
      {
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        slotTime: { type: String, default: '09:30 AM - 11:00 AM' },
        attended: { type: Boolean, default: false },
        donated: { type: Boolean, default: false },
        attendanceStatus: {
          type: String,
          enum: ['REGISTERED', 'ATTENDED', 'DONATED', 'ABSENT', 'DEFERRED'],
          default: 'REGISTERED'
        },
        remarks: { type: String, default: '' },
        registeredAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('CampusCamp', CampusCampSchema);
