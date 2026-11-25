const http = require('http');
const path = require('path');
const dotenv = require('./../server/node_modules/dotenv');

// Load environment variables matching server.js logic
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', 'server', '.env') });

let port = process.env.PORT || 5002;

const probePort = (p) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: p,
      path: '/api/health',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
};

const resolveActivePort = async () => {
  if (await probePort(port)) return port;
  if (port !== 5001 && await probePort(5001)) return 5001;
  return port;
};

const makeRequest = (method, path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const runTests = async () => {
  try {
    port = await resolveActivePort();
    console.log(`\n============================================================`);
    console.log(`🧪 Verifying CORS Configuration for Smart Campus Blood Bank`);
    console.log(`Configured CLIENT_URL: ${process.env.CLIENT_URL}`);
    console.log(`Active Backend Port: ${port}`);
    console.log(`============================================================\n`);
    // Test 1: Simple GET request from http://localhost:5175
    const getRes = await makeRequest('GET', '/api/health', {
      Origin: 'http://localhost:5175'
    });
    console.log(`Test 1: GET /api/health with Origin: http://localhost:5175`);
    console.log(`  -> Status: ${getRes.statusCode}`);
    console.log(`  -> Access-Control-Allow-Origin: ${getRes.headers['access-control-allow-origin']}`);
    console.log(`  -> Access-Control-Allow-Credentials: ${getRes.headers['access-control-allow-credentials']}`);

    if (getRes.headers['access-control-allow-origin'] !== 'http://localhost:5175') {
      throw new Error(`Expected Access-Control-Allow-Origin: http://localhost:5175, received: ${getRes.headers['access-control-allow-origin']}`);
    }
    if (getRes.headers['access-control-allow-credentials'] !== 'true') {
      throw new Error(`Expected Access-Control-Allow-Credentials: true`);
    }
    console.log(`  ✓ PASSED: Origin http://localhost:5175 allowed with credentials\n`);

    // Test 2: Preflight OPTIONS request from http://localhost:5175
    const preflightRes = await makeRequest('OPTIONS', '/api/auth/login', {
      Origin: 'http://localhost:5175',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    });
    console.log(`Test 2: Preflight OPTIONS /api/auth/login with Origin: http://localhost:5175`);
    console.log(`  -> Status: ${preflightRes.statusCode}`);
    console.log(`  -> Access-Control-Allow-Origin: ${preflightRes.headers['access-control-allow-origin']}`);
    console.log(`  -> Access-Control-Allow-Methods: ${preflightRes.headers['access-control-allow-methods']}`);

    if (preflightRes.headers['access-control-allow-origin'] !== 'http://localhost:5175') {
      throw new Error(`Preflight did not return allowed origin`);
    }
    console.log(`  ✓ PASSED: Preflight OPTIONS request successfully handled\n`);

    // Test 2B: Dynamic localhost port in dev (e.g. http://localhost:5183)
    const dynamicPortRes = await makeRequest('OPTIONS', '/api/auth/login', {
      Origin: 'http://localhost:5183',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    });
    console.log(`Test 2B: Preflight OPTIONS /api/auth/login with dynamic dev port: http://localhost:5183`);
    console.log(`  -> Status: ${dynamicPortRes.statusCode}`);
    console.log(`  -> Access-Control-Allow-Origin: ${dynamicPortRes.headers['access-control-allow-origin']}`);
    if (dynamicPortRes.headers['access-control-allow-origin'] !== 'http://localhost:5183') {
      throw new Error(`Dynamic dev port was not allowed`);
    }
    console.log(`  ✓ PASSED: Dynamic dev port http://localhost:5183 allowed by dev CORS regex\n`);

    // Test 3: Request without Origin header (e.g. CLI, Postman, internal calls)
    const noOriginRes = await makeRequest('GET', '/api/health');
    console.log(`Test 3: Request without Origin header`);
    console.log(`  -> Status: ${noOriginRes.statusCode}`);
    if (noOriginRes.statusCode !== 200) {
      throw new Error(`Expected 200 for request without Origin header`);
    }
    console.log(`  ✓ PASSED: Non-browser request accepted\n`);

    // Test 4: Disallowed Origin check (e.g. http://unauthorized-domain.com)
    const disallowedRes = await makeRequest('GET', '/api/health', {
      Origin: 'http://unauthorized-domain.com'
    });
    console.log(`Test 4: Request with Disallowed Origin: http://unauthorized-domain.com`);
    console.log(`  -> Status: ${disallowedRes.statusCode}`);
    console.log(`  -> Access-Control-Allow-Origin: ${disallowedRes.headers['access-control-allow-origin'] || 'NONE'}`);

    if (disallowedRes.headers['access-control-allow-origin'] === 'http://unauthorized-domain.com') {
      throw new Error(`Disallowed origin was incorrectly allowed!`);
    }
    console.log(`  ✓ PASSED: Unauthorized origin correctly denied\n`);

    console.log(`============================================================`);
    console.log(`🎉 ALL CORS VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ CORS Test Failed:`, err.message);
    process.exit(1);
  }
};

runTests();
