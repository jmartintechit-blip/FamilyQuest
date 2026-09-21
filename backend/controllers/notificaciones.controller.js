const notificacionesService = require('../services/notificaciones.service');

function listarDeUsuario(req, res) {
  const notificaciones = notificacionesService.listarDeUsuario(req.params.id);
  res.json(notificaciones);
}

function marcarTodasLeidas(req, res) {
  notificacionesService.marcarTodasLeidas(req.params.id);
  res.json({ mensaje: 'Notificaciones marcadas como leídas' });
}

module.exports = { listarDeUsuario, marcarTodasLeidas };
