const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { arrancarServidor } = require('./servidor');

test('el servidor no arranca sin un JWT_SECRET válido', () => {
  for (const JWT_SECRET of ['', 'corto', 'replace-with-a-long-random-string']) {
    const r = spawnSync(process.execPath, [resolve(__dirname, '..', 'index.js')], {
      env: { ...process.env, JWT_SECRET, DOTENV_CONFIG_PATH: 'no-existe' },
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.notEqual(r.status, 0, `JWT_SECRET="${JWT_SECRET}" debería fallar`);
    assert.match(r.stderr, /JWT_SECRET/);
  }
});

test('el login se limita tras demasiados intentos y devuelve 429', async () => {
  const srv = await arrancarServidor({ RATE_LIMIT_MAX: '3' });
  try {
    const intento = () => srv.llamar('POST', '/login', { body: { email: 'nadie@example.test', password: 'password-de-prueba' } });
    for (let i = 0; i < 3; i++) assert.equal((await intento()).status, 401);
    const bloqueado = await intento();
    assert.equal(bloqueado.status, 429);
    assert.match(bloqueado.datos.error, /Demasiados intentos/);
  } finally {
    await srv.parar();
  }
});

test('helmet añade cabeceras de seguridad y CORS solo admite localhost por defecto', async () => {
  const srv = await arrancarServidor();
  try {
    const propio = await fetch(srv.base + '/', { headers: { Origin: 'http://localhost:8081' } });
    assert.equal(propio.headers.get('access-control-allow-origin'), 'http://localhost:8081');
    assert.equal(propio.headers.get('x-content-type-options'), 'nosniff');
    const ajeno = await fetch(srv.base + '/', { headers: { Origin: 'https://evil.example' } });
    assert.equal(ajeno.headers.get('access-control-allow-origin'), null);
  } finally {
    await srv.parar();
  }
});
