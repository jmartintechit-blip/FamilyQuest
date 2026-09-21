const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');

const SEMANA_EN_MS = 7 * 24 * 60 * 60 * 1000;

// El ranking se reinicia cada semana. No hay un cron corriendo en segundo
// plano: en su lugar, cada vez que se toca a una familia comprobamos si ya
// tocaba reiniciar (perezoso, pero suficiente para el tamaño de esta app).
// La usan también eventos al completar una tarea, de ahí que viva aquí y
// no dentro del controlador de familias.
function revisarResetRanking(familiaId) {
  const familia = db.prepare('SELECT ranking_ultimo_reset FROM familias WHERE id = ?').get(familiaId);
  if (!familia) return;

  const ultimoReset = new Date(familia.ranking_ultimo_reset.replace(' ', 'T') + 'Z');
  const haPasadoUnaSemana = Date.now() - ultimoReset.getTime() >= SEMANA_EN_MS;

  if (haPasadoUnaSemana) {
    db.prepare('UPDATE usuarios SET puntos_totales = 0 WHERE familia_id = ?').run(familiaId);
    db.prepare('UPDATE familias SET ranking_ultimo_reset = CURRENT_TIMESTAMP WHERE id = ?').run(familiaId);
  }
}

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function crearFamilia(nombre) {
  // Require perezoso (no al principio del archivo): tareas.service.js ya
  // importa revisarResetRanking de aquí arriba, así que importar
  // tareas.service.js al nivel superior de este archivo crearía un
  // require circular. Al pedirlo dentro de la función, para cuando esto
  // se ejecuta (una petición real) los dos módulos ya han terminado de
  // cargar y no hay problema.
  const tareasService = require('./tareas.service');

  const codigo = generarCodigo();
  const stmt = db.prepare('INSERT INTO familias (nombre, codigo_invitacion) VALUES (?, ?)');
  const resultado = stmt.run(nombre, codigo);
  const familiaId = resultado.lastInsertRowid;

  tareasService.sembrarTareasPredefinidas(familiaId);

  return { id: familiaId, nombre, codigo_invitacion: codigo };
}

function unirseConCodigo(usuarioId, codigoInvitacion) {
  const familia = db.prepare('SELECT * FROM familias WHERE codigo_invitacion = ?').get(codigoInvitacion);
  if (!familia) {
    throw crearErrorHttp(404, 'Código de invitación no válido');
  }

  db.prepare('UPDATE usuarios SET familia_id = ? WHERE id = ?').run(familia.id, usuarioId);

  return {
    mensaje: `Usuario unido a la familia "${familia.nombre}" correctamente`,
    familia_id: familia.id,
  };
}

function listarMiembros(familiaId) {
  return db.prepare(
    'SELECT id, nombre, email, puntos_totales, fecha_creacion FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
  ).all(familiaId);
}

function salirDeFamilia(usuarioId) {
  db.prepare('UPDATE usuarios SET familia_id = NULL, puntos_totales = 0 WHERE id = ?').run(usuarioId);
}

function obtenerRanking(familiaId) {
  revisarResetRanking(familiaId);
  return db.prepare(
    'SELECT nombre, puntos_totales FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
  ).all(familiaId);
}

function obtenerFamilia(familiaId) {
  revisarResetRanking(familiaId);
  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(familiaId);

  if (!familia) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  return familia;
}

module.exports = {
  revisarResetRanking,
  crearFamilia,
  unirseConCodigo,
  listarMiembros,
  salirDeFamilia,
  obtenerRanking,
  obtenerFamilia,
};
