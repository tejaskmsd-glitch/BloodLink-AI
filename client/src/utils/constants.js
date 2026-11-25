export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ROLES = {
  DONOR: 'DONOR',
  RECIPIENT: 'RECIPIENT',
  CAMPUS_ADMIN: 'CAMPUS_ADMIN',
  AUTHORIZED_BLOOD_BANK: 'AUTHORIZED_BLOOD_BANK',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HOSPITAL: 'HOSPITAL'
};

export const USER_TYPES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'FACULTY', label: 'Faculty / Professor' },
  { value: 'STAFF', label: 'Campus Staff' }
];

export const COLLEGE_DEPARTMENTS = [
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

export const DONOR_AVAILABILITY = {
  AVAILABLE: {
    label: 'Available on Campus',
    description: 'Ready to respond to campus emergency calls',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500'
  },
  TEMP_UNAVAILABLE: {
    label: 'Temporarily Unavailable',
    description: 'Unwell, exams, medication or resting',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500'
  },
  AWAY_FROM_CAMPUS: {
    label: 'Away from Campus / On Leave',
    description: 'Vacation, semester break or outside campus',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400'
  }
};

export const BLOOD_COMPONENTS = [
  'Whole Blood',
  'Packed Red Blood Cells',
  'Plasma',
  'Platelets'
];

export const REQUEST_URGENCY = {
  NORMAL: { label: 'Normal', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  URGENT: { label: 'Urgent', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  CRITICAL: { label: 'CRITICAL 🚨', color: 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold' },
  EMERGENCY: { label: 'EMERGENCY 🚨', color: 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold' }
};

export const REQUEST_STATUS = {
  PENDING: { label: 'Pending Response', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  DONORS_FOUND: { label: 'Donors Found 🟢', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300' },
  FULFILLED: { label: 'Fulfilled & Donated', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-300' }
};

export const INVENTORY_STATUS = {
  AVAILABLE: { label: 'Available', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  RESERVED: { label: 'Reserved', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  ISSUED: { label: 'Issued', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  EXPIRED: { label: 'Expired', color: 'bg-red-100 text-red-800 border-red-300' },
  DISCARDED: { label: 'Discarded', color: 'bg-gray-100 text-gray-700 border-gray-300' }
};
