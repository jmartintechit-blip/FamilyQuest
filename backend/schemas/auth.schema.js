const { z } = require('zod');

// Nota sobre el patrón repetido en todo este archivo: pasar el mensaje
// tanto en el constructor (z.string({ error: MSG })) como en .min(1, MSG)
// es necesario porque en Zod, si el campo falta directamente (undefined),
// falla la comprobación de tipo del constructor -no el .min()-, así que
// sin el mensaje ahí se vería el texto genérico de Zod en inglés en vez
// del nuestro.

const MSG_REGISTRO = 'Nombre, email y contraseña son obligatorios';

// Antes solo se comprobaba que password no viniera vacío; se alinea aquí
// con la misma regla de mínimo 8 caracteres que ya tenía cambiarPassword,
// para no tener dos criterios distintos de "contraseña válida" en la app.
const registro = z.object({
  nombre: z.string({ error: MSG_REGISTRO }).trim().min(1, MSG_REGISTRO).max(60, 'El nombre es demasiado largo'),
  email: z.string({ error: MSG_REGISTRO }).trim().min(1, MSG_REGISTRO).email('El email no es válido'),
  password: z.string({ error: MSG_REGISTRO }).min(1, MSG_REGISTRO).min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const MSG_LOGIN = 'Email y contraseña son obligatorios';

const login = z.object({
  email: z.string({ error: MSG_LOGIN }).trim().min(1, MSG_LOGIN),
  password: z.string({ error: MSG_LOGIN }).min(1, MSG_LOGIN),
});

const MSG_PASSWORD = 'La contraseña actual y la nueva son obligatorias';

const cambiarPassword = z.object({
  password_actual: z.string({ error: MSG_PASSWORD }).min(1, MSG_PASSWORD),
  password_nueva: z.string({ error: MSG_PASSWORD }).min(1, MSG_PASSWORD).min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

const pushToken = z.object({
  push_token: z.string({ error: 'push_token es obligatorio' }).trim().min(1, 'push_token es obligatorio'),
});

module.exports = { registro, login, cambiarPassword, pushToken };
