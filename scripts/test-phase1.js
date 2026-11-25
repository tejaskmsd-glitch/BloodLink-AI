const http = require('http');

// Helper to make HTTP JSON requests
const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

const port = process.env.PORT || 5002;

const runTests = async () => {
  console.log(`🧪 Starting Phase 1 Smart Campus Blood Bank Verification Tests on port ${port}...\n`);
  const baseHeaders = { 'Content-Type': 'application/json' };

  try {
    // 1. Health check
    const health = await request({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET'
    });
    if (health.status !== 200) throw new Error(`Health check failed with status ${health.status}`);
    console.log(`✓ 1. Health Check: [${health.status}] ${health.data?.system || 'OK'}`);

    // 2. Demo Campus Admin Login
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
    if (adminLogin.status !== 200) throw new Error(`Admin login failed with status ${adminLogin.status}: ${JSON.stringify(adminLogin.data)}`);
    console.log(`✓ 2. Campus Admin Login: [${adminLogin.status}] Role: ${adminLogin.data?.user?.role}, College: ${adminLogin.data?.user?.college}`);

    // 3. Demo Student Donor Login
    const donorLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: baseHeaders
    }, {
      email: 'rahul.cse@campus.edu.in',
      password: 'Donor@123'
    });
    if (donorLogin.status !== 200) throw new Error(`Donor login failed with status ${donorLogin.status}: ${JSON.stringify(donorLogin.data)}`);
    const donorToken = donorLogin.data?.token;
    console.log(`✓ 3. Student Donor Login: [${donorLogin.status}] Blood Group: ${donorLogin.data?.user?.profile?.bloodGroup}, Roll: ${donorLogin.data?.user?.profile?.rollNumber}, Hostel: ${donorLogin.data?.user?.profile?.hostel}`);

    // 4. Demo Recipient Login
    const recipientLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: baseHeaders
    }, {
      email: 'recipient@campus.edu.in',
      password: 'Recipient@123'
    });
    if (recipientLogin.status !== 200) throw new Error(`Recipient login failed with status ${recipientLogin.status}: ${JSON.stringify(recipientLogin.data)}`);
    const recipientToken = recipientLogin.data?.token;
    console.log(`✓ 4. Recipient Login: [${recipientLogin.status}] Name: ${recipientLogin.data?.user?.name}, Role: ${recipientLogin.data?.user?.role}`);

    // 5. Register a New Student Donor with Indian Campus Details
    const uniqueStudentEmail = `test.student.${Date.now()}@campus.edu.in`;
    const regRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/register',
      method: 'POST',
      headers: baseHeaders
    }, {
      name: 'Aditya Kumar',
      email: uniqueStudentEmail,
      password: 'Student@123',
      phone: '+91 99887 66554',
      role: 'DONOR',
      college: 'National Institute of Technology',
      department: 'Mechanical Engineering',
      userType: 'STUDENT',
      extraDetails: {
        bloodGroup: 'B+',
        rollNumber: '23ME1055',
        hostel: 'Hostel Block 4, Room 302',
        availabilityStatus: 'AVAILABLE',
        dateOfBirth: '2004-02-18',
        gender: 'Male'
      }
    });
    if (regRes.status !== 201) throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    console.log(`✓ 5. Student Registration: [${regRes.status}] Created: ${regRes.data?.user?.name}, Roll: ${regRes.data?.user?.profile?.rollNumber}, Dept: ${regRes.data?.user?.profile?.department}`);

    // 6. Update Donor Availability Toggle
    const updateAvail = await request({
      hostname: 'localhost',
      port,
      path: '/api/donors/profile/me',
      method: 'PUT',
      headers: { ...baseHeaders, Authorization: `Bearer ${donorToken}` }
    }, {
      availabilityStatus: 'TEMP_UNAVAILABLE'
    });
    if (updateAvail.status !== 200) throw new Error(`Update availability failed with status ${updateAvail.status}: ${JSON.stringify(updateAvail.data)}`);
    console.log(`✓ 6. Availability Status Toggle: [${updateAvail.status}] New Status: ${updateAvail.data?.donor?.availabilityStatus}`);

    // Toggle back to AVAILABLE
    const restoreAvail = await request({
      hostname: 'localhost',
      port,
      path: '/api/donors/profile/me',
      method: 'PUT',
      headers: { ...baseHeaders, Authorization: `Bearer ${donorToken}` }
    }, {
      availabilityStatus: 'AVAILABLE'
    });
    if (restoreAvail.status !== 200) throw new Error(`Restore availability failed with status ${restoreAvail.status}`);
    console.log(`✓ 7. Restored Availability Status: [200] Status: AVAILABLE`);

    // 8. Campus Admin Dashboard Summary
    const adminDash = await request({
      hostname: 'localhost',
      port,
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminLogin.data?.token}` }
    });
    if (adminDash.status !== 200) throw new Error(`Admin dashboard failed with status ${adminDash.status}: ${JSON.stringify(adminDash.data)}`);
    console.log(`✓ 8. Campus Admin Dashboard: [${adminDash.status}] Total Donors: ${adminDash.data?.kpis?.totalDonors}, Available: ${adminDash.data?.kpis?.availableDonors}, Camps: ${adminDash.data?.upcomingCamps?.length}`);

    // 9. Student Donor Dashboard Summary
    const donorDash = await request({
      hostname: 'localhost',
      port,
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${donorToken}` }
    });
    if (donorDash.status !== 200) throw new Error(`Donor dashboard failed with status ${donorDash.status}: ${JSON.stringify(donorDash.data)}`);
    console.log(`✓ 9. Student Dashboard: [${donorDash.status}] Blood Group: ${donorDash.data?.kpis?.bloodGroup}, Eligibility: ${donorDash.data?.kpis?.eligibilityStatus}, Upcoming Camps Available: ${donorDash.data?.upcomingCamps?.length}`);

    // 10. Recipient Create Blood Request & Dashboard
    const reqCreate = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${recipientToken}` }
    }, {
      patientReference: 'Emergency Patient Priya Attendant',
      bloodGroup: 'B+',
      component: 'Whole Blood',
      quantity: 1,
      urgency: 'URGENT',
      reason: 'Elective surgery at City Govt Hospital',
      hospitalName: 'Victoria Govt Hospital',
      contactPhone: '+91 98112 33445'
    });
    if (reqCreate.status !== 201) throw new Error(`Recipient request creation failed with status ${reqCreate.status}: ${JSON.stringify(reqCreate.data)}`);
    console.log(`✓ 10. Recipient Blood Request Created: [${reqCreate.status}] Request ID: ${reqCreate.data?.request?._id}, Status: ${reqCreate.data?.request?.status}`);

    console.log('\n🎉 ALL PHASE 1 INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
};

runTests();
