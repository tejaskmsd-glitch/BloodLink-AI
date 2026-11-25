const ROLES = {
  DONOR: 'DONOR',
  RECIPIENT: 'RECIPIENT',
  ADMIN: 'ADMIN',
  CAMPUS_ADMIN: 'CAMPUS_ADMIN',
  AUTHORIZED_BLOOD_BANK: 'AUTHORIZED_BLOOD_BANK',
  SUPER_ADMIN: 'SUPER_ADMIN',
  HOSPITAL: 'HOSPITAL'
};

const USER_TYPES = ['STUDENT', 'FACULTY', 'STAFF', 'OTHER'];

const DONOR_AVAILABILITY = {
  AVAILABLE: 'AVAILABLE', // Available on campus for emergency calls
  TEMP_UNAVAILABLE: 'TEMP_UNAVAILABLE', // Temporarily unwell, fever, medications
  AWAY_FROM_CAMPUS: 'AWAY_FROM_CAMPUS' // On leave, vacation, semester break
};

const COLLEGE_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology & Biomedical Engineering',
  'Chemical Engineering',
  'Management Studies (MBA/BBA)',
  'Sciences & Humanities',
  'Pharmacy & Health Sciences',
  'Other Department'
];

const COOLDOWN_DAYS = 90; // Standard 90-day whole blood donation cooldown in India

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COMPONENTS = [
  'Whole Blood',
  'Packed Red Blood Cells',
  'Plasma',
  'Platelets'
];

const INVENTORY_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  ISSUED: 'ISSUED',
  EXPIRED: 'EXPIRED',
  DISCARDED: 'DISCARDED'
};

const REQUEST_URGENCY = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

const REQUEST_STATUS = {
  PENDING: 'PENDING',
  DONORS_FOUND: 'DONORS_FOUND',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED'
};

const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  EXPIRY_WARNING: 'EXPIRY_WARNING',
  REQUEST_CREATED: 'REQUEST_CREATED',
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  REQUEST_FULFILLED: 'REQUEST_FULFILLED',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
  DONOR_RESPONDED: 'DONOR_RESPONDED',
  EMERGENCY_ALERT: 'EMERGENCY_ALERT',
  CAMP_REGISTERED: 'CAMP_REGISTERED',
  CAMP_UPDATE: 'CAMP_UPDATE',
  SYSTEM: 'SYSTEM'
};

const DONOR_RESPONSE = {
  I_CAN_DONATE: 'I_CAN_DONATE',
  UNAVAILABLE: 'UNAVAILABLE'
};

module.exports = {
  ROLES,
  USER_TYPES,
  DONOR_AVAILABILITY,
  COLLEGE_DEPARTMENTS,
  COOLDOWN_DAYS,
  BLOOD_GROUPS,
  BLOOD_COMPONENTS,
  INVENTORY_STATUS,
  REQUEST_URGENCY,
  REQUEST_STATUS,
  NOTIFICATION_TYPES,
  DONOR_RESPONSE
};
