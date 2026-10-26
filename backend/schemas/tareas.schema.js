const { z } = require('zod');

const MSG_TAREA = 'Faltan datos obligatorios';

const crearTarea = z.object({
  familia_id: z.number({ error: MSG_TAREA }).int(MSG_TAREA).positive(MSG_TAREA),
  nombre: z.string({ error: MSG_TAREA }).trim().min(1, MSG_TAREA).max(100, 'El nombre de la tarea es demasiado largo'),
  puntos_valor: z.number({ error: MSG_TAREA }).int(MSG_TAREA).refine((v) => v !== 0, MSG_TAREA),
  tipo: z.enum(['positiva', 'negativa'], 'El tipo debe ser "positiva" o "negativa"'),
});

// Editar una tarea: mismos campos que al crearla, sin familia_id (la tarea ya pertenece a una).
const editarTarea = crearTarea.omit({ familia_id: true });

const MSG_EVENTO = 'usuario_id y tarea_id son obligatorios';

const registrarEvento = z.object({
  usuario_id: z.number({ error: MSG_EVENTO }).int(MSG_EVENTO).positive(MSG_EVENTO),
  tarea_id: z.number({ error: MSG_EVENTO }).int(MSG_EVENTO).positive(MSG_EVENTO),
});

// ?antes=<id del evento más antiguo cargado>&limite=<1-100, por defecto 30>
const listarHistorial = z.object({
  antes: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().min(1).max(100).default(30),
});

module.exports = { crearTarea, editarTarea, registrarEvento, listarHistorial };
