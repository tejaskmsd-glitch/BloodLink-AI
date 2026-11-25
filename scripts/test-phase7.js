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

const runPhase7Tests = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Starting Phase 7 Notifications & Campus Analytics Tests (Port ${port})`);
  console.log(`============================================================\n`);

  try {
    // 1. Health check
    const health = await request({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET'
    });
    if (health.status !== 200) throw new Error(`Health check failed with status ${health.status}`);
    console.log(`✓ 1. Backend Health Check: [${health.status}] ${health.data?.system || 'OK'}`);

    // 2. Authenticate Roles
    // A. Campus Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@campus.edu.in', password: 'Admin@123' });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminToken = adminLogin.data.token;
    console.log(`✓ 2. Campus Admin Authenticated: ${adminLogin.data.user.name}`);

    // B. Recipient
    const recipientLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'recipient@campus.edu.in', password: 'Recipient@123' });
    if (recipientLogin.status !== 200) throw new Error(`Recipient login failed: ${JSON.stringify(recipientLogin.data)}`);
    const recipientToken = recipientLogin.data.token;
    console.log(`✓ 3. Recipient Authenticated: ${recipientLogin.data.user.name}`);

    // C. Student Donor 1 (Rahul - B+)
    const donor1Login = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'rahul.cse@campus.edu.in', password: 'Donor@123' });
    if (donor1Login.status !== 200) throw new Error(`Donor 1 login failed: ${JSON.stringify(donor1Login.data)}`);
    const donor1Token = donor1Login.data.token;
    console.log(`✓ 4. Student Donor 1 Authenticated: ${donor1Login.data.user.name} (B+)`);

    // 3. Clear existing notifications for fresh baseline
    await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications/clear-all',
      method: 'DELETE',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications/clear-all',
      method: 'DELETE',
      headers: { Authorization: `Bearer ${recipientToken}` }
    });

    const donorNotifsInitial = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (donorNotifsInitial.data.unreadCount !== 0) {
      throw new Error(`Expected 0 unread notifications, got ${donorNotifsInitial.data.unreadCount}`);
    }
    console.log(`✓ 5. In-App Notifications Baseline Cleared (Donor unreadCount: 0)`);

    // 4. Create Emergency SOS Blood Request (B+ Critical)
    const emergencyReq = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` }
    }, {
      patientReference: 'CAMPUS-SOS-PHASE7-001',
      bloodGroup: 'B+',
      component: 'Whole Blood',
      quantity: 2,
      urgency: 'CRITICAL',
      hospitalName: 'NIT Health Centre & Trauma Care',
      campusLocation: 'Block B Dispensary',
      contactPerson: 'Emergency Coordinator',
      contactPhone: '+91 9876543210',
      reason: 'Urgent surgery requirement on campus',
      notes: 'Patient in critical condition'
    });

    if (emergencyReq.status !== 201) {
      throw new Error(`Failed to create emergency request: ${JSON.stringify(emergencyReq.data)}`);
    }
    const requestId = emergencyReq.data.request._id;
    console.log(`✓ 6. Emergency SOS Created: [${emergencyReq.status}] Ref: ${emergencyReq.data.request.patientReference}`);

    // 5. Verify In-App Notification Broadcast to Compatible Donor (Rahul - B+)
    const donorNotifsAfterSOS = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });

    if (donorNotifsAfterSOS.data.unreadCount < 1) {
      throw new Error(`Expected at least 1 notification for B+ donor, got ${donorNotifsAfterSOS.data.unreadCount}`);
    }
    const sosNotif = donorNotifsAfterSOS.data.notifications.find(n => n.relatedId === requestId.toString());
    if (!sosNotif) {
      throw new Error(`Notification matching requestId ${requestId} not found for donor!`);
    }
    if (!sosNotif.title.includes('B+') || !sosNotif.title.includes('BLOOD SOS')) {
      throw new Error(`Notification title unexpected: ${sosNotif.title}`);
    }
    console.log(`✓ 7. Automated Donor Notification Verified: Title: "${sosNotif.title}", Type: "${sosNotif.type}"`);

    // 6. User Isolation Check: Recipient cannot delete Donor's notification
    const unauthorizedDelete = await request({
      hostname: 'localhost',
      port,
      path: `/api/notifications/${sosNotif._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${recipientToken}` }
    });
    if (unauthorizedDelete.status !== 404) {
      throw new Error(`Expected 404 for cross-user notification delete, got ${unauthorizedDelete.status}`);
    }
    console.log(`✓ 8. User Isolation Enforced: Other user cannot access or delete donor notification`);

    // 7. Donor Responds "I Can Donate"
    const donorResponse = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/respond`,
      method: 'POST',
      headers: { Authorization: `Bearer ${donor1Token}` }
    }, {
      response: 'I_CAN_DONATE',
      notes: 'Available immediately at campus hostel 4'
    });

    if (donorResponse.status !== 200) {
      throw new Error(`Donor response failed: ${JSON.stringify(donorResponse.data)}`);
    }
    console.log(`✓ 9. Donor Responded "I Can Donate": Status: ${donorResponse.data.request.status}`);

    // 8. Verify Recipient and Admin received DONOR_RESPONDED notification
    const recipientNotifs = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${recipientToken}` }
    });

    const donorRespNotif = recipientNotifs.data.notifications.find(
      n => n.type === 'DONOR_RESPONDED' && n.relatedId === requestId.toString()
    );
    if (!donorRespNotif) {
      throw new Error(`Recipient did not receive DONOR_RESPONDED notification`);
    }
    console.log(`✓ 10. Requester Notified on Donor Response: "${donorRespNotif.title}"`);

    // 9. Mark Single Notification as Read
    const markReadRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/notifications/${donorRespNotif._id}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipientToken}` }
    });
    if (markReadRes.status !== 200 || !markReadRes.data.notification.isRead) {
      throw new Error(`Failed to mark notification as read`);
    }
    console.log(`✓ 11. Mark Notification as Read: isRead: true, remaining unread: ${markReadRes.data.unreadCount}`);

    // 10. Mark All Notifications as Read
    const markAllReadRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications/read-all',
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (markAllReadRes.status !== 200 || markAllReadRes.data.unreadCount !== 0) {
      throw new Error(`Failed to mark all notifications as read`);
    }
    console.log(`✓ 12. Mark All Notifications as Read: unreadCount: 0`);

    // 11. Fulfill Request & Verify Notifications to Responding Donor & Requester
    const fulfillRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${requestId}/fulfill`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (fulfillRes.status !== 200) {
      throw new Error(`Failed to fulfill request: ${JSON.stringify(fulfillRes.data)}`);
    }
    console.log(`✓ 13. Request Fulfilled by Admin: Status: ${fulfillRes.data.request.status}`);

    // Check responding donor got thank you / fulfilled notification
    const donorNotifsAfterFulfill = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    const donorFulfillNotif = donorNotifsAfterFulfill.data.notifications.find(
      n => n.type === 'REQUEST_FULFILLED' && n.relatedId === requestId.toString()
    );
    if (!donorFulfillNotif) {
      throw new Error(`Responding donor was not notified of request fulfillment`);
    }
    console.log(`✓ 14. Responding Donor Received Fulfillment Notification: "${donorFulfillNotif.title}"`);

    // 12. Request Cancellation Notification Test
    const emergencyReq2 = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` }
    }, {
      patientReference: 'CAMPUS-SOS-CANCEL-TEST-002',
      bloodGroup: 'B+',
      quantity: 1,
      urgency: 'URGENT',
      hospitalName: 'NIT Health Centre',
      contactPhone: '9876543210',
      reason: 'Testing cancellation dispatch'
    });
    const req2Id = emergencyReq2.data.request._id;

    // Donor responds to req 2
    await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${req2Id}/respond`,
      method: 'POST',
      headers: { Authorization: `Bearer ${donor1Token}` }
    }, { response: 'I_CAN_DONATE' });

    // Admin cancels req 2
    const cancelRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/requests/${req2Id}/cancel`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (cancelRes.status !== 200) {
      throw new Error(`Failed to cancel request: ${JSON.stringify(cancelRes.data)}`);
    }

    // Verify donor received cancellation notification
    const donorNotifsAfterCancel = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    const donorCancelNotif = donorNotifsAfterCancel.data.notifications.find(
      n => n.type === 'REQUEST_CANCELLED' && n.relatedId === req2Id.toString()
    );
    if (!donorCancelNotif) {
      throw new Error(`Responding donor was not notified of request cancellation`);
    }
    console.log(`✓ 15. Standby Released Notification on Cancel: "${donorCancelNotif.title}"`);

    // 13. Delete Single Notification
    const deleteNotifRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/notifications/${donorCancelNotif._id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (deleteNotifRes.status !== 200) {
      throw new Error(`Failed to delete notification: ${JSON.stringify(deleteNotifRes.data)}`);
    }
    console.log(`✓ 16. Single Notification Deleted Successfully`);

    // 14. Campus Analytics Report API (Real Database Aggregate)
    const analyticsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/reports/campus-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (analyticsRes.status !== 200 || !analyticsRes.data.success) {
      throw new Error(`Failed to get campus summary analytics: ${JSON.stringify(analyticsRes.data)}`);
    }
    const summary = analyticsRes.data.summary;
    if (typeof summary.donors.total !== 'number' || summary.donors.total < 1) {
      throw new Error(`Invalid donors count in summary: ${summary.donors.total}`);
    }
    if (typeof summary.donors.available !== 'number') {
      throw new Error(`Missing available donors count in summary`);
    }
    if (!summary.donors.bloodGroupBreakdown || !summary.donors.bloodGroupBreakdown['B+']) {
      throw new Error(`Missing blood group breakdown in summary`);
    }
    if (typeof summary.requests.total !== 'number' || summary.requests.total < 1) {
      throw new Error(`Missing requests total in summary`);
    }
    if (typeof summary.camps.total !== 'number') {
      throw new Error(`Missing camps total in summary`);
    }

    console.log(`✓ 17. Live Campus Analytics Report Verified:`);
    console.log(`      • Total Donors: ${summary.donors.total} (${summary.donors.available} Available on Campus)`);
    console.log(`      • B+ Donors: ${summary.donors.bloodGroupBreakdown['B+']}`);
    console.log(`      • Total Requests: ${summary.requests.total} (Emergency SOS: ${summary.requests.emergencyTotal})`);
    console.log(`      • SOS Fulfillment Rate: ${summary.requests.emergencyFulfillmentRate}%`);
    console.log(`      • Campus Camps: ${summary.camps.total} (Registered: ${summary.camps.totalRegisteredDonors})`);

    // 15. Role Authorization on Reports
    const donorAnalyticsAttempt = await request({
      hostname: 'localhost',
      port,
      path: '/api/reports/campus-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${donor1Token}` }
    });
    if (donorAnalyticsAttempt.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Donor accessing admin analytics, got ${donorAnalyticsAttempt.status}`);
    }
    console.log(`✓ 18. Role Protection Enforced: Donor blocked from Admin Analytics [403 Forbidden]`);

    // 16. Date Filter on Campus Analytics
    const dateFilteredRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/reports/campus-summary?startDate=2020-01-01&endDate=2099-12-31`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (dateFilteredRes.status !== 200 || !dateFilteredRes.data.success) {
      throw new Error(`Date filtered analytics request failed`);
    }
    console.log(`✓ 19. Date Range Filter Verified on Campus Summary Report`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 19/19 PHASE 7 NOTIFICATIONS & ANALYTICS TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (error) {
    console.error(`\n❌ Phase 7 Test Failure:`, error.message);
    process.exit(1);
  }
};

runPhase7Tests();
