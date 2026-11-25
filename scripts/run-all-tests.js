const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const port = 5002;

// Clean up any stale process on 5002 first
try {
  const stalePids = execSync(`lsof -ti :${port} 2>/dev/null`, { encoding: 'utf8' }).trim();
  if (stalePids) {
    stalePids.split('\n').filter(Boolean).forEach(pid => {
      try { process.kill(Number(pid), 'SIGKILL'); } catch (_) {}
    });
  }
} catch (_) {}

console.log(`Starting backend server on port ${port}...`);

const serverProcess = spawn('node', ['server/server.js'], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port) },
  stdio: 'inherit'
});

const waitForServer = async (maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const isUp = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/api/health`, (res) => {
          if (res.statusCode === 200) resolve(true);
          else resolve(false);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (isUp) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
};

const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Running ${scriptName}...`);
    const proc = spawn('node', [scriptName], {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(port) },
      stdio: 'inherit'
    });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} failed with exit code ${code}`));
    });
  });
};

const main = async () => {
  try {
    const ready = await waitForServer();
    if (!ready) {
      throw new Error(`Server failed to start on port ${port} within timeout`);
    }
    console.log(`✓ Server ready on port ${port}\n`);

    // Run Phase 7 tests first
    await runScript('scripts/test-phase7.js');

    // Run sidebar navigation verification
    await runScript('scripts/test-sidebar-navigation.js');

    // Run regression tests
    await runScript('scripts/test-phase1.js');
    await runScript('scripts/test-phase2.js');
    await runScript('scripts/test-phase3.js');

    // Run Nearby Facilities & Indian Localization tests
    await runScript('scripts/test-nearby-facilities.js');

    // Run Donor Downloadable Documents & Certificates tests
    await runScript('scripts/test-donor-documents.js');

    // Run Public Landing Page & Auth Flow tests
    await runScript('scripts/test-landing-page.js');

    console.log(`\n============================================================`);
    console.log(`🎉 ALL TEST SUITES PASSED CLEANLY (PHASE 1, 2, 3, 7 + DOCUMENTS + LANDING PAGE)!`);
    console.log(`============================================================\n`);
  } catch (err) {
    console.error(`\n❌ Test run failed:`, err.message);
    process.exitCode = 1;
  } finally {
    try {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        try { serverProcess.kill('SIGKILL'); } catch (_) {}
      }, 2000);
    } catch (_) {}
  }
};

main();
