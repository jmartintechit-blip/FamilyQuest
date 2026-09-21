const { z } = require('zod');

const MSG_NOMBRE = 'El nombre de la familia es obligatorio';

const crearFamilia = z.object({
  nombre: z.string({ error: MSG_NOMBRE }).trim().min(1, MSG_NOMBRE).max(60, 'El nombre de la familia es demasiado largo'),
});

const unirseConCodigo = z.object({
  usuario_id: z.number({ error: 'usuario_id es obligatorio' }).int().positive(),
  codigo_invitacion: z.string({ error: 'Código de invitación no válido' }).trim().min(1, 'Código de invitación no válido'),
});

module.exports = { crearFamilia, unirseConCodigo };
