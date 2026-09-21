const chatService = require('../services/chat.service');

function enviarMensaje(req, res) {
  const { familia_id, usuario_id, texto } = req.body;

  try {
    const io = req.app.get('io');
    const mensaje = chatService.enviarMensaje(io, {
      familiaId: familia_id,
      usuarioId: usuario_id,
      texto,
      remitenteId: req.usuario.id,
    });
    res.status(201).json(mensaje);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function listarMensajesDeFamilia(req, res) {
  const mensajes = chatService.listarMensajesDeFamilia(req.params.id);
  res.json(mensajes);
}

module.exports = { enviarMensaje, listarMensajesDeFamilia };
