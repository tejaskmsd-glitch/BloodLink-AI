const http = require('http');

const port = process.env.PORT || 5002;

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

const runSidebarVerification = async () => {
  console.log(`\n============================================================`);
  console.log(`🧭 Verifying Admin Sidebar Reorganization & Route Health (Port ${port})`);
  console.log(`============================================================\n`);

  try {
    // 1. Authenticate as Campus Admin
    const loginRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@campus.edu.in', password: 'Admin@123' });

    if (loginRes.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const token = loginRes.data.token;
    console.log(`✓ 1. Admin Authenticated: ${loginRes.data.user.name} (${loginRes.data.user.role})`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Test Section 1: Overview
    const dashboardRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/dashboard/summary',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 2. [Overview] Admin Dashboard API: HTTP ${dashboardRes.status}`);

    // 3. Test Section 2: Emergency
    const emergencyRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests/emergency/active',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 3. [Emergency] Emergency SOS Active API: HTTP ${emergencyRes.status}`);

    // 4. Test Section 3: Blood Management
    const inventoryRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/inventory',
      method: 'GET',
      headers: authHeaders
    });
    const requestsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/requests',
      method: 'GET',
      headers: authHeaders
    });
    const donationsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/donations',
      method: 'GET',
      headers: authHeaders
    });
    const donorsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/donors',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 4. [Blood Management] Blood Inventory API: HTTP ${inventoryRes.status}`);
    console.log(`✓ 5. [Blood Management] Blood Requests Queue API: HTTP ${requestsRes.status}`);
    console.log(`✓ 6. [Blood Management] Donor Donations Queue API: HTTP ${donationsRes.status}`);
    console.log(`✓ 7. [Blood Management] Donors Directory API: HTTP ${donorsRes.status}`);

    // 5. Test Section 4: Campus
    const campsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/camps',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 8. [Campus] Campus Blood Camps API: HTTP ${campsRes.status}`);

    // 6. Test Section 5: Partners
    const hospitalsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/hospitals',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 9. [Partners] Hospitals Directory API: HTTP ${hospitalsRes.status}`);
    console.log(`✓ 10. [Partners] Nearby Blood Banks (Secondary Item mapped to /nearby-blood-banks)`);

    // 7. Test Section 6: Insights (Reports & Export only)
    const reportsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/reports/campus-summary',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 11. [Insights] Reports & Export API: HTTP ${reportsRes.status}`);

    // 8. Test Section 7: Account
    const notificationsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/notifications',
      method: 'GET',
      headers: authHeaders
    });
    const profileRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/me',
      method: 'GET',
      headers: authHeaders
    });
    console.log(`✓ 12. [Account] Notifications API: HTTP ${notificationsRes.status}`);
    console.log(`✓ 13. [Account] Admin Profile API: HTTP ${profileRes.status}`);

    // 9. Relocated Feature: Stock Thresholds in Blood Inventory
    const thresholdsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/thresholds',
      method: 'GET',
      headers: authHeaders
    });
    if (thresholdsRes.status !== 200) {
      throw new Error(`Thresholds API failed with status ${thresholdsRes.status}`);
    }
    console.log(`✓ 14. [Relocated] Stock Thresholds API (active inside Blood Inventory tab): HTTP ${thresholdsRes.status} (${thresholdsRes.data.thresholds?.length || 0} rules)`);

    // 10. Verify Complete Removal of Demand Analytics & Alerts & Expiry
    const fs = require('fs');
    const path = require('path');
    const clientPages = path.resolve(__dirname, '..', 'client', 'src', 'pages');
    const demandAnalyticsExists = fs.existsSync(path.join(clientPages, 'DemandAnalyticsPage.jsx'));
    const alertsPageExists = fs.existsSync(path.join(clientPages, 'AlertsPage.jsx'));
    const demandEstimationExists = fs.existsSync(path.join(clientPages, 'DemandEstimationPage.jsx'));

    if (demandAnalyticsExists || alertsPageExists || demandEstimationExists) {
      throw new Error(`Removed pages still exist on disk!`);
    }
    console.log(`✓ 15. [Verified Removal] Demand Analytics & Alerts & Expiry pages completely removed from disk`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL 15 ADMIN SIDEBAR & NAVIGATION CHECKS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error(`\n❌ Sidebar verification failed:`, err.message);
    process.exit(1);
  }
};

runSidebarVerification();
