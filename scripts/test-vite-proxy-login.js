const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const node = process.execPath;

const request = (url, options = {}, postData = null) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: { ...(options.headers || {}) }
    };

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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTest = async () => {
  console.log(`\n============================================================`);
  console.log(`🧪 Testing Full-Stack Vite Proxy & Authentication Flow`);
  console.log(`============================================================\n`);

  let apiProcess = null;
  let viteProcess = null;

  try {
    // 1. Start Backend API
    console.log(`1. Launching Backend API server on port 5002...`);
    apiProcess = spawn(node, [path.join(projectRoot, 'server', 'server.js')], {
      cwd: path.join(projectRoot, 'server'),
      stdio: 'pipe'
    });

    apiProcess.stderr.on('data', data => console.error(`[API STDERR] ${data}`));

    // Wait for API to become ready
    let apiReady = false;
    for (let i = 0; i < 30; i++) {
      await wait(500);
      try {
        const res = await request('http://localhost:5002/api/health');
        if (res.status === 200) {
          apiReady = true;
          break;
        }
      } catch (_) {}
    }

    if (!apiReady) throw new Error('Backend API failed to start on port 5002');
    console.log(`✓ 1. Backend API is UP and healthy on http://localhost:5002/api/health`);

    // 2. Start Vite Dev Server
    console.log(`2. Launching Vite dev server on port 5173...`);
    viteProcess = spawn(node, [path.join(projectRoot, 'client', 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173'], {
      cwd: path.join(projectRoot, 'client'),
      stdio: 'pipe'
    });

    viteProcess.stderr.on('data', data => console.error(`[Vite STDERR] ${data}`));

    // Wait for Vite to become ready
    let viteReady = false;
    for (let i = 0; i < 30; i++) {
      await wait(500);
      try {
        const res = await request('http://localhost:5173');
        if (res.status === 200 && res.raw.includes('<div id="root">')) {
          viteReady = true;
          break;
        }
      } catch (_) {}
    }

    if (!viteReady) throw new Error('Vite dev server failed to start on port 5173');
    console.log(`✓ 2. Vite dev server is UP and serving SPA on http://localhost:5173`);

    // 3. Test Vite Proxy to Backend Health
    console.log(`3. Testing Vite Proxy: GET http://localhost:5173/api/health ...`);
    const proxyHealthRes = await request('http://localhost:5173/api/health');
    if (proxyHealthRes.status !== 200 || proxyHealthRes.data?.status !== 'UP') {
      throw new Error(`Vite proxy failed: ${proxyHealthRes.status} ${JSON.stringify(proxyHealthRes.data)}`);
    }
    console.log(`✓ 3. Vite proxy successfully routed /api/health -> Port 5002 (System: ${proxyHealthRes.data?.system})`);

    // 4. Test Frontend Login Flow through Vite Proxy (Simulating Browser Sign-in)
    console.log(`4. Testing Login via Vite Proxy: POST http://localhost:5173/api/auth/login ...`);
    const loginRes = await request('http://localhost:5173/api/auth/login', { method: 'POST' }, {
      email: 'admin@campus.edu.in',
      password: 'Admin@123'
    });

    if (loginRes.status !== 200 || !loginRes.data?.success || !loginRes.data?.token) {
      throw new Error(`Login through proxy failed: ${loginRes.status} ${JSON.stringify(loginRes.data)}`);
    }

    console.log(`✓ 4. Login via Vite Proxy SUCCESSFUL!`);
    console.log(`     User: ${loginRes.data.user.name}`);
    console.log(`     Role: ${loginRes.data.user.role}`);
    console.log(`     Token Length: ${loginRes.data.token.length} chars (Valid JWT)`);

    // 5. Test Non-API Route (Verifying React SPA Router is not hijacked)
    console.log(`5. Verifying SPA HTML is returned for route /login ...`);
    const spaRes = await request('http://localhost:5173/login');
    if (spaRes.status !== 200 || !spaRes.raw.includes('<div id="root">')) {
      throw new Error(`SPA route returned unexpected response`);
    }
    console.log(`✓ 5. SPA routes verified: HTML shell served correctly for client-side navigation`);

    console.log(`\n============================================================`);
    console.log(`🎉 ALL VITE PROXY & AUTHENTICATION TESTS PASSED!`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Test Failed:`, err.message);
    process.exit(1);
  } finally {
    if (apiProcess) apiProcess.kill('SIGKILL');
    if (viteProcess) viteProcess.kill('SIGKILL');
  }
};

runTest();
