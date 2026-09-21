const { z } = require('zod');

const MSG_TAREA = 'Faltan datos obligatorios';

const crearTarea = z.object({
  familia_id: z.number({ error: MSG_TAREA }).int(MSG_TAREA).positive(MSG_TAREA),
  nombre: z.string({ error: MSG_TAREA }).trim().min(1, MSG_TAREA).max(100, 'El nombre de la tarea es demasiado largo'),
  puntos_valor: z.number({ error: MSG_TAREA }).int(MSG_TAREA).refine((v) => v !== 0, MSG_TAREA),
  tipo: z.enum(['positiva', 'negativa'], 'El tipo debe ser "positiva" o "negativa"'),
});

const MSG_EVENTO = 'usuario_id y tarea_id son obligatorios';

const registrarEvento = z.object({
  usuario_id: z.number({ error: MSG_EVENTO }).int(MSG_EVENTO).positive(MSG_EVENTO),
  tarea_id: z.number({ error: MSG_EVENTO }).int(MSG_EVENTO).positive(MSG_EVENTO),
});

module.exports = { crearTarea, registrarEvento };
