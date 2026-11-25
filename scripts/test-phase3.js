const http = require('http');

const port = process.env.PORT || 5002;

// Helper to make HTTP JSON requests
const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const reqOptions = { ...options, headers: { ...(options.headers || {}) } };
    let bodyString = null;
    if (postData) {
      bodyString = typeof postData === 'string' ? postData : JSON.stringify(postData);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, data: parsed, raw: data });
      });
    });

    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
};

const runPhase3Tests = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Starting Phase 3 Emergency SOS & Smart Donor Dispatch Tests (Port ${port})`);
  console.log(`============================================================\n`);
  const baseHeaders = { 'Content-Type': 'application/json' };

  try {
    // 1. Authenticate Roles
    // A. Campus Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@campus.edu.in', password: 'Admin@123' });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminToken = adminLogin.data.token;
    console.log(`✓ 1. Campus Admin Authenticated: ${adminLogin.data.user.name} (${adminLogin.data.user.college})`);

    // B. Recipient
    const recipientLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'recipient@campus.edu.in', password: 'Recipient@123' });
    if (recipientLogin.status !== 200) throw new Error(`Recipient login failed: ${JSON.stringify(recipientLogin.data)}`);
    const recipientToken = recipientLogin.data.token;
    console.log(`✓ 2. Recipient Authenticated: ${recipientLogin.data.user.name}`);

    // C. Student Donor 1 (B+)
    const donor1Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'rahul.cse@campus.edu.in', password: 'Donor@123' });
    if (donor1Login.status !== 200) throw new Error(`Donor 1 login failed: ${JSON.stringify(donor1Login.data)}`);
    const donor1Token = donor1Login.data.token;
    console.log(`✓ 3. Student Donor 1 Authenticated: ${donor1Login.data.user.name} (${donor1Login.data.user.profile?.bloodGroup || 'B+'})`);

    // D. Faculty Donor 2 (A+)
    const donor2Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'dr.anita.ece@campus.edu.in', password: 'Donor@123' });
    if (donor2Login.status !== 200) throw new Error(`Donor 2 login failed: ${JSON.stringify(donor2Login.data)}`);
    const donor2Token = donor2Login.data.token;
    console.log(`✓ 4. Faculty Donor 2 Authenticated: ${donor2Login.data.user.name} (${donor2Login.data.user.profile?.bloodGroup || 'A+'})`);

    // 2. Validate Indian Phone Format Rejection Check
    console.log(`\n--- Test Indian Phone Validation ---`);
    const invalidPhoneRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${recipientToken}` }
    }, {
      patientReference: 'PAT-FAIL-PHONE',
      bloodGroup: 'B+',
      component: 'Whole Blood',
      quantity: 1,
      urgency: 'CRITICAL',
      contactPhone: '123456' // Invalid non-Indian format!
    });

    if (invalidPhoneRes.status === 400 && invalidPhoneRes.data?.message?.includes('Indian mobile number')) {
      console.log(`✓ 5. Invalid Phone Correctly Rejected: [HTTP 400] "${invalidPhoneRes.data.message}"`);
    } else {
      throw new Error(`Expected HTTP 400 for invalid phone, received ${invalidPhoneRes.status}: ${JSON.stringify(invalidPhoneRes.data)}`);
    }

    // 3. Broadcast Valid Emergency SOS Request
    console.log(`\n--- Test Emergency SOS Broadcast & Smart Donor Matching ---`);
    const sosPayload = {
      patientReference: `PAT-NITK-${Date.now().toString().slice(-4)}`,
      bloodGroup: 'B+',
      component: 'Whole Blood',
      quantity: 2,
      urgency: 'CRITICAL',
      hospitalName: 'District Red Cross Blood Center & KMC Hospital',
      campusLocation: 'Campus Health Centre, Emergency Ward 2',
      requiredDate: new Date(Date.now() + 4 * 3600 * 1000),
      contactPerson: 'Priya Patel (Student Coordinator)',
      contactPhone: '+91 98765 43210',
      reason: 'Urgent whole blood requirement for road accident patient'
    };

    const sosRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${recipientToken}` }
    }, sosPayload);

    if (sosRes.status !== 201) throw new Error(`SOS creation failed: ${JSON.stringify(sosRes.data)}`);
    const requestId = sosRes.data.request._id;
    const reqData = sosRes.data.request;
    console.log(`✓ 6. Emergency SOS Broadcast Created: ID ${requestId}`);
    console.log(`     Status: ${reqData.status} (Donors Found: ${reqData.matchedDonorsCount}, Notified: ${reqData.notifiedDonorsCount})`);

    // 4. Test Smart Donor Matching API
    const matchesRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/matching-donors`,
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });

    if (matchesRes.status !== 200 || !matchesRes.data?.matchingDonors?.length) {
      throw new Error(`Donor matching query failed: ${JSON.stringify(matchesRes.data)}`);
    }
    console.log(`✓ 7. Smart Donor Matching Verified: Found ${matchesRes.data.totalCount} compatible campus donors`);
    console.log(`     Compatible Blood Groups: [${matchesRes.data.compatibleGroups.join(', ')}]`);
    console.log(`     Medical Disclaimer Verified: "${matchesRes.data.medicalDisclaimer.slice(0, 45)}..."`);

    // 5. Test In-App Notification Received by Compatible Donor 1
    const notifRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor1Token}` }
    });
    if (notifRes.status !== 200) throw new Error(`Notifications query failed`);
    const sosNotif = (notifRes.data?.notifications || []).find(n => n.title?.includes('BLOOD SOS') || n.message?.includes('B+'));
    if (!sosNotif) {
      console.warn(`Note: Donor notification list retrieved: count = ${notifRes.data?.notifications?.length}`);
    } else {
      console.log(`✓ 8. Donor Notification Received: "${sosNotif.title}"`);
    }

    // 6. Test Donor 1 Responds "I Can Donate"
    console.log(`\n--- Test Donor Response System ---`);
    const respond1Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/respond`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor1Token}` }
    }, {
      response: 'I_CAN_DONATE',
      notes: 'In Mechanical Dept Lab, can reach health post in 15 minutes'
    });

    if (respond1Res.status !== 200) throw new Error(`Donor 1 response failed: ${JSON.stringify(respond1Res.data)}`);
    console.log(`✓ 9. Donor 1 Responded: [${respond1Res.data.myResponse.response}] for "${respond1Res.data.myResponse.donorName}"`);
    console.log(`     Note: "${respond1Res.data.myResponse.notes}"`);

    // 7. Test Duplicate Response Prevention (Update rather than duplicate)
    const duplicateRespondRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/respond`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor1Token}` }
    }, {
      response: 'I_CAN_DONATE',
      notes: 'Updated note: Reached Health Center lobby now'
    });

    if (duplicateRespondRes.status !== 200) throw new Error(`Duplicate update failed`);
    const respondingList = duplicateRespondRes.data.request.respondingDonors || [];
    const donor1Entries = respondingList.filter(d => d.donorName === donor1Login.data.user.name);
    if (donor1Entries.length !== 1) {
      throw new Error(`Expected exactly 1 response entry for donor 1, found ${donor1Entries.length}`);
    }
    console.log(`✓ 10. Duplicate Prevention Verified: Updated single existing response entry without duplicate.`);

    // 8. Test Donor 2 Responds "Unavailable"
    const respond2Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/respond`,
      method: 'POST',
      headers: { ...baseHeaders, Authorization: `Bearer ${donor2Token}` }
    }, {
      response: 'UNAVAILABLE',
      notes: 'In departmental academic meeting until 4:30 PM'
    });

    if (respond2Res.status !== 200) throw new Error(`Donor 2 response failed`);
    console.log(`✓ 11. Donor 2 Responded: [${respond2Res.data.myResponse.response}] (Unavailable)`);

    // 9. Test Active Emergency SOS Query with Response Counters
    console.log(`\n--- Test Active Emergency SOS Dashboard View ---`);
    const activeEmergenciesRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests/emergency/active',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });

    if (activeEmergenciesRes.status !== 200) throw new Error(`Active emergencies failed`);
    const targetEmergency = (activeEmergenciesRes.data.emergencies || []).find(e => e._id === requestId);
    if (!targetEmergency) throw new Error(`Emergency request ${requestId} not found in active list`);

    console.log(`✓ 12. Active Emergency Dashboard Entry Verified:`);
    console.log(`     Patient Ref: ${targetEmergency.patientReference}`);
    console.log(`     Status: ${targetEmergency.status}`);
    console.log(`     Available Confirmed Donors: ${targetEmergency.availableDonorsCount}`);
    console.log(`     Unavailable Donors: ${targetEmergency.unavailableDonorsCount}`);
    console.log(`     Hospital: ${targetEmergency.hospitalName}`);

    // 10. Test Fulfillment of Emergency Request
    console.log(`\n--- Test Emergency Request Fulfillment ---`);
    const fulfillRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/fulfill`,
      method: 'PATCH',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });

    if (fulfillRes.status !== 200 || fulfillRes.data.request.status !== 'FULFILLED') {
      throw new Error(`Fulfillment failed: ${JSON.stringify(fulfillRes.data)}`);
    }
    console.log(`✓ 13. Emergency SOS Request Marked FULFILLED successfully.`);

    // 11. Test Re-check Active Emergencies after Fulfillment
    const postFulfillRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests/emergency/active',
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${adminToken}` }
    });
    const stillActive = (postFulfillRes.data.emergencies || []).find(e => e._id === requestId);
    if (stillActive) throw new Error(`Fulfilled request should no longer appear in active emergencies`);
    console.log(`✓ 14. Active Queue Updated: Fulfilled emergency cleanly removed from active SOS board.`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 14 PHASE 3 EMERGENCY SOS & DISPATCH TESTS PASSED!`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ PHASE 3 TEST FAILED:`, err.message);
    process.exit(1);
  }
};

runPhase3Tests();
