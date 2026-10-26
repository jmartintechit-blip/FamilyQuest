const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { arrancarServidor } = require('./servidor');

let srv, ana, marcos, intruso, familia;
const premios = async (usuario) => (await srv.llamar('GET', `/familias/${familia.id}/premios`, { token: usuario.token })).datos;

before(async () => {
  srv = await arrancarServidor();
  ana = await srv.crearUsuario('Ana');
  marcos = await srv.crearUsuario('Marcos');
  intruso = await srv.crearUsuario('Intruso');
  familia = await srv.crearFamiliaCon(ana, 'Casa');
  await srv.llamar('POST', '/familias/unirse', {
    token: marcos.token,
    body: { usuario_id: marcos.id, codigo_invitacion: familia.codigo_invitacion },
  });
});
after(() => srv.parar());

// Las monedas suben igual que los puntos: se completan tareas de 8 puntos hasta juntarlas.
async function ganarMonedas(cantidad) {
  const tareas = (await srv.llamar('GET', `/familias/${familia.id}/tareas`, { token: ana.token })).datos;
  const tarea = tareas.find((t) => t.puntos_valor === 8);
  for (let ganadas = 0; ganadas < cantidad; ganadas += 8) {
    await srv.llamar('POST', '/eventos', { token: ana.token, body: { usuario_id: ana.id, tarea_id: tarea.id } });
  }
}

test('una familia nueva trae premios de ejemplo y ninguna moneda', async () => {
  const { monedas, premios: lista } = await premios(marcos);
  assert.equal(monedas, 0);
  assert.deepEqual(lista.map((p) => p.costo), [30, 50, 80]);
});

test('sin monedas suficientes el canje se rechaza y no cobra nada', async () => {
  const { premios: lista } = await premios(ana);
  const r = await srv.llamar('POST', `/premios/${lista[0].id}/canjear`, { token: marcos.token });
  assert.equal(r.status, 400);
  assert.equal((await premios(ana)).monedas, 0);
});

test('con monedas, cualquier miembro canjea, se cobra, se avisa a la familia y queda registrado', async () => {
  await ganarMonedas(40);
  const antes = (await premios(ana)).monedas;
  assert.ok(antes >= 40);

  const { premios: lista } = await premios(ana);
  const r = await srv.llamar('POST', `/premios/${lista[0].id}/canjear`, { token: marcos.token });
  assert.equal(r.status, 200);
  assert.equal(r.datos.monedas, antes - 30);

  const canjes = (await srv.llamar('GET', `/familias/${familia.id}/canjes`, { token: ana.token })).datos;
  assert.deepEqual(canjes.map((c) => [c.usuario, c.premio, c.costo]), [['Marcos', 'Elegir el postre', 30]]);

  const avisos = (await srv.llamar('GET', `/usuarios/${ana.id}/notificaciones`, { token: ana.token })).datos;
  assert.ok(avisos.some((a) => a.contenido.includes('Marcos canjeó "Elegir el postre"')));
});

test('solo el administrador crea, edita y elimina premios', async () => {
  const nuevo = { familia_id: familia.id, nombre: 'Elegir la cena', costo: 20 };
  assert.equal((await srv.llamar('POST', '/premios', { token: marcos.token, body: nuevo })).status, 403);
  assert.equal((await srv.llamar('POST', '/premios', { token: ana.token, body: { ...nuevo, costo: 0 } })).status, 400);

  const creado = await srv.llamar('POST', '/premios', { token: ana.token, body: nuevo });
  assert.equal(creado.status, 201);
  const ruta = `/premios/${creado.datos.id}`;

  assert.equal((await srv.llamar('PUT', ruta, { token: marcos.token, body: { nombre: 'X', costo: 5 } })).status, 403);
  assert.equal((await srv.llamar('PUT', ruta, { token: ana.token, body: { nombre: 'Cena elegida', costo: 25 } })).datos.costo, 25);
  assert.equal((await srv.llamar('DELETE', ruta, { token: marcos.token })).status, 403);
  assert.equal((await srv.llamar('DELETE', ruta, { token: ana.token })).status, 200);

  assert.ok(!(await premios(ana)).premios.some((p) => p.id === creado.datos.id));
  assert.equal((await srv.llamar('POST', `${ruta}/canjear`, { token: ana.token })).status, 404);
});

test('un premio archivado conserva su historial de canjes y los ajenos no se tocan', async () => {
  const { premios: lista } = await premios(ana);
  assert.equal((await srv.llamar('DELETE', `/premios/${lista[0].id}`, { token: ana.token })).status, 200);
  const canjes = (await srv.llamar('GET', `/familias/${familia.id}/canjes`, { token: ana.token })).datos;
  assert.equal(canjes[0].premio, 'Elegir el postre');

  assert.equal((await srv.llamar('GET', `/familias/${familia.id}/premios`, { token: intruso.token })).status, 403);
  assert.equal((await srv.llamar('POST', `/premios/${lista[1].id}/canjear`, { token: intruso.token })).status, 403);
});
