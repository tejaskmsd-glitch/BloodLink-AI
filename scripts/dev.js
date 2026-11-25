const { spawn, execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const node = process.execPath;
const backendPort = process.env.PORT || 5002;

// Clean up stale bloodlink dev processes on the backend port before starting
try {
  const stalePids = execSync(`lsof -ti :${backendPort} 2>/dev/null`, { encoding: 'utf8' }).trim();
  if (stalePids) {
    stalePids.split('\n').filter(Boolean).forEach(pid => {
      if (pid && Number(pid) !== process.pid) {
        try {
          process.kill(Number(pid), 'SIGKILL');
          console.log(`[Dev] Cleaned up stale process ${pid} on port ${backendPort}`);
        } catch (_) {}
      }
    });
  }
} catch (_) {
  // Port is already free
}

const services = [
  {
    name: 'API',
    cwd: path.join(projectRoot, 'server'),
    args: [path.join(projectRoot, 'server', 'server.js')]
  },
  {
    name: 'Web client',
    cwd: path.join(projectRoot, 'client'),
    args: [path.join(projectRoot, 'client', 'node_modules', 'vite', 'bin', 'vite.js')]
  }
];

let stopping = false;
const children = services.map(({ name, cwd, args }) => {
  const child = spawn(node, args, {
    cwd,
    stdio: 'inherit'
  });

  child.on('error', (error) => {
    console.error(`[Dev] ${name} could not start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (!stopping) {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      console.error(`[Dev] ${name} stopped (${reason}).`);
      stop(code || 1);
    }
  });

  return child;
});

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill('SIGTERM');
      } catch (_) {}
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        try {
          child.kill('SIGKILL');
        } catch (_) {}
      }
    }
    process.exit(exitCode);
  }, 500).unref();
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
process.on('exit', () => stop(0));
