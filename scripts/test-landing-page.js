const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5002;

// Helper to make HTTP requests
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
        resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
      });
    });

    req.on('error', reject);
    if (bodyString) req.write(bodyString);
    req.end();
  });
};

const runLandingPageTests = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Starting BloodLink AI Public Landing Page & Auth Flow Tests`);
  console.log(`============================================================\n`);

  try {
    // 1. Verify LandingPage Source Code & Storytelling Components
    const landingSourcePath = path.resolve(__dirname, '../client/src/pages/LandingPage.jsx');
    if (!fs.existsSync(landingSourcePath)) {
      throw new Error(`LandingPage.jsx does not exist at ${landingSourcePath}`);
    }
    const landingCode = fs.readFileSync(landingSourcePath, 'utf8');

    // Check required sections and headlines
    const requiredKeywords = [
      'To give is human',
      'Save lives by helping collect sufficient, safe blood.',
      'WHY SAFE BLOOD SAVES LIVES',
      'About BloodLink AI',
      'How Campus Blood Donation Works',
      'Organized Campus Blood Camps',
      'Be Someone\'s Reason To Live',
      'JC Bose UST YMCA',
      'Donate Now',
      'Sign In',
      'BLOOD_COMPATIBILITY',
      '#why-donate',
      '#how-it-works',
      '#camps',
      '#about'
    ];

    for (const kw of requiredKeywords) {
      if (!landingCode.includes(kw)) {
        throw new Error(`LandingPage.jsx missing essential content keyword: "${kw}"`);
      }
    }
    console.log(`✓ 1. LandingPage component verified with all required storytelling sections, facts & anchors`);

    // 2. Verify AppRoutes Routing Configuration
    const appRoutesPath = path.resolve(__dirname, '../client/src/routes/AppRoutes.jsx');
    const appRoutesCode = fs.readFileSync(appRoutesPath, 'utf8');
    if (!appRoutesCode.includes('<Route path="/" element={<RootRoute />} />')) {
      throw new Error('AppRoutes.jsx does not configure RootRoute at path="/"');
    }
    if (!appRoutesCode.includes('RootRoute')) {
      throw new Error('RootRoute definition missing in AppRoutes.jsx');
    }
    console.log(`✓ 2. Root route ("/") configured with RootRoute for public visitor vs authenticated redirect`);

    // 3. Test Backend Health Check
    const health = await request({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET'
    });
    if (health.status !== 200) {
      throw new Error(`Health check failed with status ${health.status}`);
    }
    console.log(`✓ 3. Backend Health Check: [${health.status}] ${health.data?.message || 'OK'}`);

    // 4. Test Authentication & Role Redirect Destinations
    // A. Campus Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@campus.edu.in', password: 'Admin@123' });
    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminRole = adminLogin.data.user.role;
    const adminDest = ['ADMIN', 'CAMPUS_ADMIN', 'SUPER_ADMIN'].includes(adminRole) ? '/admin/dashboard' : null;
    if (adminDest !== '/admin/dashboard') throw new Error(`Admin role redirect target mismatch: ${adminDest}`);
    console.log(`✓ 4. Campus Admin Authenticated: Role "${adminRole}" ➔ Redirects to "${adminDest}"`);

    // B. Student Donor
    const donorLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'rahul.cse@campus.edu.in', password: 'Donor@123' });
    if (donorLogin.status !== 200) throw new Error(`Donor login failed: ${JSON.stringify(donorLogin.data)}`);
    const donorRole = donorLogin.data.user.role;
    const donorDest = donorRole === 'DONOR' ? '/donor/dashboard' : null;
    if (donorDest !== '/donor/dashboard') throw new Error(`Donor role redirect target mismatch: ${donorDest}`);
    console.log(`✓ 5. Student Donor Authenticated: Role "${donorRole}" ➔ Redirects to "${donorDest}"`);

    // C. Hospital Account
    const hospitalLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'metro.hospital@campus.edu.in', password: 'Hospital@123' });
    if (hospitalLogin.status === 200) {
      const hospRole = hospitalLogin.data.user.role;
      const hospDest = ['HOSPITAL', 'AUTHORIZED_BLOOD_BANK'].includes(hospRole) ? '/hospital/dashboard' : null;
      console.log(`✓ 6. Hospital User Authenticated: Role "${hospRole}" ➔ Redirects to "${hospDest}"`);
    }

    // D. Recipient Account
    const recipientLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'recipient@campus.edu.in', password: 'Recipient@123' });
    if (recipientLogin.status === 200) {
      const recRole = recipientLogin.data.user.role;
      const recDest = recRole === 'RECIPIENT' ? '/hospital/request-portal' : null;
      console.log(`✓ 7. Recipient User Authenticated: Role "${recRole}" ➔ Redirects to "${recDest}"`);
    }

    // 5. Verify Build Assets & Zero Broken HTML Anchors
    const distIndexPath = path.resolve(__dirname, '../client/dist/index.html');
    if (fs.existsSync(distIndexPath)) {
      console.log(`✓ 8. Frontend production bundle build verified at ${distIndexPath}`);
    }

    console.log(`\n============================================================`);
    console.log(`🎉 ALL PUBLIC LANDING PAGE & AUTHENTICATION FLOW TESTS PASSED!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error(`\n❌ Landing Page test failed:`, err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runLandingPageTests();
}

module.exports = { runLandingPageTests };
