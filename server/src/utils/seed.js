const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const DemandRecord = require('../models/DemandRecord');
const Notification = require('../models/Notification');
const StockThreshold = require('../models/StockThreshold');
const CampusCamp = require('../models/CampusCamp');
const ensureDemoAccounts = require('./ensureDemoAccounts');
const { BLOOD_GROUPS, BLOOD_COMPONENTS, INVENTORY_STATUS, REQUEST_STATUS, REQUEST_URGENCY, NOTIFICATION_TYPES } = require('../config/constants');

const seedDatabase = async (disconnect = true) => {
  try {
    console.log('🌱 Starting Database Seeding Process (Indian Campus Context)...');
    if (disconnect) await connectDB();

    // Clear existing collections
    await User.deleteMany({});
    await Donor.deleteMany({});
    await Hospital.deleteMany({});
    await BloodInventory.deleteMany({});
    await BloodRequest.deleteMany({});
    await DemandRecord.deleteMany({});
    await Notification.deleteMany({});
    await StockThreshold.deleteMany({});
    await CampusCamp.deleteMany({});

    console.log('🧹 Cleared existing database records.');

    // 1. Create Admin User (Indian Campus Administrator)
    const adminUser = await User.create({
      name: 'Prof. Ramesh K. (Campus Admin)',
      email: 'admin@bloodlink.ai',
      password: 'Admin@123',
      phone: '+91 98450 11223',
      role: 'ADMIN',
      college: process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA',
      department: 'Student Welfare & Health Center',
      userType: 'FACULTY',
      address: {
        street: 'Campus Health Centre, Admin Block',
        city: 'Faridabad',
        state: 'Haryana',
        zipCode: '121001'
      }
    });

    console.log('👤 Created Admin user: admin@bloodlink.ai / Admin@123');

    // 2. Create Hospitals & Partner Blood Banks (Realistic Fictional Indian Demo Healthcare Facilities)
    const hospitalData = [
      {
        name: 'City Civil Hospital & Blood Bank (Demo)',
        email: 'hospital@bloodlink.ai',
        reg: 'LIC-FBD-HOSP-001',
        contact: 'Dr. Rajesh Malhotra (Chief Medical Officer)',
        phone: '+91 98111 22233',
        city: 'Faridabad',
        street: 'Civil Lines Road, Sector 16',
        state: 'Haryana',
        zipCode: '121002',
        emergencyContact: '+91 98111 99000',
        location: { latitude: 28.4089, longitude: 77.3178 }
      },
      {
        name: 'District Government Hospital Blood Centre (Demo)',
        email: 'stjude@hospital.org',
        reg: 'LIC-FBD-HOSP-002',
        contact: 'Dr. Anita Verma',
        phone: '+91 98222 33344',
        city: 'Faridabad',
        street: 'Near Old Bus Stand, B.K. Hospital Road',
        state: 'Haryana',
        zipCode: '121001',
        emergencyContact: '+91 98222 99000',
        location: { latitude: 28.3975, longitude: 77.3082 }
      },
      {
        name: 'Sunrise Multispeciality Hospital & Blood Bank (Demo)',
        email: 'trinity@hospital.org',
        reg: 'LIC-DEL-HOSP-003',
        contact: 'Dr. Manoj Singhal',
        phone: '+91 98333 44455',
        city: 'Delhi',
        street: 'Ring Road, Lajpat Nagar IV',
        state: 'Delhi',
        zipCode: '110024',
        emergencyContact: '+91 98333 99000',
        location: { latitude: 28.5677, longitude: 77.2433 }
      },
      {
        name: 'Metro Blood Centre & Transfusion Services (Demo)',
        email: 'valleyheart@hospital.org',
        reg: 'LIC-GGN-HOSP-004',
        contact: 'Dr. Neha Patel',
        phone: '+91 98444 55566',
        city: 'Gurugram',
        street: 'Sector 29, City Centre Road',
        state: 'Haryana',
        zipCode: '122001',
        emergencyContact: '+91 98444 99000',
        location: { latitude: 28.4682, longitude: 77.0637 }
      },
      {
        name: 'Associated Medical College Hospital (Demo)',
        email: 'apex@hospital.org',
        reg: 'LIC-NOI-HOSP-005',
        contact: 'Dr. Vikram Sethi',
        phone: '+91 98555 66677',
        city: 'Noida',
        street: 'Sector 62 Institutional Area',
        state: 'Uttar Pradesh',
        zipCode: '201309',
        emergencyContact: '+91 98555 99000',
        location: { latitude: 28.6280, longitude: 77.3649 }
      }
    ];

    const createdHospitals = [];
    for (const h of hospitalData) {
      const u = await User.create({
        name: h.name,
        email: h.email,
        password: 'Hospital@123',
        phone: h.phone,
        role: 'HOSPITAL',
        address: { street: h.street, city: h.city, state: h.state, zipCode: h.zipCode }
      });

      const hosp = await Hospital.create({
        userId: u._id,
        hospitalName: h.name,
        registrationNumber: h.reg,
        contactPerson: h.contact,
        phone: h.phone,
        email: h.email,
        address: { street: h.street, city: h.city, state: h.state, zipCode: h.zipCode },
        city: h.city,
        emergencyContact: h.emergencyContact,
        location: h.location
      });
      createdHospitals.push(hosp);
    }
    console.log(`🏥 Created ${createdHospitals.length} Indian Hospital accounts.`);

    // 3. Create Donors (Realistic Fictional Indian Campus Donors)
    const donorData = [
      { name: 'Aarav Sharma', email: 'donor@bloodlink.ai', bg: 'O+', dob: '2003-05-14', gender: 'Male', phone: '+91 98701 00001', city: 'Faridabad', state: 'Haryana', zip: '121001', street: 'Hostel Block 1, Room 102' },
      { name: 'Priya Verma', email: 'priya.v@gmail.com', bg: 'A+', dob: '2004-08-22', gender: 'Female', phone: '+91 98701 00002', city: 'Faridabad', state: 'Haryana', zip: '121006', street: 'Sarojini Girls Hostel, Room 204' },
      { name: 'Rohan Singh', email: 'rohan.s@yahoo.com', bg: 'B+', dob: '2002-12-10', gender: 'Male', phone: '+91 98701 00003', city: 'Delhi', state: 'Delhi', zip: '110007', street: 'North Campus PG, Chhatra Marg' },
      { name: 'Ananya Gupta', email: 'ananya.g@outlook.com', bg: 'O-', dob: '2003-03-30', gender: 'Female', phone: '+91 98701 00004', city: 'Gurugram', state: 'Haryana', zip: '122002', street: 'DLF Phase 2, Sector 25' },
      { name: 'Rahul Yadav', email: 'rahul.y@gmail.com', bg: 'AB+', dob: '2001-11-05', gender: 'Male', phone: '+91 98701 00005', city: 'Noida', state: 'Uttar Pradesh', zip: '201301', street: 'Sector 15, Near Metro' },
      { name: 'Neha Patel', email: 'neha.p@gmail.com', bg: 'A-', dob: '2004-07-18', gender: 'Female', phone: '+91 98701 00006', city: 'Faridabad', state: 'Haryana', zip: '121002', street: 'Sector 14 Residential Block' },
      { name: 'Arjun Kumar', email: 'arjun.k@gmail.com', bg: 'B-', dob: '2002-01-25', gender: 'Male', phone: '+91 98701 00007', city: 'Jaipur', state: 'Rajasthan', zip: '302001', street: 'Malviya Nagar Institutional Area' },
      { name: 'Sneha Mehta', email: 'sneha.m@gmail.com', bg: 'AB-', dob: '2003-09-12', gender: 'Female', phone: '+91 98701 00008', city: 'Chandigarh', state: 'Chandigarh', zip: '160014', street: 'Sector 14, Panjab University Campus' },
      { name: 'Aditya Verma', email: 'aditya.v@gmail.com', bg: 'O+', dob: '2002-04-04', gender: 'Male', phone: '+91 98701 00009', city: 'Lucknow', state: 'Uttar Pradesh', zip: '226007', street: 'Hazratganj Road' },
      { name: 'Pooja Sharma', email: 'pooja.s@gmail.com', bg: 'A+', dob: '2004-06-15', gender: 'Female', phone: '+91 98701 00010', city: 'Delhi', state: 'Delhi', zip: '110016', street: 'Hauz Khas Student Enclave' },
      { name: 'Vikram Malhotra', email: 'vikram.m@gmail.com', bg: 'O+', dob: '2003-02-19', gender: 'Male', phone: '+91 98701 00011', city: 'Faridabad', state: 'Haryana', zip: '121006', street: 'Sector 7, Housing Board Colony' },
      { name: 'Ishita Roy', email: 'ishita.r@gmail.com', bg: 'B+', dob: '2004-10-08', gender: 'Female', phone: '+91 98701 00012', city: 'Gurugram', state: 'Haryana', zip: '122001', street: 'Sector 14, Old Judicial Complex' },
      { name: 'Siddharth Rao', email: 'siddharth.r@gmail.com', bg: 'A+', dob: '2002-07-07', gender: 'Male', phone: '+91 98701 00013', city: 'Noida', state: 'Uttar Pradesh', zip: '201307', street: 'Sector 44, Express Highway' },
      { name: 'Meera Nair', email: 'meera.n@gmail.com', bg: 'O-', dob: '2003-11-23', gender: 'Female', phone: '+91 98701 00014', city: 'Delhi', state: 'Delhi', zip: '110025', street: 'Jamia Nagar, Okhla' },
      { name: 'Kunal Joshi', email: 'kunal.j@gmail.com', bg: 'A-', dob: '2002-05-02', gender: 'Male', phone: '+91 98701 00015', city: 'Faridabad', state: 'Haryana', zip: '121001', street: 'Neelam Bata Road, NIT' },
      { name: 'Tanvi Shah', email: 'tanvi.s@gmail.com', bg: 'B+', dob: '2004-09-17', gender: 'Female', phone: '+91 98701 00016', city: 'Jaipur', state: 'Rajasthan', zip: '302004', street: 'Jawahar Nagar Sector 4' },
      { name: 'Aman Gill', email: 'aman.g@gmail.com', bg: 'AB+', dob: '2001-12-01', gender: 'Male', phone: '+91 98701 00017', city: 'Chandigarh', state: 'Chandigarh', zip: '160022', street: 'Sector 22-B' },
      { name: 'Riya Sen', email: 'riya.s@gmail.com', bg: 'O+', dob: '2003-04-11', gender: 'Female', phone: '+91 98701 00018', city: 'Lucknow', state: 'Uttar Pradesh', zip: '226024', street: 'Aliganj Sector B' },
      { name: 'Harpreet Singh', email: 'harpreet.s@gmail.com', bg: 'B-', dob: '2002-08-31', gender: 'Male', phone: '+91 98701 00019', city: 'Delhi', state: 'Delhi', zip: '110027', street: 'Rajouri Garden Main Ring Road' },
      { name: 'Divya Agarwal', email: 'divya.a@gmail.com', bg: 'O-', dob: '2004-01-14', gender: 'Female', phone: '+91 98701 00020', city: 'Faridabad', state: 'Haryana', zip: '121004', street: 'Sector 21C, Park Avenue' }
    ];

    const createdDonors = [];
    for (const d of donorData) {
      const u = await User.create({
        name: d.name,
        email: d.email,
        password: 'Donor@123',
        phone: d.phone,
        role: 'DONOR',
        college: process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA',
        userType: 'STUDENT',
        address: { street: d.street, city: d.city, state: d.state, zipCode: d.zip }
      });

      const donor = await Donor.create({
        userId: u._id,
        bloodGroup: d.bg,
        dateOfBirth: new Date(d.dob),
        gender: d.gender,
        phone: d.phone,
        college: process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA',
        hostel: d.street,
        availabilityStatus: 'AVAILABLE',
        address: { street: d.street, city: d.city, state: d.state, zipCode: d.zip },
        lastDonationDate: new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000),
        totalDonations: Math.floor(Math.random() * 6) + 1,
        eligibilityStatus: 'ELIGIBLE'
      });
      createdDonors.push(donor);
    }
    console.log(`🩸 Created ${createdDonors.length} Indian Campus Donor profiles.`);

    // 4. Create Stock Thresholds
    const stockThresholds = [];
    for (const bg of BLOOD_GROUPS) {
      for (const comp of BLOOD_COMPONENTS) {
        const thresh = await StockThreshold.create({
          bloodGroup: bg,
          component: comp,
          minimumStock: bg === 'O+' || bg === 'A+' || bg === 'B+' ? 12 : 6,
          criticalStock: bg === 'O+' || bg === 'A+' || bg === 'B+' ? 5 : 3,
          updatedBy: adminUser._id
        });
        stockThresholds.push(thresh);
      }
    }
    console.log(`⚙️ Created ${stockThresholds.length} Stock Threshold rules.`);

    // 5. Create Blood Inventory (55 physical units)
    const inventoryUnits = [];
    const storageLocations = ['Cold Storage Vault 1', 'Blood Bank Refrigerator A', 'Blood Bank Refrigerator B', 'Platelet Agitator Room', 'Deep Freezer -40C'];

    const now = new Date();

    for (let i = 1; i <= 55; i++) {
      const bg = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
      const comp = BLOOD_COMPONENTS[i % BLOOD_COMPONENTS.length];
      const donor = createdDonors[i % createdDonors.length];

      let daysOffset = 25;
      let status = INVENTORY_STATUS.AVAILABLE;

      if (i <= 5) {
        daysOffset = -Math.floor(Math.random() * 5 + 1);
        status = INVENTORY_STATUS.EXPIRED;
      } else if (i <= 12) {
        daysOffset = Math.floor(Math.random() * 3 + 1);
      } else if (i <= 18) {
        daysOffset = Math.floor(Math.random() * 15 + 5);
        status = INVENTORY_STATUS.ISSUED;
      }

      const collectionDate = new Date(now.getTime() - (35 - daysOffset) * 86400000);
      const expiryDate = new Date(collectionDate.getTime() + 35 * 86400000);

      const unit = await BloodInventory.create({
        unitId: `BLD-2026-${String(i).padStart(4, '0')}`,
        bloodGroup: bg,
        component: comp,
        quantity: 1,
        collectionDate,
        expiryDate,
        donorId: donor._id,
        storageLocation: storageLocations[i % storageLocations.length],
        status
      });
      inventoryUnits.push(unit);
    }
    console.log(`📦 Seeded ${inventoryUnits.length} physical blood units into inventory.`);

    // 6. Create Historical Demand Records (3+ months)
    const demandRecords = [];
    for (let m = 3; m >= 0; m--) {
      const date = new Date(now.getFullYear(), now.getMonth() - m, 15);
      for (const bg of BLOOD_GROUPS) {
        for (const comp of BLOOD_COMPONENTS) {
          const requested = Math.floor(Math.random() * 15) + 5;
          const fulfilled = Math.floor(requested * 0.85);
          const rejected = requested - fulfilled;
          const emergency = Math.floor(Math.random() * 3);

          const dr = await DemandRecord.create({
            bloodGroup: bg,
            component: comp,
            date,
            requestedUnits: requested,
            fulfilledUnits: fulfilled,
            rejectedUnits: rejected,
            emergencyRequests: emergency
          });
          demandRecords.push(dr);
        }
      }
    }
    console.log(`📊 Created ${demandRecords.length} historical Demand records over 4 months.`);

    // 7. Create Blood Requests (32 requests with Indian hospital context)
    const bloodRequests = [];
    const reasons = [
      'Emergency Trauma Care - Highway Road Accident (NH-19)',
      'Platelet Transfusion for Severe Dengue Patient',
      'Elective Cardiac Bypass Surgery Transfusion',
      'Severe Anemia & Thalassemia Routine Support',
      'Maternal Hemorrhage Post-Partum Emergency'
    ];

    const statuses = [
      REQUEST_STATUS.PENDING,
      REQUEST_STATUS.APPROVED,
      REQUEST_STATUS.FULFILLED,
      REQUEST_STATUS.REJECTED,
      REQUEST_STATUS.CANCELLED
    ];

    for (let i = 1; i <= 32; i++) {
      const hosp = createdHospitals[i % createdHospitals.length];
      const bg = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
      const comp = BLOOD_COMPONENTS[i % BLOOD_COMPONENTS.length];
      const urgency = i % 5 === 0 ? REQUEST_URGENCY.EMERGENCY : (i % 3 === 0 ? REQUEST_URGENCY.URGENT : REQUEST_URGENCY.NORMAL);
      const status = statuses[i % statuses.length];

      const reqObj = {
        hospitalId: hosp._id,
        patientReference: `PAT-2026-FBD-${String(100 + i)}`,
        bloodGroup: bg,
        component: comp,
        quantity: Math.floor(Math.random() * 3) + 1,
        urgency,
        requiredDate: new Date(now.getTime() + Math.floor(Math.random() * 5) * 86400000),
        reason: reasons[i % reasons.length],
        status,
        createdAt: new Date(now.getTime() - Math.floor(Math.random() * 20) * 86400000)
      };

      if (status === REQUEST_STATUS.APPROVED || status === REQUEST_STATUS.FULFILLED) {
        reqObj.approvedBy = adminUser._id;
        reqObj.approvedAt = new Date(reqObj.createdAt.getTime() + 3600000);
      }

      if (status === REQUEST_STATUS.FULFILLED) {
        reqObj.fulfilledAt = new Date(reqObj.createdAt.getTime() + 7200000);
      }

      if (status === REQUEST_STATUS.REJECTED) {
        reqObj.rejectionReason = 'Insufficient inventory units available for requested blood group.';
      }

      const createdReq = await BloodRequest.create(reqObj);
      bloodRequests.push(createdReq);
    }
    console.log(`📋 Created ${bloodRequests.length} hospital blood requests.`);

    // 8. Create Notifications
    await Notification.create({
      userId: adminUser._id,
      type: NOTIFICATION_TYPES.LOW_STOCK,
      title: '🚨 Critical Stock Alert: O- (Whole Blood)',
      message: 'Available inventory for O- Whole Blood has dropped to 2 units (Critical threshold is 3).'
    });

    await Notification.create({
      userId: adminUser._id,
      type: NOTIFICATION_TYPES.EXPIRY_WARNING,
      title: '⚠️ Expiry Warning',
      message: '4 units of A+ Packed Red Blood Cells are expiring within 3 days.'
    });

    if (createdHospitals[0] && createdHospitals[0].userId) {
      await Notification.create({
        userId: createdHospitals[0].userId,
        type: NOTIFICATION_TYPES.REQUEST_FULFILLED,
        title: 'Blood Request Fulfilled! 🩸',
        message: 'Your request for 2 units of O+ Whole Blood has been fulfilled and dispatched.'
      });
    }

    // 9. Create Campus Blood Donation Camp
    const campDate = new Date();
    campDate.setDate(campDate.getDate() + 5);
    await CampusCamp.create({
      title: 'Annual Youth Red Cross & NSS Mega Blood Donation Drive 2026',
      college: process.env.CAMPUS_NAME || 'JC Bose University of Science and Technology, YMCA',
      venue: 'Campus Multipurpose Hall & Health Centre, Sector 6, Faridabad',
      campDate,
      startTime: '09:30 AM',
      endTime: '04:30 PM',
      organizer: 'Youth Red Cross Chapter & NSS Cell',
      partnerBloodBank: 'District Red Cross Authorized Blood Bank, Faridabad',
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

    console.log('⛺ Created sample Campus Blood Donation Camp.');
    console.log('🔔 Created initial system notifications.');

    // 10. Ensure Indian Campus Demo Accounts (Admin, Students, Faculty, Recipient)
    await ensureDemoAccounts();
    console.log('🎓 Seeded Indian Campus Accounts (Admin, Students, Faculty, Recipient).');

    console.log('✅ Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exitCode = 1;
  } finally {
    if (disconnect) {
      await disconnectDB();
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
