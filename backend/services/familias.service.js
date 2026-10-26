const { randomInt } = require('node:crypto');
const db = require('../db/conexion');
const { obtenerFamiliaDeUsuario } = require('../middleware/familia');
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

// Sin 0/O/1/I para que el código se pueda dictar por teléfono sin confusiones.
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigo() {
  let codigo = '';
  for (let i = 0; i < 6; i++) codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  return codigo;
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
  const familia = db.prepare('SELECT * FROM familias WHERE codigo_invitacion = ?').get(codigoInvitacion.toUpperCase());
  if (!familia) {
    throw crearErrorHttp(404, 'Código de invitación no válido');
  }

  const actual = obtenerFamiliaDeUsuario(usuarioId);
  if (actual !== familia.id) {
    db.transaction(() => {
      if (actual) salirDeFamilia(usuarioId);
      // Quien entra en una familia sin miembros (la acaba de crear) es su administrador.
      const miembros = db.prepare('SELECT COUNT(*) AS n FROM usuarios WHERE familia_id = ?').get(familia.id).n;
      db.prepare('UPDATE usuarios SET familia_id = ?, rol = ? WHERE id = ?')
        .run(familia.id, miembros === 0 ? 'admin' : 'miembro', usuarioId);
    })();
  }

  return {
    mensaje: `Usuario unido a la familia "${familia.nombre}" correctamente`,
    familia_id: familia.id,
  };
}

function listarMiembros(familiaId) {
  return db.prepare(
    'SELECT id, nombre, email, rol, puntos_totales, fecha_creacion FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
  ).all(familiaId);
}

function esAdmin(usuarioId, familiaId) {
  const usuario = db.prepare('SELECT familia_id, rol FROM usuarios WHERE id = ?').get(usuarioId);
  return Boolean(usuario) && usuario.familia_id === Number(familiaId) && usuario.rol === 'admin';
}

function exigirAdmin(usuarioId, familiaId) {
  if (!esAdmin(usuarioId, familiaId)) {
    throw crearErrorHttp(403, 'Solo el administrador de la familia puede hacer esto');
  }
}

// Tras una salida: si la familia se queda sin miembros se borra con todos sus datos
// (nadie podría ya verlos); si se queda sin administrador, el miembro más antiguo lo es.
function ordenarFamiliaTrasSalida(familiaId) {
  const miembros = db.prepare('SELECT id, rol FROM usuarios WHERE familia_id = ? ORDER BY id').all(familiaId);
  if (miembros.length === 0) {
    db.prepare('DELETE FROM eventos WHERE tarea_id IN (SELECT id FROM tareas WHERE familia_id = ?)').run(familiaId);
    db.prepare('DELETE FROM mensajes WHERE familia_id = ?').run(familiaId);
    db.prepare('DELETE FROM tareas WHERE familia_id = ?').run(familiaId);
    db.prepare('DELETE FROM familias WHERE id = ?').run(familiaId);
  } else if (!miembros.some((m) => m.rol === 'admin')) {
    db.prepare("UPDATE usuarios SET rol = 'admin' WHERE id = ?").run(miembros[0].id);
  }
}

function salirDeFamilia(usuarioId) {
  const familiaId = obtenerFamiliaDeUsuario(usuarioId);
  db.transaction(() => {
    db.prepare("UPDATE usuarios SET familia_id = NULL, puntos_totales = 0, rol = 'miembro' WHERE id = ?").run(usuarioId);
    if (familiaId) ordenarFamiliaTrasSalida(familiaId);
  })();
}

function expulsarMiembro(familiaId, usuarioId, solicitanteId) {
  exigirAdmin(solicitanteId, familiaId);
  if (Number(usuarioId) === solicitanteId) {
    throw crearErrorHttp(400, 'Para irte tú mismo usa "Salir de la familia"');
  }
  if (obtenerFamiliaDeUsuario(usuarioId) !== Number(familiaId)) {
    throw crearErrorHttp(404, 'Ese usuario no es miembro de tu familia');
  }
  salirDeFamilia(Number(usuarioId));
}

function renombrarFamilia(familiaId, nombre, solicitanteId) {
  exigirAdmin(solicitanteId, familiaId);
  db.prepare('UPDATE familias SET nombre = ? WHERE id = ?').run(nombre, familiaId);
  return { id: Number(familiaId), nombre };
}

// El código antiguo deja de valer al instante: sirve si se ha filtrado.
function regenerarCodigo(familiaId, solicitanteId) {
  exigirAdmin(solicitanteId, familiaId);
  const codigo = generarCodigo();
  db.prepare('UPDATE familias SET codigo_invitacion = ? WHERE id = ?').run(codigo, familiaId);
  return { codigo_invitacion: codigo };
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
  esAdmin,
  exigirAdmin,
  salirDeFamilia,
  expulsarMiembro,
  renombrarFamilia,
  regenerarCodigo,
  crearFamilia,
  unirseConCodigo,
  listarMiembros,
  obtenerRanking,
  obtenerFamilia,
};
