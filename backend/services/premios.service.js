const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');
const { obtenerFamiliaDeUsuario } = require('../middleware/familia');
const { exigirAdmin } = require('./familias.service');
const { enviarPushNotificaciones } = require('./notificaciones.service');

// Premios con los que arranca cada familia; el administrador los edita o los cambia.
const PREMIOS_PREDEFINIDOS = [
  { nombre: 'Elegir el postre', costo: 30 },
  { nombre: 'Elegir la película de la noche', costo: 50 },
  { nombre: 'Un día sin tareas', costo: 80 },
];

function sembrarPremiosPredefinidos(familiaId) {
  const insertar = db.prepare('INSERT INTO premios (familia_id, nombre, costo) VALUES (?, ?, ?)');
  for (const premio of PREMIOS_PREDEFINIDOS) insertar.run(familiaId, premio.nombre, premio.costo);
}

function listarPremios(familiaId) {
  const premios = db.prepare(
    'SELECT id, nombre, costo FROM premios WHERE familia_id = ? AND archivado = 0 ORDER BY costo, id'
  ).all(familiaId);
  const { monedas } = db.prepare('SELECT monedas FROM familias WHERE id = ?').get(familiaId);
  return { monedas, premios };
}

function obtenerPremioDeMiFamilia(premioId, usuarioId) {
  const premio = db.prepare('SELECT * FROM premios WHERE id = ? AND archivado = 0').get(premioId);
  if (!premio) {
    throw crearErrorHttp(404, 'Premio no encontrado');
  }
  if (obtenerFamiliaDeUsuario(usuarioId) !== premio.familia_id) {
    throw crearErrorHttp(403, 'Este premio no pertenece a tu familia');
  }
  return premio;
}

function crearPremio(usuarioId, { familia_id, nombre, costo }) {
  if (obtenerFamiliaDeUsuario(usuarioId) !== familia_id) {
    throw crearErrorHttp(403, 'No perteneces a esta familia');
  }
  exigirAdmin(usuarioId, familia_id);

  const resultado = db.prepare('INSERT INTO premios (familia_id, nombre, costo) VALUES (?, ?, ?)').run(familia_id, nombre, costo);
  return { id: resultado.lastInsertRowid, nombre, costo };
}

function editarPremio(premioId, usuarioId, { nombre, costo }) {
  const premio = obtenerPremioDeMiFamilia(premioId, usuarioId);
  exigirAdmin(usuarioId, premio.familia_id);

  db.prepare('UPDATE premios SET nombre = ?, costo = ? WHERE id = ?').run(nombre, costo, premio.id);
  return { id: premio.id, nombre, costo };
}

function eliminarPremio(premioId, usuarioId) {
  const premio = obtenerPremioDeMiFamilia(premioId, usuarioId);
  exigirAdmin(usuarioId, premio.familia_id);

  db.prepare('UPDATE premios SET archivado = 1 WHERE id = ?').run(premio.id);
}

// Cualquier miembro puede canjear: las monedas son de toda la familia. El descuento
// condicional (monedas >= costo) evita quedarse en negativo si dos canjes coinciden.
function canjearPremio(premioId, usuarioId) {
  const premio = obtenerPremioDeMiFamilia(premioId, usuarioId);
  const usuario = db.prepare('SELECT id, nombre FROM usuarios WHERE id = ?').get(usuarioId);

  const miembros = db.transaction(() => {
    const cobro = db.prepare('UPDATE familias SET monedas = monedas - ? WHERE id = ? AND monedas >= ?')
      .run(premio.costo, premio.familia_id, premio.costo);
    if (cobro.changes === 0) {
      throw crearErrorHttp(400, 'No hay monedas suficientes para este premio');
    }

    db.prepare('INSERT INTO canjes (premio_id, usuario_id, costo) VALUES (?, ?, ?)').run(premio.id, usuario.id, premio.costo);

    const familia = db.prepare('SELECT id, push_token FROM usuarios WHERE familia_id = ?').all(premio.familia_id);
    const contenido = `${usuario.nombre} canjeó "${premio.nombre}" (-${premio.costo} monedas)`;
    const notificar = db.prepare('INSERT INTO notificaciones (usuario_id, contenido) VALUES (?, ?)');
    for (const miembro of familia) notificar.run(miembro.id, contenido);
    return familia;
  })();

  enviarPushNotificaciones(
    miembros.filter((m) => m.id !== usuario.id).map((m) => m.push_token),
    usuario.nombre,
    `Ha canjeado "${premio.nombre}"`
  );

  return { mensaje: `Has canjeado "${premio.nombre}"`, ...listarPremios(premio.familia_id) };
}

function listarCanjes(familiaId, { limite = 20 } = {}) {
  return db.prepare(`
    SELECT canjes.id, premios.nombre AS premio, canjes.costo, usuarios.nombre AS usuario, canjes.fecha_hora
    FROM canjes
    JOIN premios ON premios.id = canjes.premio_id
    JOIN usuarios ON usuarios.id = canjes.usuario_id
    WHERE premios.familia_id = ?
    ORDER BY canjes.id DESC
    LIMIT ?
  `).all(familiaId, limite);
}

module.exports = {
  sembrarPremiosPredefinidos,
  listarPremios,
  crearPremio,
  editarPremio,
  eliminarPremio,
  canjearPremio,
  listarCanjes,
};
