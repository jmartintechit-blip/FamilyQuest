const { z } = require('zod');

const MSG_MENSAJE = 'familia_id, usuario_id y texto son obligatorios';

const enviarMensaje = z.object({
  familia_id: z.number({ error: MSG_MENSAJE }).int(MSG_MENSAJE).positive(MSG_MENSAJE),
  usuario_id: z.number({ error: MSG_MENSAJE }).int(MSG_MENSAJE).positive(MSG_MENSAJE),
  texto: z.string({ error: MSG_MENSAJE }).trim().min(1, MSG_MENSAJE).max(1000, 'El mensaje es demasiado largo'),
});

module.exports = { enviarMensaje };
