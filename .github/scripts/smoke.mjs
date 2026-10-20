// Boots the real backend in a throwaway directory (it creates app-familia.db in its
// working directory) and walks the sign-up / login / auth-guard path over HTTP.
// Run from the repository root after `npm ci` in backend/: node .github/scripts/smoke.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000';
const workdir = mkdtempSync(join(tmpdir(), 'familyquest-smoke-'));
const server = spawn(process.execPath, [resolve('backend/index.js')], {
  cwd: workdir,
  env: { ...process.env, JWT_SECRET: 'smoke-test-secret' },
  stdio: 'inherit',
});

const post = (path, body) =>
  fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(BASE + '/')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Backend did not start within 10 s');
}

try {
  await waitForServer();
  const user = { nombre: 'Smoke', email: 'smoke@example.test', password: 'smoke-password-1' };

  const registro = await post('/registro', user);
  assert.equal(registro.status, 201, 'sign-up should answer 201');

  const duplicado = await post('/registro', user);
  assert.equal(duplicado.status, 409, 'a duplicate email should answer 409');

  const invalido = await post('/registro', { nombre: 'x', email: 'no-es-un-email', password: '1' });
  assert.equal(invalido.status, 400, 'invalid input should answer 400');

  const login = await post('/login', { email: user.email, password: user.password });
  assert.equal(login.status, 200, 'login should answer 200');
  assert.ok((await login.json()).token, 'login should return a token');

  const mala = await post('/login', { email: user.email, password: 'wrong-password' });
  assert.equal(mala.status, 401, 'a wrong password should answer 401');

  const sinToken = await fetch(BASE + '/usuarios/push-token', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ push_token: 'x' }),
  });
  assert.equal(sinToken.status, 401, 'a protected route without a token should answer 401');

  console.log('Smoke test passed');
} finally {
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
  rmSync(workdir, { recursive: true, force: true });
}
