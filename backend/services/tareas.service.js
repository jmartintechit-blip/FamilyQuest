const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');
const { obtenerFamiliaDeUsuario } = require('../middleware/familia');
const { revisarResetRanking, esAdmin, exigirAdmin } = require('./familias.service');
const mascotaService = require('./mascota.service');
const notificacionesService = require('./notificaciones.service');

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
  return db.prepare('SELECT * FROM tareas WHERE familia_id = ? AND archivada = 0 ORDER BY tipo DESC, id DESC').all(familiaId);
}

function obtenerTareaDeMiFamilia(tareaId, usuarioId) {
  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ? AND archivada = 0').get(tareaId);
  if (!tarea) {
    throw crearErrorHttp(404, 'Tarea no encontrada');
  }
  if (obtenerFamiliaDeUsuario(usuarioId) !== tarea.familia_id) {
    throw crearErrorHttp(403, 'Esta tarea no pertenece a tu familia');
  }
  return tarea;
}

// Solo el administrador cambia el catálogo. Los eventos ya registrados guardan sus
// propios puntos (puntos_aplicados), así que editar una tarea no reescribe el pasado.
function editarTarea(tareaId, usuarioId, { nombre, puntos_valor, tipo }) {
  const tarea = obtenerTareaDeMiFamilia(tareaId, usuarioId);
  exigirAdmin(usuarioId, tarea.familia_id);

  db.prepare('UPDATE tareas SET nombre = ?, puntos_valor = ?, tipo = ? WHERE id = ?').run(nombre, puntos_valor, tipo, tarea.id);
  return { ...tarea, nombre, puntos_valor, tipo };
}

// Se archiva en vez de borrar: los eventos del historial apuntan a la tarea.
function eliminarTarea(tareaId, usuarioId) {
  const tarea = obtenerTareaDeMiFamilia(tareaId, usuarioId);
  exigirAdmin(usuarioId, tarea.familia_id);

  db.prepare('UPDATE tareas SET archivada = 1 WHERE id = ?').run(tarea.id);
}

// --- Historial y deshacer ---

const VENTANA_DESHACER_MS = 24 * 60 * 60 * 1000;

function parsearFecha(fechaSqlite) {
  return new Date(fechaSqlite.replace(' ', 'T') + 'Z');
}

// Se puede deshacer un evento reciente (24 h) y de la semana en curso (tras el reinicio
// del ranking los puntos ya no existen, y restarlos dejaría el ranking en negativo).
// Lo puede hacer quien lo registró o el administrador.
function sePuedeDeshacer(evento, solicitanteId, familia) {
  const reciente = Date.now() - parsearFecha(evento.fecha_hora).getTime() < VENTANA_DESHACER_MS;
  const deEstaSemana = evento.fecha_hora >= familia.ranking_ultimo_reset;
  const permitido = evento.registrado_por === solicitanteId || esAdmin(solicitanteId, familia.id);
  return reciente && deEstaSemana && permitido;
}

function listarHistorial(familiaId, solicitanteId, { antes, limite = 30 } = {}) {
  revisarResetRanking(familiaId);
  const familia = db.prepare('SELECT id, ranking_ultimo_reset FROM familias WHERE id = ?').get(familiaId);
  const filas = db.prepare(`
    SELECT eventos.id, eventos.usuario_id, usuarios.nombre AS usuario, tareas.nombre AS tarea, tareas.tipo,
           eventos.puntos_aplicados, eventos.fecha_hora, eventos.registrado_por, registrador.nombre AS registrado_por_nombre
    FROM eventos
    JOIN usuarios ON usuarios.id = eventos.usuario_id
    JOIN tareas ON tareas.id = eventos.tarea_id
    LEFT JOIN usuarios AS registrador ON registrador.id = eventos.registrado_por
    WHERE usuarios.familia_id = ? AND (? IS NULL OR eventos.id < ?)
    ORDER BY eventos.id DESC
    LIMIT ?
  `).all(familiaId, antes ?? null, antes ?? null, limite);

  return filas.map((e) => ({ ...e, deshacible: sePuedeDeshacer(e, solicitanteId, familia) }));
}

function deshacerEvento(eventoId, solicitanteId) {
  const evento = db.prepare('SELECT * FROM eventos WHERE id = ?').get(eventoId);
  const usuario = evento && db.prepare('SELECT * FROM usuarios WHERE id = ?').get(evento.usuario_id);
  if (!evento || !usuario || !usuario.familia_id) {
    throw crearErrorHttp(404, 'Evento no encontrado');
  }
  if (obtenerFamiliaDeUsuario(solicitanteId) !== usuario.familia_id) {
    throw crearErrorHttp(403, 'Este evento no pertenece a tu familia');
  }

  revisarResetRanking(usuario.familia_id);
  const familia = db.prepare('SELECT id, ranking_ultimo_reset FROM familias WHERE id = ?').get(usuario.familia_id);
  if (!sePuedeDeshacer(evento, solicitanteId, familia)) {
    throw crearErrorHttp(403, 'Este evento ya no se puede deshacer, o no lo registraste tú');
  }

  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(evento.tarea_id);
  db.transaction(() => {
    db.prepare('DELETE FROM eventos WHERE id = ?').run(evento.id);
    db.prepare('UPDATE usuarios SET puntos_totales = puntos_totales - ? WHERE id = ?').run(evento.puntos_aplicados, usuario.id);
    mascotaService.aplicarEfectosTarea(usuario.familia_id, { ...tarea, puntos_valor: evento.puntos_aplicados }, -1);
  })();
}

// --- Registrar un evento (completar una tarea) ---
// Toca varios dominios a la vez (puntos/ranking, salud y monedas de la
// mascota, notificaciones): registrarEvento() orquesta y delega en
// mascotaService y notificacionesService para la parte de cada uno.

function registrarEvento({ usuarioId, tareaId, registradoPorId }) {
  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ? AND archivada = 0').get(tareaId);
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
    if (usuario.familia_id) notificacionesService.notificarTareaCompletada(usuario, tarea);
  }

  return { respuesta, notificarEnSegundoPlano };
}

module.exports = {
  sembrarTareasPredefinidas,
  crearTarea,
  listarTareasDeFamilia,
  editarTarea,
  eliminarTarea,
  listarHistorial,
  deshacerEvento,
  registrarEvento,
};
