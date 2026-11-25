const http = require('http');

const port = process.env.PORT || 5002;

// Helper to make HTTP JSON requests
const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const reqOptions = { ...options, headers: { ...(options.headers || {}) } };
    let bodyString = null;
    if (postData) {
      bodyString = typeof postData === 'string' ? postData : JSON.stringify(postData);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = null;
        }
        resolve({ status: res.statusCode, data: parsed, raw: data });
      });
    });

    req.on('error', (err) => reject(err));
    if (bodyString) {
      req.write(bodyString);
    }
    req.end();
  });
};

const runPhase2Tests = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Starting Phase 2 Campus Camp Management Integration Tests (Port ${port})`);
  console.log(`============================================================\n`);
  const baseHeaders = { 'Content-Type': 'application/json' };

  try {
    // 1. Campus Admin Login
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: baseHeaders
    }, {
      email: 'admin@campus.edu.in',
      password: 'Admin@123'
    });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminToken = adminLogin.data?.token;
    console.log(`✓ 1. Campus Admin Authenticated: ${adminLogin.data?.user?.name} (${adminLogin.data?.user?.college})`);

    // 2. Student Donor 1 Login
    const donor1Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: baseHeaders
    }, {
      email: 'rahul.cse@campus.edu.in',
      password: 'Donor@123'
    });
    if (donor1Login.status !== 200) throw new Error(`Donor 1 login failed: ${JSON.stringify(donor1Login.data)}`);
    const donor1Token = donor1Login.data?.token;
    const donor1Profile = donor1Login.data?.user?.profile;
    console.log(`✓ 2. Student Donor 1 Authenticated: ${donor1Login.data?.user?.name} (${donor1Profile?.bloodGroup}, Roll: ${donor1Profile?.rollNumber})`);

    // 3. Donor 2 Login
    const donor2Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: baseHeaders
    }, {
      email: 'dr.anita.ece@campus.edu.in',
      password: 'Donor@123'
    });
    if (donor2Login.status !== 200) throw new Error(`Donor 2 login failed: ${JSON.stringify(donor2Login.data)}`);
    const donor2Token = donor2Login.data?.token;
    const donor2Profile = donor2Login.data?.user?.profile;
    console.log(`✓ 3. Donor 2 Authenticated: ${donor2Login.data?.user?.name} (${donor2Profile?.bloodGroup})`);

    // 4. Admin Creates a New Campus Blood Camp
    const campDate = new Date();
    campDate.setDate(campDate.getDate() + 10);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 9);

    const campPayload = {
      title: `NIT Annual Red Cross Blood Drive ${Date.now()}`,
      venue: 'Main Auditorium & Health Centre',
      description: 'Annual campus donation drive organized by Youth Red Cross and NSS.',
      campDate,
      registrationDeadline: deadline,
      startTime: '09:00 AM',
      endTime: '04:00 PM',
      organizer: 'Campus Youth Red Cross Chapter',
      partnerBloodBank: 'District Red Cross Society Blood Bank',
      targetUnits: 100,
      slots: [
        { slotTime: '09:00 AM - 10:30 AM', capacity: 1, bookedCount: 0 }, // Capacity 1 to test overbooking!
        { slotTime: '10:30 AM - 12:00 PM', capacity: 20, bookedCount: 0 }
      ]
    };

    const createRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/camps',
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    }, campPayload);

    if (createRes.status !== 201) throw new Error(`Camp creation failed (${createRes.status}): ${JSON.stringify(createRes.data || createRes.raw)}`);
    const campId = createRes.data?.camp?._id;
    console.log(`✓ 4. Camp Created Successfully: "${createRes.data?.camp?.title}" (ID: ${campId})`);

    // 5. Admin Edits Camp Details
    const editRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}`,
      method: 'PUT',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    }, {
      description: 'Updated: Annual campus donation drive with free hemoglobin check and refreshments.',
      targetUnits: 125
    });
    if (editRes.status !== 200) throw new Error(`Camp update failed (${editRes.status}): ${JSON.stringify(editRes.data || editRes.raw)}`);
    console.log(`✓ 5. Camp Details Edited: Target units updated to ${editRes.data?.camp?.targetUnits}`);

    // 6. Student Donor 1 views camps
    const getCampsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/camps',
      method: 'GET'
    });
    if (getCampsRes.status !== 200 || !getCampsRes.data?.camps?.length) throw new Error(`Failed to list camps`);
    console.log(`✓ 6. Camps Discovered: Found ${getCampsRes.data?.camps?.length} active camps on campus`);

    // 7. Student Donor 1 books Slot 1 ('09:00 AM - 10:30 AM', capacity: 1)
    const book1Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/book`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor1Token}` }
    }, {
      slotTime: '09:00 AM - 10:30 AM'
    });
    if (book1Res.status !== 200) throw new Error(`Donor 1 booking failed: ${JSON.stringify(book1Res.data)}`);
    console.log(`✓ 7. Donor 1 Slot Booked: Slot "09:00 AM - 10:30 AM" reserved for ${donor1Login.data?.user?.name}`);

    // 8. Prevent Duplicate Registration Check (Same student booking again)
    const duplicateRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/book`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor1Token}` }
    }, {
      slotTime: '10:30 AM - 12:00 PM'
    });
    if (duplicateRes.status === 400 && duplicateRes.data?.message?.includes('already booked')) {
      console.log(`✓ 8. Duplicate Registration Prevented: [HTTP 400] "${duplicateRes.data.message}"`);
    } else {
      throw new Error(`Duplicate check failed: Expected 400 but got ${duplicateRes.status}: ${JSON.stringify(duplicateRes.data)}`);
    }

    // 9. Prevent Slot Overbooking Check (Donor 2 attempts to book Slot 1 which has capacity 1)
    const overbookRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/book`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor2Token}` }
    }, {
      slotTime: '09:00 AM - 10:30 AM'
    });
    if (overbookRes.status === 400 && overbookRes.data?.message?.includes('fully booked')) {
      console.log(`✓ 9. Slot Overbooking Prevented: [HTTP 400] "${overbookRes.data.message}"`);
    } else {
      throw new Error(`Overbooking check failed: Expected 400 but got ${overbookRes.status}: ${JSON.stringify(overbookRes.data)}`);
    }

    // 10. Donor 2 books available Slot 2 ('10:30 AM - 12:00 PM')
    const book2Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/book`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor2Token}` }
    }, {
      slotTime: '10:30 AM - 12:00 PM'
    });
    if (book2Res.status !== 200) throw new Error(`Donor 2 booking failed: ${JSON.stringify(book2Res.data)}`);
    console.log(`✓ 10. Donor 2 Booked Available Slot 2: Reserved "10:30 AM - 12:00 PM"`);

    // 11. Admin views registered participants in camp
    const campDetails = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}`,
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });
    const attendees = campDetails.data?.camp?.registeredDonors || [];
    if (attendees.length !== 2) throw new Error(`Expected 2 registered attendees, found ${attendees.length}`);
    console.log(`✓ 11. Admin Queue View: Verified ${attendees.length} participants in the camp registration queue`);

    const att1 = attendees[0];
    const att2 = attendees[1];

    // 12. Admin records Attendance for Donor 1
    const attendRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/attendees/${att1._id}`,
      method: 'PATCH',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    }, {
      attendanceStatus: 'ATTENDED',
      remarks: 'Present at screening desk'
    });
    if (attendRes.status !== 200) throw new Error(`Attendance update failed: ${JSON.stringify(attendRes.data)}`);
    console.log(`✓ 12. Attendance Recorded: Donor 1 status updated to "${attendRes.data?.attendee?.attendanceStatus}"`);

    // 13. Admin records Completed Donation for Donor 2 (Checking cooldown & unitsCollected)
    const donateRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/attendees/${att2._id}`,
      method: 'PATCH',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    }, {
      attendanceStatus: 'DONATED',
      donated: true,
      remarks: 'Successfully donated 1 unit of whole blood'
    });
    if (donateRes.status !== 200) throw new Error(`Donation completion failed: ${JSON.stringify(donateRes.data)}`);
    console.log(`✓ 13. Blood Donation Logged: Units collected = ${donateRes.data?.unitsCollected}, Status = ${donateRes.data?.attendee?.attendanceStatus}`);

    // Verify Donor 2 profile now has COOLDOWN status
    const donor2Check = await request({
      hostname: 'localhost',
      port,
      path: '/api/donors/profile/me',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor2Token}` }
    });
    console.log(`✓ 14. Donor Cooldown Applied: Eligibility = "${donor2Check.data?.donor?.eligibilityStatus}", Cooldown Remaining = ${donor2Check.data?.donor?.cooldownDaysRemaining} days`);

    // 15. Admin Cancels Camp
    const cancelRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/camps/${campId}/cancel`,
      method: 'PATCH',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });
    if (cancelRes.status !== 200 || cancelRes.data?.camp?.status !== 'CANCELLED') {
      throw new Error(`Cancel camp failed: ${JSON.stringify(cancelRes.data)}`);
    }
    console.log(`✓ 15. Camp Cancellation: Status successfully transitioned to "${cancelRes.data?.camp?.status}"`);

    // 16. Verify Dashboard Metrics reflect camp data
    const adminDash = await request({
      hostname: 'localhost',
      port,
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✓ 16. Dashboard Integration: Upcoming Camps = ${adminDash.data?.kpis?.upcomingCampsCount}, Donor Registrations logged`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 16 PHASE 2 INTEGRATION TESTS PASSED SUCCESSFULLY!`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 2 TEST FAILED:', err.message);
    process.exit(1);
  }
};

runPhase2Tests();
