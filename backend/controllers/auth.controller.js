const authService = require('../services/auth.service');

async function registrar(req, res) {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  try {
    const usuario = await authService.registrar({ nombre, email, password });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

async function iniciarSesion(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const sesion = await authService.iniciarSesion({ email, password });
    res.json(sesion);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

async function cambiarPassword(req, res) {
  const { id } = req.params;
  const { password_actual, password_nueva } = req.body;

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'La contraseña actual y la nueva son obligatorias' });
  }

  if (password_nueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  try {
    await authService.cambiarPassword(Number(id), { password_actual, password_nueva });
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function guardarPushToken(req, res) {
  const { push_token } = req.body;

  if (!push_token) {
    return res.status(400).json({ error: 'push_token es obligatorio' });
  }

  authService.guardarPushToken(req.usuario.id, push_token);
  res.json({ mensaje: 'Token guardado' });
}

module.exports = { registrar, iniciarSesion, cambiarPassword, guardarPushToken };
