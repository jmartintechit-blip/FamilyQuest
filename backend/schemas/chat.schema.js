const { z } = require('zod');

const MSG_MENSAJE = 'familia_id, usuario_id y texto son obligatorios';

const enviarMensaje = z.object({
  familia_id: z.number({ error: MSG_MENSAJE }).int(MSG_MENSAJE).positive(MSG_MENSAJE),
  usuario_id: z.number({ error: MSG_MENSAJE }).int(MSG_MENSAJE).positive(MSG_MENSAJE),
  texto: z.string({ error: MSG_MENSAJE }).trim().min(1, MSG_MENSAJE).max(1000, 'El mensaje es demasiado largo'),
});

// ?antes=<id del mensaje más antiguo cargado>&limite=<1-100, por defecto 50>
const listarMensajes = z.object({
  antes: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = { enviarMensaje, listarMensajes };
