const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { arrancarServidor } = require('./servidor');

let srv, ana, marcos, bruno, familiaA, familiaB;

before(async () => {
  srv = await arrancarServidor();
  ana = await srv.crearUsuario('Ana');
  marcos = await srv.crearUsuario('Marcos');
  bruno = await srv.crearUsuario('Bruno');
  familiaA = await srv.crearFamiliaCon(ana, 'Familia A');
  familiaB = await srv.crearFamiliaCon(bruno, 'Familia B');
  await srv.llamar('POST', '/familias/unirse', {
    token: marcos.token,
    body: { usuario_id: marcos.id, codigo_invitacion: familiaA.codigo_invitacion },
  });
});
after(() => srv.parar());

const tareasDe = async (usuario, familia) => (await srv.llamar('GET', `/familias/${familia.id}/tareas`, { token: usuario.token })).datos;

test('una familia nueva trae el catálogo de 53 tareas predefinidas', async () => {
  const tareas = await tareasDe(ana, familiaA);
  assert.equal(tareas.length, 53);
  assert.equal(tareas.filter((t) => t.tipo === 'positiva').length, 39);
  assert.equal(tareas.filter((t) => t.tipo === 'negativa').length, 14);
});

test('un código de invitación inexistente da 404', async () => {
  const r = await srv.llamar('POST', '/familias/unirse', {
    token: marcos.token,
    body: { usuario_id: marcos.id, codigo_invitacion: 'NOEXISTE' },
  });
  assert.equal(r.status, 404);
});

test('los miembros de la familia aparecen en su listado, sin el hash de la contraseña', async () => {
  const r = await srv.llamar('GET', `/familias/${familiaA.id}/usuarios`, { token: ana.token });
  assert.equal(r.status, 200);
  assert.deepEqual(r.datos.map((u) => u.nombre).sort(), ['Ana', 'Marcos']);
  assert.ok(r.datos.every((u) => u.password_hash === undefined));
});

test('completar una tarea suma sus puntos y una negativa los resta', async () => {
  const tareas = await tareasDe(ana, familiaA);
  const positiva = tareas.find((t) => t.tipo === 'positiva');
  const negativa = tareas.find((t) => t.tipo === 'negativa');

  const r = await srv.llamar('POST', '/eventos', { token: ana.token, body: { usuario_id: marcos.id, tarea_id: positiva.id } });
  assert.equal(r.status, 201);
  let ranking = (await srv.llamar('GET', `/familias/${familiaA.id}/ranking`, { token: ana.token })).datos;
  assert.equal(ranking.find((u) => u.nombre === 'Marcos').puntos_totales, positiva.puntos_valor);

  await srv.llamar('POST', '/eventos', { token: ana.token, body: { usuario_id: marcos.id, tarea_id: negativa.id } });
  ranking = (await srv.llamar('GET', `/familias/${familiaA.id}/ranking`, { token: ana.token })).datos;
  assert.equal(ranking.find((u) => u.nombre === 'Marcos').puntos_totales, positiva.puntos_valor + negativa.puntos_valor);
});

test('crear una tarea valida el tipo y los puntos', async () => {
  const mal = await srv.llamar('POST', '/tareas', {
    token: ana.token,
    body: { familia_id: familiaA.id, nombre: 'Regar', puntos_valor: 0, tipo: 'rara' },
  });
  assert.equal(mal.status, 400);
  const bien = await srv.llamar('POST', '/tareas', {
    token: ana.token,
    body: { familia_id: familiaA.id, nombre: 'Regar las plantas', puntos_valor: 3, tipo: 'positiva' },
  });
  assert.equal(bien.status, 201);
});

test('aislamiento: otra familia recibe 403 en todos los recursos de la familia A', async () => {
  const idA = familiaA.id;
  const tareaDeA = (await tareasDe(ana, familiaA))[0];
  const intentos = [
    ['GET', `/familias/${idA}`],
    ['GET', `/familias/${idA}/tareas`],
    ['GET', `/familias/${idA}/usuarios`],
    ['GET', `/familias/${idA}/ranking`],
    ['GET', `/familias/${idA}/mensajes`],
    ['PUT', `/familias/${idA}/mascota`, { nombre_mascota: 'Intruso' }],
    ['PUT', `/familias/${idA}/especie`, { especie: 'oso' }],
    ['POST', `/familias/${idA}/desbloquear`, { especie: 'oso' }],
    ['PUT', `/familias/${idA}/cosmeticos`, { slot: 'sombrero', cosmetico: null }],
    ['POST', '/tareas', { familia_id: idA, nombre: 'Intrusa', puntos_valor: 5, tipo: 'positiva' }],
    ['DELETE', `/tareas/${tareaDeA.id}`],
    ['POST', '/eventos', { usuario_id: ana.id, tarea_id: tareaDeA.id }],
    ['POST', '/mensajes', { familia_id: idA, usuario_id: bruno.id, texto: 'hola' }],
    ['GET', `/usuarios/${ana.id}/notificaciones`],
    ['PUT', `/usuarios/${ana.id}/notificaciones/leer-todas`],
    ['PUT', `/usuarios/${ana.id}/salir-familia`],
    ['POST', '/familias/unirse', { usuario_id: ana.id, codigo_invitacion: familiaB.codigo_invitacion }],
  ];
  for (const [metodo, ruta, body] of intentos) {
    const r = await srv.llamar(metodo, ruta, { token: bruno.token, body });
    assert.equal(r.status, 403, `${metodo} ${ruta} debería dar 403 y dio ${r.status}`);
  }
  // ...y nada de lo anterior cambió los datos de la familia A.
  assert.equal((await tareasDe(ana, familiaA)).length, 54);
  assert.equal((await srv.llamar('GET', `/familias/${idA}/usuarios`, { token: ana.token })).datos.length, 2);
});

test('el chat guarda y lista los mensajes de la familia, sin poder suplantar a otro', async () => {
  const enviado = await srv.llamar('POST', '/mensajes', { token: ana.token, body: { familia_id: familiaA.id, usuario_id: ana.id, texto: 'Hola familia' } });
  assert.equal(enviado.status, 201);
  const suplantado = await srv.llamar('POST', '/mensajes', { token: ana.token, body: { familia_id: familiaA.id, usuario_id: marcos.id, texto: 'Soy Marcos' } });
  assert.equal(suplantado.status, 403);
  const lista = await srv.llamar('GET', `/familias/${familiaA.id}/mensajes`, { token: marcos.token });
  assert.deepEqual(lista.datos.map((m) => m.texto), ['Hola familia']);
});
