const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { arrancarServidor } = require('./servidor');

let srv, ana, marcos, lucia, familia;
const miembros = async (usuario) => (await srv.llamar('GET', `/familias/${familia.id}/usuarios`, { token: usuario.token })).datos;
const tareas = async (usuario) => (await srv.llamar('GET', `/familias/${familia.id}/tareas`, { token: usuario.token })).datos;
const historial = async (usuario, query = '') => (await srv.llamar('GET', `/familias/${familia.id}/historial${query}`, { token: usuario.token })).datos;
const unirse = (usuario, codigo) => srv.llamar('POST', '/familias/unirse', { token: usuario.token, body: { usuario_id: usuario.id, codigo_invitacion: codigo } });

before(async () => {
  srv = await arrancarServidor();
  ana = await srv.crearUsuario('Ana');
  marcos = await srv.crearUsuario('Marcos');
  lucia = await srv.crearUsuario('Lucia');
  familia = await srv.crearFamiliaCon(ana, 'Casa');
  await unirse(marcos, familia.codigo_invitacion);
  await unirse(lucia, familia.codigo_invitacion);
});
after(() => srv.parar());

test('quien crea la familia es administrador y los demás son miembros', async () => {
  const lista = await miembros(ana);
  assert.deepEqual(lista.map((m) => [m.nombre, m.rol]).sort(), [['Ana', 'admin'], ['Lucia', 'miembro'], ['Marcos', 'miembro']]);
});

test('solo el administrador edita o elimina tareas, y eliminar conserva el historial', async () => {
  const tarea = (await tareas(ana)).find((t) => t.tipo === 'positiva');
  const cuerpo = { nombre: 'Tarea editada', puntos_valor: 9, tipo: 'positiva' };

  assert.equal((await srv.llamar('PUT', `/tareas/${tarea.id}`, { token: marcos.token, body: cuerpo })).status, 403);
  assert.equal((await srv.llamar('DELETE', `/tareas/${tarea.id}`, { token: marcos.token })).status, 403);
  assert.equal((await srv.llamar('PUT', `/tareas/${tarea.id}`, { token: ana.token, body: { ...cuerpo, puntos_valor: 0 } })).status, 400);

  const editada = await srv.llamar('PUT', `/tareas/${tarea.id}`, { token: ana.token, body: cuerpo });
  assert.equal(editada.status, 200);
  assert.equal(editada.datos.nombre, 'Tarea editada');

  await srv.llamar('POST', '/eventos', { token: ana.token, body: { usuario_id: marcos.id, tarea_id: tarea.id } });
  const borrada = await srv.llamar('DELETE', `/tareas/${tarea.id}`, { token: ana.token });
  assert.equal(borrada.status, 200); // antes: 500 por la clave foránea del evento

  assert.ok(!(await tareas(ana)).some((t) => t.id === tarea.id));
  assert.equal((await historial(ana))[0].tarea, 'Tarea editada');
  assert.equal((await srv.llamar('POST', '/eventos', { token: ana.token, body: { usuario_id: marcos.id, tarea_id: tarea.id } })).status, 404);
});

test('el historial es de la familia y solo se deshace lo propio (o todo siendo admin)', async () => {
  const tarea = (await tareas(ana)).find((t) => t.tipo === 'positiva');
  const puntos = async () => (await miembros(ana)).find((m) => m.nombre === 'Lucia').puntos_totales;
  const antes = await puntos();

  const registro = await srv.llamar('POST', '/eventos', { token: marcos.token, body: { usuario_id: lucia.id, tarea_id: tarea.id } });
  assert.equal(await puntos(), antes + tarea.puntos_valor);

  const vistoPorLucia = (await historial(lucia)).find((e) => e.id === registro.datos.id);
  assert.equal(vistoPorLucia.deshacible, false);
  assert.equal((await srv.llamar('DELETE', `/eventos/${registro.datos.id}`, { token: lucia.token })).status, 403);

  assert.equal((await historial(marcos)).find((e) => e.id === registro.datos.id).deshacible, true);
  assert.equal((await srv.llamar('DELETE', `/eventos/${registro.datos.id}`, { token: marcos.token })).status, 200);
  assert.equal(await puntos(), antes);
  assert.equal((await srv.llamar('DELETE', `/eventos/${registro.datos.id}`, { token: marcos.token })).status, 404);

  const otro = await srv.llamar('POST', '/eventos', { token: marcos.token, body: { usuario_id: lucia.id, tarea_id: tarea.id } });
  assert.equal((await srv.llamar('DELETE', `/eventos/${otro.datos.id}`, { token: ana.token })).status, 200);
});

test('el historial se pagina y exige ser de la familia', async () => {
  assert.equal((await historial(ana, '?limite=1')).length, 1);
  assert.equal((await srv.llamar('GET', `/familias/${familia.id}/historial?limite=0`, { token: ana.token })).status, 400);
  const intruso = await srv.crearUsuario('Intruso');
  assert.equal((await srv.llamar('GET', `/familias/${familia.id}/historial`, { token: intruso.token })).status, 403);
});

test('renombrar y regenerar el código es cosa del administrador y el código viejo deja de valer', async () => {
  assert.equal((await srv.llamar('PUT', `/familias/${familia.id}`, { token: marcos.token, body: { nombre: 'Otra' } })).status, 403);
  assert.equal((await srv.llamar('POST', `/familias/${familia.id}/codigo`, { token: marcos.token })).status, 403);

  assert.equal((await srv.llamar('PUT', `/familias/${familia.id}`, { token: ana.token, body: { nombre: 'Casa Nueva' } })).datos.nombre, 'Casa Nueva');
  const nuevo = await srv.llamar('POST', `/familias/${familia.id}/codigo`, { token: ana.token });
  assert.match(nuevo.datos.codigo_invitacion, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(nuevo.datos.codigo_invitacion, familia.codigo_invitacion);

  const nadie = await srv.crearUsuario('Nadie');
  assert.equal((await unirse(nadie, familia.codigo_invitacion)).status, 404);
  assert.equal((await unirse(nadie, nuevo.datos.codigo_invitacion.toLowerCase())).status, 200);
  await srv.llamar('PUT', `/usuarios/${nadie.id}/salir-familia`, { token: nadie.token });
});

test('expulsar: solo el administrador, no a uno mismo y solo a miembros', async () => {
  const ruta = (id) => `/familias/${familia.id}/usuarios/${id}`;
  assert.equal((await srv.llamar('DELETE', ruta(lucia.id), { token: marcos.token })).status, 403);
  assert.equal((await srv.llamar('DELETE', ruta(ana.id), { token: ana.token })).status, 400);
  assert.equal((await srv.llamar('DELETE', ruta(99999), { token: ana.token })).status, 404);
  assert.equal((await srv.llamar('DELETE', ruta(lucia.id), { token: ana.token })).status, 200);
  assert.deepEqual((await miembros(ana)).map((m) => m.nombre).sort(), ['Ana', 'Marcos']);
});

test('si el administrador se va, el miembro más antiguo pasa a serlo', async () => {
  await srv.llamar('PUT', `/usuarios/${ana.id}/salir-familia`, { token: ana.token });
  const lista = await miembros(marcos);
  assert.deepEqual(lista.map((m) => [m.nombre, m.rol]), [['Marcos', 'admin']]);
});

test('borrar la cuenta exige la contraseña, borra los datos y elimina la familia vacía', async () => {
  const incorrecta = await srv.llamar('DELETE', `/usuarios/${marcos.id}`, { token: marcos.token, body: { password: 'incorrecta' } });
  assert.equal(incorrecta.status, 401);
  const ajena = await srv.llamar('DELETE', `/usuarios/${ana.id}`, { token: marcos.token, body: { password: marcos.password } });
  assert.equal(ajena.status, 403);

  await srv.llamar('POST', '/mensajes', { token: marcos.token, body: { familia_id: familia.id, usuario_id: marcos.id, texto: 'adiós' } });
  const ok = await srv.llamar('DELETE', `/usuarios/${marcos.id}`, { token: marcos.token, body: { password: marcos.password } });
  assert.equal(ok.status, 200);

  assert.equal((await srv.llamar('POST', '/login', { body: { email: marcos.email, password: marcos.password } })).status, 401);
  // La familia se quedó sin miembros y desapareció con todos sus datos.
  const nueva = await srv.crearUsuario('Nueva');
  assert.equal((await srv.llamar('GET', `/familias/${familia.id}`, { token: nueva.token })).status, 403);
});
