const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');
const { obtenerFamiliaDeUsuario } = require('../middleware/familia');
const { revisarResetRanking } = require('./familias.service');
const mascotaService = require('./mascota.service');

// Catálogo de tareas domésticas que se le da a cada familia nueva, para que
// no arranquen con la lista en blanco. Cada una se puede editar o borrar
// después desde la app — esto es solo un punto de partida generoso.
const TAREAS_PREDEFINIDAS = [
  // --- Positivas: limpieza y orden ---
  { nombre: 'Hacer la cama', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Lavar los platos', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Poner el lavavajillas', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Sacar la basura', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Sacar el reciclaje', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Poner una lavadora', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Tender la ropa', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Doblar y guardar la ropa', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Planchar la ropa', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Pasar la aspiradora', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Barrer el suelo', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Fregar el suelo', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Limpiar el baño', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Limpiar la cocina', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Quitar el polvo', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Cambiar las sábanas', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Ordenar la habitación', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Ordenar el salón', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Organizar el armario', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Limpiar los cristales', puntos_valor: 6, tipo: 'positiva' },
  // --- Positivas: cocina y compra ---
  { nombre: 'Poner la mesa', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Recoger la mesa', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Cocinar la comida', puntos_valor: 8, tipo: 'positiva' },
  { nombre: 'Preparar la cena', puntos_valor: 8, tipo: 'positiva' },
  { nombre: 'Preparar el desayuno', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Hacer la compra semanal', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Organizar la nevera', puntos_valor: 4, tipo: 'positiva' },
  // --- Positivas: mascotas, plantas y exterior ---
  { nombre: 'Pasear al perro', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Dar de comer a la mascota', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Limpiar después de la mascota', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Regar las plantas', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Cortar el césped', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Limpiar el coche', puntos_valor: 6, tipo: 'positiva' },
  // --- Positivas: estudio y responsabilidad ---
  { nombre: 'Hacer los deberes', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Estudiar una hora', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Leer un libro', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Ayudar con los deberes a un hermano', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Cuidar de un familiar', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Ser puntual toda la semana', puntos_valor: 6, tipo: 'positiva' },
  // --- Negativas ---
  { nombre: 'Dejar platos sucios', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Dejar la cama sin hacer', puntos_valor: -2, tipo: 'negativa' },
  { nombre: 'Dejar la ropa tirada', puntos_valor: -3, tipo: 'negativa' },
  { nombre: 'No sacar la basura', puntos_valor: -3, tipo: 'negativa' },
  { nombre: 'Dejar el baño desordenado', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Llegar tarde sin avisar', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'Pelearse con un hermano', puntos_valor: -6, tipo: 'negativa' },
  { nombre: 'No hacer los deberes', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'Contestar mal', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Mentir', puntos_valor: -8, tipo: 'negativa' },
  { nombre: 'Dejar luces encendidas sin necesidad', puntos_valor: -2, tipo: 'negativa' },
  { nombre: 'Perder o romper algo por descuido', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'No cuidar a la mascota', puntos_valor: -6, tipo: 'negativa' },
  { nombre: 'Usar el móvil en la mesa', puntos_valor: -3, tipo: 'negativa' },
];

function sembrarTareasPredefinidas(familiaId) {
  const insertarTarea = db.prepare(
    'INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)'
  );
  const sembrarTareas = db.transaction((tareas) => {
    for (const tarea of tareas) {
      insertarTarea.run(familiaId, tarea.nombre, tarea.puntos_valor, tarea.tipo);
    }
  });
  sembrarTareas(TAREAS_PREDEFINIDAS);
}

function crearTarea(usuarioSolicitanteId, { familia_id, nombre, puntos_valor, tipo }) {
  if (obtenerFamiliaDeUsuario(usuarioSolicitanteId) !== Number(familia_id)) {
    throw crearErrorHttp(403, 'No perteneces a esta familia');
  }

  const stmt = db.prepare('INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)');
  const resultado = stmt.run(familia_id, nombre, puntos_valor, tipo);

  return { id: resultado.lastInsertRowid, familia_id, nombre, puntos_valor, tipo };
}

function listarTareasDeFamilia(familiaId) {
  return db.prepare('SELECT * FROM tareas WHERE familia_id = ? ORDER BY tipo DESC, id DESC').all(familiaId);
}

function eliminarTarea(tareaId, usuarioSolicitanteId) {
  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(tareaId);
  if (!tarea) {
    throw crearErrorHttp(404, 'Tarea no encontrada');
  }

  if (obtenerFamiliaDeUsuario(usuarioSolicitanteId) !== tarea.familia_id) {
    throw crearErrorHttp(403, 'Esta tarea no pertenece a tu familia');
  }

  db.prepare('DELETE FROM tareas WHERE id = ?').run(tareaId);
}

// --- Registrar un evento (completar una tarea) ---
// Toca varios dominios a la vez (puntos/ranking, salud y monedas de la
// mascota, notificaciones): registrarEvento() orquesta y delega en
// mascotaService para su parte. La notificación de abajo aún no tiene
// servicio propio — se mueve a notificaciones.service.js en su paso.

// TODO(paso notificaciones): mover a notificaciones.service.js
async function notificarEventoTarea(usuario, tarea) {
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

  const tokensDestino = miembrosFamilia.filter((m) => m.id !== usuario.id).map((m) => m.push_token).filter(Boolean);
  if (tokensDestino.length === 0) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokensDestino.map((token) => ({
          to: token,
          title: usuario.nombre,
          body: `${tarea.nombre} (${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos)`,
        }))
      ),
    });
  } catch (error) {
    console.log('No se pudieron enviar las notificaciones push', error.message);
  }
}

function registrarEvento({ usuarioId, tareaId, registradoPorId }) {
  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(tareaId);
  if (!tarea) {
    throw crearErrorHttp(404, 'Tarea no encontrada');
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) {
    throw crearErrorHttp(404, 'Usuario no encontrado');
  }

  const familiaSolicitante = obtenerFamiliaDeUsuario(registradoPorId);
  if (!familiaSolicitante || familiaSolicitante !== usuario.familia_id || familiaSolicitante !== tarea.familia_id) {
    throw crearErrorHttp(403, 'Esta tarea o este usuario no pertenecen a tu familia');
  }

  if (usuario.familia_id) revisarResetRanking(usuario.familia_id);

  const insertarEvento = db.prepare(
    'INSERT INTO eventos (usuario_id, tarea_id, puntos_aplicados, registrado_por) VALUES (?, ?, ?, ?)'
  );
  const resultado = insertarEvento.run(usuarioId, tareaId, tarea.puntos_valor, registradoPorId);

  db.prepare('UPDATE usuarios SET puntos_totales = puntos_totales + ? WHERE id = ?')
    .run(tarea.puntos_valor, usuarioId);

  if (usuario.familia_id) {
    mascotaService.aplicarEfectosTarea(usuario.familia_id, tarea);
  }

  const respuesta = {
    id: resultado.lastInsertRowid,
    mensaje: `${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos aplicados a ${usuario.nombre}`,
  };

  // Avisamos al resto de la familia DESPUÉS de responder: si el envío de
  // push tarda o falla, no debe afectar a la app de quien marcó la tarea.
  // Por eso esto no es una promesa ya lanzada, sino una función que el
  // controlador llama después de enviar la respuesta.
  function notificarEnSegundoPlano() {
    if (usuario.familia_id) notificarEventoTarea(usuario, tarea);
  }

  return { respuesta, notificarEnSegundoPlano };
}

module.exports = {
  sembrarTareasPredefinidas,
  crearTarea,
  listarTareasDeFamilia,
  eliminarTarea,
  registrarEvento,
};
