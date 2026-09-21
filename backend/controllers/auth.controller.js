const authService = require('../services/auth.service');

async function registrar(req, res) {
  const { nombre, email, password } = req.body;

  try {
    const usuario = await authService.registrar({ nombre, email, password });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

async function iniciarSesion(req, res) {
  const { email, password } = req.body;

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

  try {
    await authService.cambiarPassword(Number(id), { password_actual, password_nueva });
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function guardarPushToken(req, res) {
  authService.guardarPushToken(req.usuario.id, req.body.push_token);
  res.json({ mensaje: 'Token guardado' });
}

module.exports = { registrar, iniciarSesion, cambiarPassword, guardarPushToken };
