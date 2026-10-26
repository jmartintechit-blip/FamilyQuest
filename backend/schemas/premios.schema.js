const { z } = require('zod');

const MSG_PREMIO = 'El nombre y el coste del premio son obligatorios';

const premio = z.object({
  nombre: z.string({ error: MSG_PREMIO }).trim().min(1, MSG_PREMIO).max(60, 'El nombre del premio es demasiado largo'),
  costo: z.number({ error: MSG_PREMIO }).int(MSG_PREMIO).min(1, 'El coste debe ser al menos 1 moneda').max(10000, 'El coste es demasiado alto'),
});

const crearPremio = premio.extend({
  familia_id: z.number({ error: MSG_PREMIO }).int(MSG_PREMIO).positive(MSG_PREMIO),
});

module.exports = { crearPremio, editarPremio: premio };
