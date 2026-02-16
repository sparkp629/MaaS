import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const BACKEND_PORT = 3101;
const PREVIEW_PORT = 4173;

function npmCommand() {
  return 'npm';
}

function logStep(step, message) {
  console.log(`[TEST][STEP ${step}] ${message}`);
}

function runCommand(step, label, command, args, options = {}) {
  return new Promise((resolve, reject) => {
    logStep(step, `${label} — START`);
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      ...options,
    });

    child.stdout.on('data', (chunk) => {
      process.stdout.write(`[TEST][STEP ${step}][OUT] ${chunk}`);
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(`[TEST][STEP ${step}][ERR] ${chunk}`);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        logStep(step, `${label} — SUCCESS`);
        resolve();
      } else {
        logStep(step, `${label} — ERROR (exit ${code})`);
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
  });
}

async function killProcessTree(child, step, label) {
  if (!child || child.killed) return;
  logStep(step, `${label} — STOP`);
  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
      });
      killer.on('exit', resolve);
    });
  } else {
    child.kill('SIGTERM');
  }
}

async function waitForHttp(step, url, retries = 20, delayMs = 500) {
  logStep(step, `Probe ${url} — START`);
  for (let i = 1; i <= retries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        logStep(step, `Probe ${url} — SUCCESS (${res.status}) on try ${i}`);
        return;
      }
    } catch {
      // retry
    }
    await sleep(delayMs);
  }
  logStep(step, `Probe ${url} — ERROR (timeout)`);
  throw new Error(`Timeout while probing ${url}`);
}

async function jsonCheck(step, url, name) {
  logStep(step, `${name} ${url} — START`);
  const res = await fetch(url);
  if (!res.ok) {
    logStep(step, `${name} ${url} — ERROR (${res.status})`);
    throw new Error(`${name} failed with status ${res.status}`);
  }
  const data = await res.json();
  logStep(step, `${name} ${url} — SUCCESS (${res.status}) keys=${Object.keys(data).join(',')}`);
}

async function htmlCheck(step, url, name) {
  logStep(step, `${name} ${url} — START`);
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok || !text.includes('<div id="root"></div>')) {
    logStep(step, `${name} ${url} — ERROR (${res.status})`);
    throw new Error(`${name} invalid html response`);
  }
  logStep(step, `${name} ${url} — SUCCESS (${res.status})`);
}

async function run() {
  const npm = npmCommand();
  let backend = null;
  let preview = null;

  try {
    await runCommand(1, 'Frontend build', npm, ['run', 'build', '--prefix', 'frontend']);

    logStep(2, 'Backend smoke server — START');
    backend = spawn(npm, ['run', 'start', '--prefix', 'backend'], {
      env: { ...process.env, PORT: String(BACKEND_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    backend.stdout.on('data', (chunk) => process.stdout.write(`[TEST][STEP 2][OUT] ${chunk}`));
    backend.stderr.on('data', (chunk) => process.stderr.write(`[TEST][STEP 2][ERR] ${chunk}`));

    await waitForHttp(2, `http://localhost:${BACKEND_PORT}/health`);
    await jsonCheck(3, `http://localhost:${BACKEND_PORT}/api/dashboard`, 'API');
    await jsonCheck(3, `http://localhost:${BACKEND_PORT}/api/kol`, 'API');
    await jsonCheck(3, `http://localhost:${BACKEND_PORT}/api/intelligence`, 'API');
    await jsonCheck(3, `http://localhost:${BACKEND_PORT}/api/roi`, 'API');
    await jsonCheck(3, `http://localhost:${BACKEND_PORT}/api/status/apis`, 'API');

    logStep(4, 'Frontend preview server — START');
    preview = spawn(
      npm,
      ['run', 'preview', '--prefix', 'frontend', '--', '--host', '127.0.0.1', '--port', String(PREVIEW_PORT)],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      }
    );
    preview.stdout.on('data', (chunk) => process.stdout.write(`[TEST][STEP 4][OUT] ${chunk}`));
    preview.stderr.on('data', (chunk) => process.stderr.write(`[TEST][STEP 4][ERR] ${chunk}`));

    await waitForHttp(4, `http://127.0.0.1:${PREVIEW_PORT}/`);
    await htmlCheck(5, `http://127.0.0.1:${PREVIEW_PORT}/`, 'Preview');
    await htmlCheck(5, `http://127.0.0.1:${PREVIEW_PORT}/app`, 'Preview');

    logStep(6, 'Cycle de tests fullstack — SUCCESS');
  } catch (error) {
    logStep(6, `Cycle de tests fullstack — ERROR: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await killProcessTree(preview, 7, 'Frontend preview server');
    await killProcessTree(backend, 7, 'Backend smoke server');
  }
}

await run();
