const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { arrancarServidor } = require('./servidor');

let srv;
before(async () => { srv = await arrancarServidor(); });
after(() => srv.parar());

const usuario = { nombre: 'Lucia', email: 'lucia@example.test', password: 'password-de-prueba' };

test('el registro crea el usuario y no devuelve el hash de la contraseña', async () => {
  const r = await srv.llamar('POST', '/registro', { body: usuario });
  assert.equal(r.status, 201);
  assert.equal(r.datos.email, usuario.email);
  assert.equal(r.datos.password_hash, undefined);
});

test('un email repetido da 409', async () => {
  const r = await srv.llamar('POST', '/registro', { body: usuario });
  assert.equal(r.status, 409);
});

test('una entrada inválida da 400 con el mensaje de Zod', async () => {
  const r = await srv.llamar('POST', '/registro', { body: { nombre: 'x', email: 'no-es-un-email', password: '1' } });
  assert.equal(r.status, 400);
  const sinCampos = await srv.llamar('POST', '/registro', { body: {} });
  assert.equal(sinCampos.status, 400);
  assert.equal(sinCampos.datos.error, 'Nombre, email y contraseña son obligatorios');
});

test('el login devuelve un token y no filtra el hash', async () => {
  const r = await srv.llamar('POST', '/login', { body: { email: usuario.email, password: usuario.password } });
  assert.equal(r.status, 200);
  assert.ok(r.datos.token);
  assert.equal(r.datos.password_hash, undefined);
});

test('una contraseña incorrecta o un usuario inexistente dan 401', async () => {
  const mala = await srv.llamar('POST', '/login', { body: { email: usuario.email, password: 'otra-contraseña' } });
  assert.equal(mala.status, 401);
  const noExiste = await srv.llamar('POST', '/login', { body: { email: 'nadie@example.test', password: 'password-de-prueba' } });
  assert.equal(noExiste.status, 401);
});

test('una ruta protegida sin token da 401 y con un token falso, 403', async () => {
  const sin = await srv.llamar('PUT', '/usuarios/push-token', { body: { push_token: 'x' } });
  assert.equal(sin.status, 401);
  const falso = await srv.llamar('PUT', '/usuarios/push-token', { token: 'token.falso', body: { push_token: 'x' } });
  assert.equal(falso.status, 403);
});

test('cambiar la contraseña exige la actual, mínimo 8 caracteres y ser uno mismo', async () => {
  const ana = await srv.crearUsuario('Ana');
  const otro = await srv.crearUsuario('Otro');
  const ruta = `/usuarios/${ana.id}/password`;

  const mala = await srv.llamar('PUT', ruta, { token: ana.token, body: { password_actual: 'incorrecta', password_nueva: 'nueva-password-1' } });
  assert.equal(mala.status, 401);
  const corta = await srv.llamar('PUT', ruta, { token: ana.token, body: { password_actual: ana.password, password_nueva: 'corta' } });
  assert.equal(corta.status, 400);
  const ajeno = await srv.llamar('PUT', ruta, { token: otro.token, body: { password_actual: ana.password, password_nueva: 'nueva-password-1' } });
  assert.equal(ajeno.status, 403);

  const bien = await srv.llamar('PUT', ruta, { token: ana.token, body: { password_actual: ana.password, password_nueva: 'nueva-password-1' } });
  assert.equal(bien.status, 200);
  const antigua = await srv.llamar('POST', '/login', { body: { email: ana.email, password: ana.password } });
  assert.equal(antigua.status, 401);
  const nueva = await srv.llamar('POST', '/login', { body: { email: ana.email, password: 'nueva-password-1' } });
  assert.equal(nueva.status, 200);
});
