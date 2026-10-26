const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/conexion');
const { salirDeFamilia } = require('./familias.service');
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

// Borra la cuenta y los datos personales: mensajes, notificaciones y los eventos que
// ella misma generó (sus puntos). En los eventos que registró para otros solo se
// quita su nombre. Si era el último miembro, salirDeFamilia borra también la familia.
async function eliminarCuenta(usuarioId, password) {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) {
    throw crearErrorHttp(404, 'Usuario no encontrado');
  }
  if (!(await bcrypt.compare(password, usuario.password_hash))) {
    throw crearErrorHttp(401, 'La contraseña no es correcta');
  }

  db.transaction(() => {
    salirDeFamilia(usuarioId);
    db.prepare('DELETE FROM mensajes WHERE usuario_id = ?').run(usuarioId);
    db.prepare('DELETE FROM notificaciones WHERE usuario_id = ?').run(usuarioId);
    db.prepare('DELETE FROM eventos WHERE usuario_id = ?').run(usuarioId);
    db.prepare('UPDATE eventos SET registrado_por = NULL WHERE registrado_por = ?').run(usuarioId);
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(usuarioId);
  })();
}

function guardarPushToken(usuarioId, pushToken) {
  db.prepare('UPDATE usuarios SET push_token = ? WHERE id = ?').run(pushToken, usuarioId);
}

module.exports = { registrar, iniciarSesion, cambiarPassword, eliminarCuenta, guardarPushToken };
