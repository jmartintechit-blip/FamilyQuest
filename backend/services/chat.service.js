const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');
const { obtenerFamiliaDeUsuario } = require('../middleware/familia');

// io se pasa como parámetro (no se importa como singleton) para no atar
// este servicio a cómo arranca el servidor — lo inyecta el controlador,
// que lo obtiene de req.app.get('io').
function enviarMensaje(io, { familiaId, usuarioId, texto, remitenteId }) {
  if (remitenteId !== Number(usuarioId) || obtenerFamiliaDeUsuario(remitenteId) !== Number(familiaId)) {
    throw crearErrorHttp(403, 'No puedes enviar mensajes en nombre de otro usuario o de otra familia');
  }

  const stmt = db.prepare('INSERT INTO mensajes (familia_id, usuario_id, texto) VALUES (?, ?, ?)');
  const resultado = stmt.run(familiaId, usuarioId, texto);

  const usuario = db.prepare('SELECT nombre FROM usuarios WHERE id = ?').get(usuarioId);

  const mensajeCompleto = {
    id: resultado.lastInsertRowid,
    familia_id: familiaId,
    usuario_id: usuarioId,
    texto,
    autor: usuario.nombre,
    fecha_hora: new Date().toISOString(),
  };

  io.to(`familia_${familiaId}`).emit('mensaje_nuevo', mensajeCompleto);

  return mensajeCompleto;
}

// Devuelve una página en orden cronológico: los `limite` mensajes más recientes, o los
// anteriores al id `antes` para cargar más hacia atrás. Se ordena por id (autoincremental)
// y no por fecha, que en el mismo segundo no distingue el orden.
function listarMensajesDeFamilia(familiaId, { antes, limite = 50 } = {}) {
  const filas = db.prepare(`
    SELECT mensajes.id, mensajes.usuario_id, mensajes.texto, mensajes.fecha_hora, usuarios.nombre AS autor
    FROM mensajes
    JOIN usuarios ON mensajes.usuario_id = usuarios.id
    WHERE mensajes.familia_id = ? AND (? IS NULL OR mensajes.id < ?)
    ORDER BY mensajes.id DESC
    LIMIT ?
  `).all(familiaId, antes ?? null, antes ?? null, limite);
  return filas.reverse();
}

module.exports = { enviarMensaje, listarMensajesDeFamilia };
