const CampusCamp = require('../models/CampusCamp');
const Donor = require('../models/Donor');
const { COOLDOWN_DAYS } = require('../config/constants');

// @desc    Get all campus blood camps
// @route   GET /api/camps
// @access  Public / Protected
const getCamps = async (req, res, next) => {
  try {
    const { status, college, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (college) query.college = college;

    let camps = await CampusCamp.find(query)
      .populate('registeredDonors.donorId', 'bloodGroup userType department rollNumber phone availabilityStatus')
      .populate('registeredDonors.userId', 'name email phone')
      .sort({ campDate: 1 });

    if (search) {
      const searchLower = search.toLowerCase();
      camps = camps.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.venue.toLowerCase().includes(searchLower) ||
        c.partnerBloodBank.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      count: camps.length,
      camps
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single camp by ID
// @route   GET /api/camps/:id
// @access  Public / Protected
const getCampById = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id)
      .populate('registeredDonors.donorId', 'bloodGroup userType department rollNumber phone availabilityStatus')
      .populate('registeredDonors.userId', 'name email phone');

    if (!camp) {
      return res.status(404).json({ success: false, message: 'Campus blood camp not found' });
    }

    res.json({
      success: true,
      camp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new campus blood donation camp
// @route   POST /api/camps
// @access  Private (Campus Admin / Authorized Blood Bank)
const createCamp = async (req, res, next) => {
  try {
    const {
      title,
      college,
      venue,
      description,
      campDate,
      registrationDeadline,
      startTime,
      endTime,
      organizer,
      partnerBloodBank,
      targetUnits,
      slots
    } = req.body;

    const defaultSlots = [
      { slotTime: '09:30 AM - 11:00 AM', capacity: 25, bookedCount: 0 },
      { slotTime: '11:00 AM - 12:30 PM', capacity: 25, bookedCount: 0 },
      { slotTime: '01:30 PM - 03:00 PM', capacity: 25, bookedCount: 0 },
      { slotTime: '03:00 PM - 04:30 PM', capacity: 25, bookedCount: 0 }
    ];

    const camp = await CampusCamp.create({
      title,
      college: college || req.user.college || 'National Institute of Technology',
      venue,
      description: description || 'Campus voluntary blood donation camp organized with authorized blood bank.',
      campDate,
      registrationDeadline: registrationDeadline || null,
      startTime: startTime || '09:30 AM',
      endTime: endTime || '04:30 PM',
      organizer: organizer || req.user.name,
      partnerBloodBank: partnerBloodBank || 'District Red Cross Society Blood Bank',
      targetUnits: Number(targetUnits) || 100,
      slots: (slots && slots.length) ? slots : defaultSlots
    });

    res.status(201).json({
      success: true,
      message: 'Campus blood donation camp created successfully',
      camp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a campus blood camp
// @route   PUT /api/camps/:id
// @access  Private (Campus Admin / Authorized Blood Bank)
const updateCamp = async (req, res, next) => {
  try {
    let camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    const allowed = [
      'title', 'college', 'venue', 'description', 'campDate',
      'registrationDeadline', 'startTime', 'endTime', 'organizer',
      'partnerBloodBank', 'targetUnits', 'status', 'slots'
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    camp = await CampusCamp.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Camp details updated successfully',
      camp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a campus blood camp
// @route   PATCH /api/camps/:id/cancel
// @access  Private (Campus Admin / Authorized Blood Bank)
const cancelCamp = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    camp.status = 'CANCELLED';
    await camp.save();

    res.json({
      success: true,
      message: 'Campus camp marked as cancelled',
      camp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a campus blood camp
// @route   DELETE /api/camps/:id
// @access  Private (Campus Admin)
const deleteCamp = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    await CampusCamp.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Camp removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book a donation slot at a camp (RSVP)
// @route   POST /api/camps/:id/book
// @access  Private (Donor)
const bookCampSlot = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    if (camp.status !== 'UPCOMING' && camp.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'This camp is not currently open for registrations' });
    }

    // Check registration deadline if configured
    if (camp.registrationDeadline && new Date() > new Date(camp.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline for this camp has passed' });
    }

    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile required to book a slot' });
    }

    // Prevent duplicate bookings
    const alreadyBooked = camp.registeredDonors.some(
      r => (r.donorId && r.donorId.toString() === donor._id.toString()) ||
           (r.userId && r.userId.toString() === req.user._id.toString())
    );
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: 'You have already booked a slot for this camp' });
    }

    const { slotTime } = req.body;
    let selectedSlot = camp.slots.find(s => s.slotTime === slotTime);
    if (!selectedSlot && camp.slots.length > 0) {
      selectedSlot = camp.slots[0];
    }

    if (selectedSlot) {
      if (selectedSlot.bookedCount >= selectedSlot.capacity) {
        return res.status(400).json({ success: false, message: 'Selected time slot is already fully booked' });
      }
      selectedSlot.bookedCount += 1;
    }

    camp.registeredDonors.push({
      donorId: donor._id,
      userId: req.user._id,
      slotTime: selectedSlot ? selectedSlot.slotTime : 'Walk-in',
      attendanceStatus: 'REGISTERED',
      registeredAt: new Date()
    });

    await camp.save();

    res.json({
      success: true,
      message: 'Camp slot booked successfully! See you on campus.',
      camp
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update attendance and donation completion by medical staff / admin
// @route   PATCH /api/camps/:id/attendees/:attendeeId
// @access  Private (Campus Admin / Authorized Blood Bank)
const updateAttendeeStatus = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    const attendee = camp.registeredDonors.id(req.params.attendeeId);
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Attendee record not found' });
    }

    const { attended, donated, attendanceStatus, remarks } = req.body;
    if (remarks !== undefined) attendee.remarks = remarks;

    const previouslyDonated = attendee.donated;

    // Check target status
    if (attendanceStatus) {
      attendee.attendanceStatus = attendanceStatus;
      if (attendanceStatus === 'DONATED') {
        attendee.donated = true;
        attendee.attended = true;
      } else if (attendanceStatus === 'ATTENDED') {
        attendee.attended = true;
        attendee.donated = false;
      } else if (attendanceStatus === 'ABSENT') {
        attendee.attended = false;
        attendee.donated = false;
      } else if (attendanceStatus === 'DEFERRED') {
        attendee.attended = true;
        attendee.donated = false;
      }
    } else {
      if (attended !== undefined) attendee.attended = Boolean(attended);
      if (donated !== undefined) {
        attendee.donated = Boolean(donated);
        if (attendee.donated) {
          attendee.attended = true;
          attendee.attendanceStatus = 'DONATED';
        } else if (attendee.attended) {
          attendee.attendanceStatus = 'ATTENDED';
        } else {
          attendee.attendanceStatus = 'REGISTERED';
        }
      }
    }

    // If blood unit donation is newly recorded as completed
    if (attendee.donated && !previouslyDonated) {
      camp.unitsCollected = (camp.unitsCollected || 0) + 1;

      // Update donor cooldown and count (+90 days)
      const cooldownDate = new Date();
      cooldownDate.setDate(cooldownDate.getDate() + (COOLDOWN_DAYS || 90));

      await Donor.findByIdAndUpdate(attendee.donorId, {
        $inc: { totalDonations: 1 },
        lastDonationDate: camp.campDate || new Date(),
        cooldownUntil: cooldownDate,
        eligibilityStatus: 'COOLDOWN'
      });
    } else if (!attendee.donated && previouslyDonated) {
      // Reverted from donated
      camp.unitsCollected = Math.max(0, (camp.unitsCollected || 1) - 1);
    }

    await camp.save();

    res.json({
      success: true,
      message: 'Attendee status updated successfully',
      attendee,
      unitsCollected: camp.unitsCollected
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking / remove attendee from camp
// @route   DELETE /api/camps/:id/attendees/:attendeeId
// @access  Private (Donor self or Admin)
const removeAttendee = async (req, res, next) => {
  try {
    const camp = await CampusCamp.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ success: false, message: 'Camp not found' });
    }

    const attendee = camp.registeredDonors.id(req.params.attendeeId);
    if (!attendee) {
      return res.status(404).json({ success: false, message: 'Attendee record not found' });
    }

    // Decrement slot booked count
    const slot = camp.slots.find(s => s.slotTime === attendee.slotTime);
    if (slot && slot.bookedCount > 0) {
      slot.bookedCount -= 1;
    }

    // If was marked as donated, decrement unitsCollected
    if (attendee.donated) {
      camp.unitsCollected = Math.max(0, (camp.unitsCollected || 1) - 1);
    }

    camp.registeredDonors.pull(req.params.attendeeId);
    await camp.save();

    res.json({
      success: true,
      message: 'Registration removed successfully',
      camp
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCamps,
  getCampById,
  createCamp,
  updateCamp,
  cancelCamp,
  deleteCamp,
  bookCampSlot,
  updateAttendeeStatus,
  removeAttendee
};
