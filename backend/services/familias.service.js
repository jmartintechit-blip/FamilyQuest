const db = require('../db/conexion');

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

module.exports = { revisarResetRanking };
