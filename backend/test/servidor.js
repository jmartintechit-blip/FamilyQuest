// Arranca el backend real (index.js) en un directorio temporal, porque crea
// app-familia.db en su directorio de trabajo, y ofrece helpers para llamarlo.
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const net = require('node:net');

function puertoLibre() {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => res(port));
    });
    srv.on('error', rej);
  });
}

async function arrancarServidor(entorno = {}) {
  const puerto = await puertoLibre();
  const carpeta = mkdtempSync(join(tmpdir(), 'familyquest-test-'));
  const proceso = spawn(process.execPath, [resolve(__dirname, '..', 'index.js')], {
    cwd: carpeta,
    env: { ...process.env, PORT: String(puerto), JWT_SECRET: 'secreto-solo-para-tests', RATE_LIMIT_MAX: '1000', ...entorno },
    stdio: 'ignore',
  });
  const base = `http://localhost:${puerto}`;

  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(base + '/health')).ok) break;
    } catch {
      // todavía arrancando
    }
    if (i === 49) throw new Error('El backend no arrancó en 10 s');
    await new Promise((r) => setTimeout(r, 200));
  }

  async function llamar(metodo, ruta, { token, body } = {}) {
    const respuesta = await fetch(base + ruta, {
      method: metodo,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const texto = await respuesta.text();
    return { status: respuesta.status, datos: texto ? JSON.parse(texto) : null };
  }

  // Registra a alguien, inicia sesión y devuelve { id, token }.
  async function crearUsuario(nombre) {
    const email = `${nombre.toLowerCase()}@example.test`;
    const password = 'password-de-prueba';
    await llamar('POST', '/registro', { body: { nombre, email, password } });
    const { datos } = await llamar('POST', '/login', { body: { email, password } });
    return { id: datos.id, token: datos.token, email, password };
  }

  // Crea una familia y mete dentro a quien la crea.
  async function crearFamiliaCon(usuario, nombre) {
    const { datos: familia } = await llamar('POST', '/familias', { token: usuario.token, body: { nombre } });
    await llamar('POST', '/familias/unirse', {
      token: usuario.token,
      body: { usuario_id: usuario.id, codigo_invitacion: familia.codigo_invitacion },
    });
    return familia;
  }

  function parar() {
    proceso.kill();
    return new Promise((r) => setTimeout(r, 300)).then(() => rmSync(carpeta, { recursive: true, force: true }));
  }

  return { base, llamar, crearUsuario, crearFamiliaCon, parar };
}

module.exports = { arrancarServidor };
