const db = require('../db/conexion');

// Envía notificaciones push a través del servicio de Expo. Si algún token no
// es válido o el envío falla, simplemente lo registramos en consola: nunca
// debe romper la petición que la disparó (marcar una tarea, etc.).
async function enviarPushNotificaciones(tokens, titulo, cuerpo) {
  const tokensValidos = tokens.filter(Boolean);
  if (tokensValidos.length === 0) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokensValidos.map((token) => ({ to: token, title: titulo, body: cuerpo }))
      ),
    });
  } catch (error) {
    console.log('No se pudieron enviar las notificaciones push', error.message);
  }
}

// La llama tareas.service.js al completar una tarea: crea una notificación
// en la bandeja de cada miembro de la familia y avisa por push a los demás
// (no a quien completó la tarea). Vivía dentro de tareas.service.js (con
// un TODO) hasta este paso.
function notificarTareaCompletada(usuario, tarea) {
  const contenidoNotificacion = `${usuario.nombre} completó "${tarea.nombre}" (${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos)`;

  const miembrosFamilia = db.prepare('SELECT id, push_token FROM usuarios WHERE familia_id = ?').all(usuario.familia_id);

  const insertarNotificacion = db.prepare(
    'INSERT INTO notificaciones (usuario_id, contenido) VALUES (?, ?)'
  );
  const guardarNotificaciones = db.transaction((miembros) => {
    for (const miembro of miembros) {
      insertarNotificacion.run(miembro.id, contenidoNotificacion);
    }
  });
  guardarNotificaciones(miembrosFamilia);

  enviarPushNotificaciones(
    miembrosFamilia.filter((m) => m.id !== usuario.id).map((m) => m.push_token),
    usuario.nombre,
    `${tarea.nombre} (${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos)`
  );
}

function listarDeUsuario(usuarioId) {
  return db.prepare(
    'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha_hora DESC LIMIT 100'
  ).all(usuarioId);
}

function marcarTodasLeidas(usuarioId) {
  db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?').run(usuarioId);
}

module.exports = { enviarPushNotificaciones, notificarTareaCompletada, listarDeUsuario, marcarTodasLeidas };
