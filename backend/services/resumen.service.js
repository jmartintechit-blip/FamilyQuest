const db = require('../db/conexion');

// Primer valor de ranking_ultimo_reset en una familia recién creada: no es una semana
// real, así que el reinicio inicial no genera resumen.
const RESET_INICIAL = '2024-01-01 00:00:00';

// Se llama justo antes de reiniciar los puntos: resume lo ocurrido desde el reinicio
// anterior (eventos de los miembros actuales) y lo guarda. Sin actividad no se guarda nada.
function guardarResumen(familiaId, desde) {
  if (desde === RESET_INICIAL) return;

  const porMiembro = db.prepare(`
    SELECT usuarios.id AS usuario_id, usuarios.nombre,
           SUM(eventos.puntos_aplicados) AS puntos, COUNT(*) AS tareas
    FROM eventos
    JOIN usuarios ON usuarios.id = eventos.usuario_id
    WHERE usuarios.familia_id = ? AND eventos.fecha_hora >= ?
    GROUP BY usuarios.id
    ORDER BY puntos DESC, tareas DESC, usuarios.id
  `).all(familiaId, desde);
  if (porMiembro.length === 0) return;

  const tareaTop = db.prepare(`
    SELECT tareas.nombre, COUNT(*) AS veces
    FROM eventos
    JOIN usuarios ON usuarios.id = eventos.usuario_id
    JOIN tareas ON tareas.id = eventos.tarea_id
    WHERE usuarios.familia_id = ? AND eventos.fecha_hora >= ? AND tareas.tipo = 'positiva'
    GROUP BY tareas.id
    ORDER BY veces DESC, tareas.id
    LIMIT 1
  `).get(familiaId, desde) || null;

  // Gana quien más puntos suma; si nadie pasó de 0 no hay ganador esa semana.
  const ganador = porMiembro[0].puntos > 0 ? porMiembro[0] : null;
  const datos = {
    ranking: porMiembro,
    ganador: ganador && { usuario_id: ganador.usuario_id, nombre: ganador.nombre, puntos: ganador.puntos },
    tarea_top: tareaTop,
    total_tareas: porMiembro.reduce((suma, m) => suma + m.tareas, 0),
  };

  db.prepare(`
    INSERT INTO resumenes_semanales (familia_id, semana_inicio, semana_fin, datos)
    VALUES (?, ?, CURRENT_TIMESTAMP, ?)
  `).run(familiaId, desde, JSON.stringify(datos));
}

// El último resumen de la familia, o null si todavía no hay ninguno.
function obtenerUltimoResumen(familiaId) {
  const fila = db.prepare(
    'SELECT semana_inicio, semana_fin, datos FROM resumenes_semanales WHERE familia_id = ? ORDER BY id DESC LIMIT 1'
  ).get(familiaId);
  if (!fila) return null;
  return { semana_inicio: fila.semana_inicio, semana_fin: fila.semana_fin, ...JSON.parse(fila.datos) };
}

module.exports = { guardarResumen, obtenerUltimoResumen };
