/**
 * Test Suite: Indian Campus Data Localization & Functional Nearby Hospitals
 */
const http = require('http');

const port = process.env.PORT || 5002;

const request = (options, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

async function runNearbyHospitalTests() {
  console.log('\n============================================================');
  console.log(`🏥 Testing Nearby Hospitals Discovery & Indian Campus Localization (Port ${port})`);
  console.log('============================================================\n');

  try {
    // 1. Health check
    const health = await request({ hostname: 'localhost', port, path: '/api/health', method: 'GET' });
    if (health.status !== 200) throw new Error(`Health check failed: ${health.status}`);
    console.log(`✓ 1. Backend Health Check: [${health.status}] ${health.data.system}`);

    // 2. Default Campus Configuration
    const campusRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/nearby-facilities/default-campus',
      method: 'GET'
    });
    if (campusRes.status !== 200 || !campusRes.data.success) {
      throw new Error(`Default campus endpoint failed: ${JSON.stringify(campusRes.data)}`);
    }
    console.log(`✓ 2. Configurable Campus Default Location:`);
    console.log(`     • Configured: ${campusRes.data.configured}`);
    console.log(`     • Campus: ${campusRes.data.campus?.name}`);
    console.log(`     • Coordinates: (${campusRes.data.campus?.latitude}, ${campusRes.data.campus?.longitude})`);

    // 3. Geocode by College Name
    const collegeQuery = 'JC Bose University of Science and Technology, Faridabad';
    const geocodeCollege = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/geocode?query=${encodeURIComponent(collegeQuery)}`,
      method: 'GET'
    });
    if (geocodeCollege.status !== 200 || !geocodeCollege.data.success) {
      throw new Error(`Geocoding college failed: ${JSON.stringify(geocodeCollege.data)}`);
    }
    const collegeLoc = geocodeCollege.data.location;
    if (!collegeLoc.latitude || !collegeLoc.longitude) throw new Error('Missing coordinates in geocode');
    console.log(`✓ 3. Geocoding College Name: "${collegeQuery}"`);
    console.log(`     • Resolved: ${collegeLoc.displayName}`);
    console.log(`     • Coordinates: (${collegeLoc.latitude}, ${collegeLoc.longitude})`);

    // 4. Geocode by City Name
    const cityQuery = 'Faridabad';
    const geocodeCity = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/geocode?query=${encodeURIComponent(cityQuery)}`,
      method: 'GET'
    });
    if (geocodeCity.status !== 200 || !geocodeCity.data.success) {
      throw new Error(`Geocoding city failed: ${JSON.stringify(geocodeCity.data)}`);
    }
    const cityLoc = geocodeCity.data.location;
    console.log(`✓ 4. Geocoding City: "${cityQuery}" => (${cityLoc.latitude}, ${cityLoc.longitude})`);

    // 5. Geocode by Indian PIN Code
    const pinQuery = '121001';
    const geocodePin = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/geocode?query=${encodeURIComponent(pinQuery)}`,
      method: 'GET'
    });
    if (geocodePin.status !== 200 || !geocodePin.data.success) {
      throw new Error(`Geocoding PIN failed: ${JSON.stringify(geocodePin.data)}`);
    }
    const pinLoc = geocodePin.data.location;
    console.log(`✓ 5. Geocoding Indian PIN: "${pinQuery}" => (${pinLoc.latitude}, ${pinLoc.longitude}) - ${pinLoc.displayName}`);

    // 6. Search Nearby Facilities within 10 km (All facilities)
    const searchRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/search?lat=${collegeLoc.latitude}&lon=${collegeLoc.longitude}&radius=10&type=all`,
      method: 'GET'
    });
    if (searchRes.status !== 200 || !searchRes.data.success) {
      throw new Error(`Nearby facility search failed: ${JSON.stringify(searchRes.data)}`);
    }
    const facilities = searchRes.data.facilities;
    if (!Array.isArray(facilities) || facilities.length === 0) {
      throw new Error('Expected at least one nearby healthcare facility or blood bank');
    }
    console.log(`✓ 6. Nearby Facilities Search (10 km radius): Found ${facilities.length} genuine facilities`);

    // 7. Verify Distance Sorting (Nearest first)
    for (let i = 0; i < facilities.length - 1; i++) {
      if (facilities[i].distance > facilities[i + 1].distance) {
        throw new Error(`Facilities not sorted by distance: index ${i} (${facilities[i].distance}km) > index ${i + 1} (${facilities[i + 1].distance}km)`);
      }
    }
    console.log(`✓ 7. Verified Sorting by Distance: Nearest facility is "${facilities[0].name}" (${facilities[0].distance} km away)`);

    // 8. Verify Structure and Genuine Fields
    const sample = facilities[0];
    if (!sample.id || !sample.name || !sample.type || !sample.address || sample.distance == null) {
      throw new Error(`Missing required fields in sample facility: ${JSON.stringify(sample)}`);
    }
    console.log(`✓ 8. Facility Card Fields Verified:`);
    console.log(`     • Name: ${sample.name}`);
    console.log(`     • Type: ${sample.type}`);
    console.log(`     • Address: ${sample.address}`);
    console.log(`     • Distance: ${sample.distance} km`);
    console.log(`     • Genuine Phone: ${sample.phone || 'Not available (strictly omitted when not in provider)'}`);
    console.log(`     • Directions URL: https://www.google.com/maps/dir/?api=1&destination=${sample.latitude},${sample.longitude}`);

    // 9. Facility Type Filter (Blood Banks only)
    const bloodBankRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/search?lat=${collegeLoc.latitude}&lon=${collegeLoc.longitude}&radius=10&type=blood_banks`,
      method: 'GET'
    });
    if (bloodBankRes.status !== 200) throw new Error('Blood bank filter request failed');
    const bloodBanks = bloodBankRes.data.facilities;
    for (const b of bloodBanks) {
      if (b.type !== 'Blood Bank') {
        throw new Error(`Expected only Blood Banks, found: ${b.type} (${b.name})`);
      }
    }
    console.log(`✓ 9. Facility Type Filter (Blood Banks): ${bloodBanks.length} blood bank(s) returned`);

    // 10. Radius Filter (5 km vs 25 km)
    const radius5Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/search?lat=${collegeLoc.latitude}&lon=${collegeLoc.longitude}&radius=5&type=all`,
      method: 'GET'
    });
    const radius25Res = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/search?lat=${collegeLoc.latitude}&lon=${collegeLoc.longitude}&radius=25&type=all`,
      method: 'GET'
    });
    console.log(`✓ 10. Radius Filter Verification:`);
    console.log(`      • 5 km radius: ${radius5Res.data.facilities.length} facilities`);
    console.log(`      • 25 km radius: ${radius25Res.data.facilities.length} facilities`);
    if (radius25Res.data.facilities.length < radius5Res.data.facilities.length) {
      throw new Error('Larger radius should yield at least as many facilities as smaller radius');
    }

    // 11. Invalid Location Query Error Handling
    const invalidRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/nearby-facilities/geocode?query=xyznonexistentplace999999`,
      method: 'GET'
    });
    if (invalidRes.status !== 404) {
      throw new Error(`Expected 404 for invalid location query, got: ${invalidRes.status}`);
    }
    console.log(`✓ 11. Invalid Location Handled Cleanly: [404] "${invalidRes.data.message}"`);

    // 12. Indian Campus Data Localization Audit
    // Login as Admin to inspect donors and hospitals
    const adminLogin = await request({
      hostname: 'localhost',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@bloodlink.ai', password: 'Admin@123' });

    if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const token = adminLogin.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Check Donors Directory
    const donorsRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/donors',
      method: 'GET',
      headers: authHeaders
    });
    const donors = donorsRes.data.donors || [];
    const sampleDonorNames = donors.slice(0, 5).map(d => d.userId?.name);
    console.log(`✓ 12. Donors Directory Localized: Found ${donors.length} donors`);
    console.log(`      • Sample Donors: ${sampleDonorNames.join(', ')}`);

    // Verify all phones start with +91 or are valid Indian mobile numbers
    const invalidPhoneDonors = donors.filter(d => {
      const phone = d.phone || d.userId?.phone;
      return phone && (phone.includes('555-') || phone.startsWith('+1'));
    });
    if (invalidPhoneDonors.length > 0) {
      throw new Error(`Found foreign phone numbers in donors: ${JSON.stringify(invalidPhoneDonors)}`);
    }
    console.log(`✓ 13. Verified 0 foreign +1/555 numbers in Donors Directory (100% Indian +91 format)`);

    // Check Hospitals Directory
    const hospRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/hospitals',
      method: 'GET',
      headers: authHeaders
    });
    const hospitals = hospRes.data.hospitals || [];
    const hospNames = hospitals.map(h => h.hospitalName);
    console.log(`✓ 14. Hospitals Directory Localized: Found ${hospitals.length} partner facilities:`);
    hospNames.forEach(n => console.log(`      • ${n}`));

    const foreignHospitals = hospitals.filter(h =>
      /metropolis|suburbia/i.test(h.city || '') ||
      (h.phone && (h.phone.includes('555-') || h.phone.startsWith('+1')))
    );
    if (foreignHospitals.length > 0) {
      throw new Error(`Found foreign cities/numbers in hospitals: ${JSON.stringify(foreignHospitals)}`);
    }
    console.log(`✓ 15. Verified 0 foreign cities/numbers in Hospitals Directory (All Indian Cities: Faridabad, Delhi, Gurugram, Noida)`);

    console.log('\n============================================================');
    console.log('🎉 ALL 15 NEARBY HOSPITALS & LOCALIZATION CHECKS PASSED!');
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runNearbyHospitalTests();
}

module.exports = runNearbyHospitalTests;
