const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const CampusCamp = require('../models/CampusCamp');
const BloodRequest = require('../models/BloodRequest');
const { ROLES } = require('../config/constants');

const DEMO_ACCOUNTS = {
  admin: {
    name: 'Prof. Ramesh K. (NSS Coordinator)',
    email: 'admin@bloodlink.ai',
    password: 'Admin@123',
    phone: '+91 98765 43210',
    role: ROLES.CAMPUS_ADMIN || ROLES.ADMIN,
    college: 'National Institute of Technology',
    department: 'Student Welfare & Health Center',
    userType: 'FACULTY',
    address: {
      street: 'Campus Health Centre, Admin Block',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  },
  campusAdminEdu: {
    name: 'Dr. Priya Sundaram',
    email: 'admin@campus.edu.in',
    password: 'Admin@123',
    phone: '+91 98450 11223',
    role: ROLES.CAMPUS_ADMIN || ROLES.ADMIN,
    college: 'National Institute of Technology',
    department: 'Youth Red Cross Chapter',
    userType: 'FACULTY',
    address: {
      street: 'Red Cross Office, Student Activity Center',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  },
  hospital: {
    name: 'District Red Cross Authorized Blood Bank',
    email: 'hospital@bloodlink.ai',
    password: 'Hospital@123',
    phone: '+91 80 2234 5678',
    role: ROLES.AUTHORIZED_BLOOD_BANK || ROLES.HOSPITAL,
    address: {
      street: '14 Red Cross Road, Near Central Hospital',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560002'
    }
  },
  hospitalB: {
    name: 'City Government General Hospital Blood Bank',
    email: 'stjude@hospital.org',
    password: 'Hospital@123',
    phone: '+91 80 2345 6789',
    role: ROLES.AUTHORIZED_BLOOD_BANK || ROLES.HOSPITAL,
    address: {
      street: 'Medical College Campus, Victoria Hospital Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560002'
    }
  },
  donor: {
    name: 'Rahul Sharma',
    email: 'donor@bloodlink.ai',
    password: 'Donor@123',
    phone: '+91 91234 56789',
    role: ROLES.DONOR,
    college: 'National Institute of Technology',
    department: 'Computer Science & Engineering',
    userType: 'STUDENT',
    address: {
      street: 'Hostel Block 3, Room 214',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  },
  studentEdu: {
    name: 'Ananya Iyer',
    email: 'rahul.cse@campus.edu.in',
    password: 'Donor@123',
    phone: '+91 94488 22334',
    role: ROLES.DONOR,
    college: 'National Institute of Technology',
    department: 'Electronics & Communication Engineering',
    userType: 'STUDENT',
    address: {
      street: 'Gargi Girls Hostel, Room 108',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  },
  facultyDonor: {
    name: 'Dr. Anita Verma',
    email: 'dr.anita.ece@campus.edu.in',
    password: 'Donor@123',
    phone: '+91 97766 55443',
    role: ROLES.DONOR,
    college: 'National Institute of Technology',
    department: 'Electronics & Communication Engineering',
    userType: 'FACULTY',
    address: {
      street: 'Faculty Quarters B-12',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  },
  recipient: {
    name: 'Priya Patel (Student Recipient)',
    email: 'recipient@campus.edu.in',
    password: 'Recipient@123',
    phone: '+91 98112 33445',
    role: ROLES.RECIPIENT,
    college: 'National Institute of Technology',
    department: 'Civil Engineering',
    userType: 'STUDENT',
    address: {
      street: 'Gargi Girls Hostel, Room 204',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    }
  }
};

const upsertDemoUser = async (account) => {
  let existing = await User.findOne({ email: account.email }).select('+password');
  if (existing) {
    const isMatch = await existing.matchPassword(account.password);
    if (!isMatch) {
      existing.password = account.password;
      await existing.save();
    }
    return { user: existing, created: false };
  }

  const user = await User.create(account);
  return { user, created: true };
};

/**
 * Adds the accounts advertised by the Quick Demo Login buttons without
 * removing accounts that have already been registered in development.
 */
const ensureDemoAccounts = async () => {
  const created = [];
  
  // 1. Admin / Campus Coordinators
  const admin = await upsertDemoUser(DEMO_ACCOUNTS.admin);
  if (admin.created) created.push(DEMO_ACCOUNTS.admin.email);

  const adminEdu = await upsertDemoUser(DEMO_ACCOUNTS.campusAdminEdu);
  if (adminEdu.created) created.push(DEMO_ACCOUNTS.campusAdminEdu.email);

  // 2. Authorized Blood Bank
  const hospital = await upsertDemoUser(DEMO_ACCOUNTS.hospital);
  if (hospital.created) created.push(DEMO_ACCOUNTS.hospital.email);
  const hospitalProfile = await Hospital.findOne({ userId: hospital.user._id });
  if (!hospitalProfile) {
    await Hospital.create({
      userId: hospital.user._id,
      hospitalName: DEMO_ACCOUNTS.hospital.name,
      registrationNumber: 'LIC-KA-BL-2024-0089',
      contactPerson: 'Dr. Suresh Babu (Chief Medical Officer)',
      phone: DEMO_ACCOUNTS.hospital.phone,
      email: DEMO_ACCOUNTS.hospital.email,
      address: DEMO_ACCOUNTS.hospital.address,
      city: 'Bangalore',
      emergencyContact: '+91 98451 99000'
    });
  }

  const hospitalB = await upsertDemoUser(DEMO_ACCOUNTS.hospitalB);
  if (hospitalB.created) created.push(DEMO_ACCOUNTS.hospitalB.email);
  const hospitalBProfile = await Hospital.findOne({ userId: hospitalB.user._id });
  if (!hospitalBProfile) {
    await Hospital.create({
      userId: hospitalB.user._id,
      hospitalName: DEMO_ACCOUNTS.hospitalB.name,
      registrationNumber: 'LIC-KA-BL-2023-0012',
      contactPerson: 'Dr. Meenakshi Rao',
      phone: DEMO_ACCOUNTS.hospitalB.phone,
      email: DEMO_ACCOUNTS.hospitalB.email,
      address: DEMO_ACCOUNTS.hospitalB.address,
      city: 'Bangalore',
      emergencyContact: '+91 98452 88000'
    });
  }

  // 3. Student & Faculty Donors
  const donor = await upsertDemoUser(DEMO_ACCOUNTS.donor);
  if (donor.created) created.push(DEMO_ACCOUNTS.donor.email);
  let donorProfile = await Donor.findOne({ userId: donor.user._id });
  if (!donorProfile) {
    await Donor.create({
      userId: donor.user._id,
      bloodGroup: 'O+',
      college: 'National Institute of Technology',
      department: 'Computer Science & Engineering',
      userType: 'STUDENT',
      rollNumber: '22CS1048',
      hostel: 'Hostel Block 3, Room 214',
      availabilityStatus: 'AVAILABLE',
      dateOfBirth: new Date('2003-04-12'),
      gender: 'Male',
      phone: DEMO_ACCOUNTS.donor.phone,
      address: DEMO_ACCOUNTS.donor.address,
      totalDonations: 2,
      lastDonationDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000), // >90 days ago = eligible
      eligibilityStatus: 'ELIGIBLE'
    });
  }

  const studentEdu = await upsertDemoUser(DEMO_ACCOUNTS.studentEdu);
  if (studentEdu.created) created.push(DEMO_ACCOUNTS.studentEdu.email);
  let studentEduProfile = await Donor.findOne({ userId: studentEdu.user._id });
  if (!studentEduProfile) {
    await Donor.create({
      userId: studentEdu.user._id,
      bloodGroup: 'B+',
      college: 'National Institute of Technology',
      department: 'Electronics & Communication Engineering',
      userType: 'STUDENT',
      rollNumber: '22EC2015',
      hostel: 'Gargi Girls Hostel, Room 108',
      availabilityStatus: 'AVAILABLE',
      dateOfBirth: new Date('2003-09-21'),
      gender: 'Female',
      phone: DEMO_ACCOUNTS.studentEdu.phone,
      address: DEMO_ACCOUNTS.studentEdu.address,
      totalDonations: 1,
      lastDonationDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      eligibilityStatus: 'ELIGIBLE'
    });
  }

  const facultyDonor = await upsertDemoUser(DEMO_ACCOUNTS.facultyDonor);
  if (facultyDonor.created) created.push(DEMO_ACCOUNTS.facultyDonor.email);
  let facultyProfile = await Donor.findOne({ userId: facultyDonor.user._id });
  if (!facultyProfile) {
    await Donor.create({
      userId: facultyDonor.user._id,
      bloodGroup: 'A+',
      college: 'National Institute of Technology',
      department: 'Electronics & Communication Engineering',
      userType: 'FACULTY',
      rollNumber: 'FAC-ECE-04',
      hostel: 'Faculty Quarters B-12',
      availabilityStatus: 'AVAILABLE',
      dateOfBirth: new Date('1985-08-15'),
      gender: 'Female',
      phone: DEMO_ACCOUNTS.facultyDonor.phone,
      address: DEMO_ACCOUNTS.facultyDonor.address,
      totalDonations: 4,
      lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      eligibilityStatus: 'ELIGIBLE'
    });
  }

  // 4. Recipient Demo Account
  const recipient = await upsertDemoUser(DEMO_ACCOUNTS.recipient);
  if (recipient.created) created.push(DEMO_ACCOUNTS.recipient.email);

  // 5. Sample Upcoming Campus Blood Donation Camp
  const campExists = await CampusCamp.findOne({ title: 'Annual Youth Red Cross & NSS Mega Blood Donation Drive 2026' });
  if (!campExists) {
    const campDate = new Date();
    campDate.setDate(campDate.getDate() + 7); // 7 days from now
    await CampusCamp.create({
      title: 'Annual Youth Red Cross & NSS Mega Blood Donation Drive 2026',
      college: 'National Institute of Technology',
      venue: 'Campus Indoor Stadium & Health Centre',
      campDate,
      startTime: '09:30 AM',
      endTime: '04:30 PM',
      organizer: 'Youth Red Cross Chapter & NSS Cell',
      partnerBloodBank: 'District Red Cross Authorized Blood Bank',
      targetUnits: 150,
      unitsCollected: 0,
      status: 'UPCOMING',
      slots: [
        { slotTime: '09:30 AM - 11:00 AM', capacity: 30, bookedCount: 5 },
        { slotTime: '11:00 AM - 12:30 PM', capacity: 30, bookedCount: 8 },
        { slotTime: '01:30 PM - 03:00 PM', capacity: 30, bookedCount: 3 },
        { slotTime: '03:00 PM - 04:30 PM', capacity: 30, bookedCount: 2 }
      ]
    });
  }

  // 6. Sample Active Emergency Request
  const requestExists = await BloodRequest.findOne({ urgency: 'EMERGENCY' });
  if (!requestExists) {
    const requiredDate = new Date();
    requiredDate.setDate(requiredDate.getDate() + 1);
    await BloodRequest.create({
      patientReference: 'Campus Emergency Patient (Arun Kumar / ICU Ward)',
      hospitalName: 'Victoria Govt Medical College Hospital (Emergency Wing)',
      contactPhone: '+91 98450 99887',
      college: 'National Institute of Technology',
      campusLocation: 'Near Main Gate / City Hospital',
      bloodGroup: 'O+',
      component: 'Whole Blood',
      quantity: 2,
      urgency: 'EMERGENCY',
      requiredDate,
      reason: 'Urgent emergency transfusion required following road traffic accident near campus bypass.',
      status: 'PENDING'
    });
  }

  return created;
};

module.exports = ensureDemoAccounts;
