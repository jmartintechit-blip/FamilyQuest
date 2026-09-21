const { z } = require('zod');

const MSG_NOMBRE_MASCOTA = 'El nombre de la mascota es obligatorio';

// Antes un nombre de más de 20 caracteres se recortaba en silencio; con
// validación de verdad, se rechaza con un mensaje claro en vez de guardar
// algo distinto de lo que el usuario escribió.
const ponerNombre = z.object({
  nombre_mascota: z.string({ error: MSG_NOMBRE_MASCOTA }).trim().min(1, MSG_NOMBRE_MASCOTA).max(20, 'El nombre de la mascota no puede tener más de 20 caracteres'),
});

const cambiarEspecie = z.object({
  especie: z.string({ error: 'Especie no válida' }).trim().min(1, 'Especie no válida'),
});

const desbloquearEspecie = z.object({
  especie: z.string({ error: 'Especie no válida' }).trim().min(1, 'Especie no válida'),
});

const MSG_SLOT = 'Falta la categoría del complemento';
const MSG_COSMETICO = 'Complemento no válido para esa categoría';

// cosmetico puede ser null a propósito (quitarse el complemento de esa
// categoría), así que se valida como string no vacío O null — nunca
// ausente del todo.
const equiparCosmetico = z.object({
  slot: z.string({ error: MSG_SLOT }).trim().min(1, MSG_SLOT),
  cosmetico: z.string({ error: MSG_COSMETICO }).trim().min(1, MSG_COSMETICO).nullable(),
});

const desbloquearCosmetico = z.object({
  cosmetico: z.string({ error: 'Complemento no válido' }).trim().min(1, 'Complemento no válido'),
});

module.exports = { ponerNombre, cambiarEspecie, desbloquearEspecie, equiparCosmetico, desbloquearCosmetico };
