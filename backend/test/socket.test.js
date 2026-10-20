const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { io } = require('socket.io-client');
const { arrancarServidor } = require('./servidor');

let srv, ana, bruno, familiaA;
const clientes = [];

before(async () => {
  srv = await arrancarServidor();
  ana = await srv.crearUsuario('Ana');
  bruno = await srv.crearUsuario('Bruno');
  familiaA = await srv.crearFamiliaCon(ana, 'Familia A');
  await srv.crearFamiliaCon(bruno, 'Familia B');
});
after(async () => {
  clientes.forEach((c) => c.disconnect());
  await srv.parar();
});

function conectar(token) {
  const cliente = io(srv.base, { auth: token === undefined ? {} : { token }, reconnection: false });
  clientes.push(cliente);
  return cliente;
}

// Con un límite de tiempo, para que un servidor que no responde haga fallar el test en vez de colgarlo.
const limite = (promesa, ms = 3000) => Promise.race([promesa, new Promise((_, rej) => setTimeout(() => rej(new Error('Sin respuesta del servidor')), ms))]);
const alConectar = (c) => limite(new Promise((res, rej) => { c.on('connect', res); c.on('connect_error', rej); }));
const unirse = (c, familiaId) => limite(new Promise((res) => c.emit('unirse_familia', familiaId, res)));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

test('sin token o con un token falso no se puede conectar', async () => {
  await assert.rejects(alConectar(conectar()), /Token inválido o expirado/);
  await assert.rejects(alConectar(conectar('token.falso')), /Token inválido o expirado/);
});

test('un miembro entra en la sala de su familia y recibe sus mensajes', async () => {
  const cliente = conectar(ana.token);
  await alConectar(cliente);
  assert.deepEqual(await unirse(cliente, familiaA.id), { ok: true });

  const recibido = new Promise((res) => cliente.on('mensaje_nuevo', res));
  await srv.llamar('POST', '/mensajes', { token: ana.token, body: { familia_id: familiaA.id, usuario_id: ana.id, texto: 'Hola por socket' } });
  assert.equal((await recibido).texto, 'Hola por socket');
});

test('alguien de otra familia no puede entrar en la sala ni recibe sus mensajes', async () => {
  const intruso = conectar(bruno.token);
  await alConectar(intruso);
  assert.deepEqual(await unirse(intruso, familiaA.id), { ok: false });

  let recibioAlgo = false;
  intruso.on('mensaje_nuevo', () => { recibioAlgo = true; });
  await srv.llamar('POST', '/mensajes', { token: ana.token, body: { familia_id: familiaA.id, usuario_id: ana.id, texto: 'Secreto familiar' } });
  await esperar(500);
  assert.equal(recibioAlgo, false);
});
