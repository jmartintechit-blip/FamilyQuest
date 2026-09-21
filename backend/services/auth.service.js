const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');

async function registrar({ nombre, email, password }) {
  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    throw crearErrorHttp(409, 'Ya existe un usuario con ese email');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)');
  const resultado = stmt.run(nombre, email, passwordHash);

  return { id: resultado.lastInsertRowid, nombre, email };
}

async function iniciarSesion({ email, password }) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    throw crearErrorHttp(401, 'Email o contraseña incorrectos');
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw crearErrorHttp(401, 'Email o contraseña incorrectos');
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    familia_id: usuario.familia_id,
    token,
  };
}

async function cambiarPassword(usuarioId, { password_actual, password_nueva }) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) {
    throw crearErrorHttp(404, 'Usuario no encontrado');
  }

  const coincide = await bcrypt.compare(password_actual, usuario.password_hash);
  if (!coincide) {
    throw crearErrorHttp(401, 'La contraseña actual no es correcta');
  }

  const nuevoHash = await bcrypt.hash(password_nueva, 10);
  db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(nuevoHash, usuarioId);
}

function guardarPushToken(usuarioId, pushToken) {
  db.prepare('UPDATE usuarios SET push_token = ? WHERE id = ?').run(pushToken, usuarioId);
}

module.exports = { registrar, iniciarSesion, cambiarPassword, guardarPushToken };
