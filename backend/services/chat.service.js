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

function listarMensajesDeFamilia(familiaId) {
  return db.prepare(`
    SELECT mensajes.id, mensajes.texto, mensajes.fecha_hora, usuarios.nombre AS autor
    FROM mensajes
    JOIN usuarios ON mensajes.usuario_id = usuarios.id
    WHERE mensajes.familia_id = ?
    ORDER BY mensajes.fecha_hora ASC
  `).all(familiaId);
}

module.exports = { enviarMensaje, listarMensajesDeFamilia };
