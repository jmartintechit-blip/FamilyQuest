require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: '*' }
});

const PUERTO = 3000;

app.use(express.json()); 
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hola Juan! Tu servidor está funcionando');
});

app.post('/usuarios', (req, res) => {
    const { nombre, email } = req.body;

    if (!nombre || !email) {
        return res.status(400).json({ error: 'Nombre y email son obligatorios' });
    }

    const stmt = db.prepare('INSERT INTO usuarios (nombre, email) VALUES (?, ?)');
    const resultado = stmt.run(nombre, email);

    res.status(201).json({ id: resultado.lastInsertRowid, nombre, email });
});

app.get('/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT * FROM usuarios').all();
  res.json(usuarios);
});

function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
app.post('/familias', verificarToken, (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la familia es obligatorio ' });
    }

    const codigo = generarCodigo();
    const stmt = db.prepare('INSERT INTO familias (nombre, codigo_invitacion) VALUES (?, ?)');
    const resultado = stmt.run(nombre, codigo);

    res.status(201).json({ id: resultado.lastInsertRowid, nombre, codigo_invitacion: codigo });
});

app.post('/familias/unirse', verificarToken, (req, res) => {
    const { usuario_id, codigo_invitacion } = req.body;

    const familia = db.prepare('SELECT * FROM familias WHERE codigo_invitacion = ?').get(codigo_invitacion);

    if (!familia) {
        return res.status(404).json({ error: 'Código de invitación no válido' });
    }

    db.prepare('UPDATE usuarios SET familia_id = ? WHERE id = ?').run(familia.id, usuario_id);

    res.json({ mensaje: `Usuario unido a la familia "${familia.nombre}" correctamente` });
});

app.get('/familias/:id/usuarios', (req, res) => {
    const { id } = req.params;
    const usuarios = db.prepare('SELECT * FROM usuarios WHERE familia_id = ?').all(id);
    res.json(usuarios);
});

app.post('/tareas', verificarToken, (req, res) => {
  const { familia_id, nombre, puntos_valor, tipo } = req.body;

  if (!familia_id || !nombre || puntos_valor === undefined || !tipo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  if (tipo !== 'positiva' && tipo !== 'negativa') {
    return res.status(400).json({ error: 'El tipo debe ser "positiva" o "negativa"' });
  }

  const stmt = db.prepare('INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)');
  const resultado = stmt.run(familia_id, nombre, puntos_valor, tipo);

  res.status(201).json({ id: resultado.lastInsertRowid, familia_id, nombre, puntos_valor, tipo });
});

app.get('/familias/:id/tareas', (req, res) => {
  const { id } = req.params;
  const tareas = db.prepare('SELECT * FROM tareas WHERE familia_id = ?').all(id);
  res.json(tareas);
});

app.post('/eventos', verificarToken, (req, res) => {
  const { usuario_id, tarea_id } = req.body;

  if (!usuario_id || !tarea_id) {
    return res.status(400).json({ error: 'usuario_id y tarea_id son obligatorios' });
  }

  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(tarea_id);
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario_id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const insertarEvento = db.prepare(
    'INSERT INTO eventos (usuario_id, tarea_id, puntos_aplicados, registrado_por) VALUES (?, ?, ?, ?)'
  );
  const resultado = insertarEvento.run(usuario_id, tarea_id, tarea.puntos_valor, req.usuario.id);

  db.prepare('UPDATE usuarios SET puntos_totales = puntos_totales + ? WHERE id = ?')
    .run(tarea.puntos_valor, usuario_id);

  const cambioSalud = tarea.tipo === 'positiva' ? 3 : -5;

  db.prepare(`
    UPDATE familias 
    SET salud_mascota = MAX(0, MIN(100, salud_mascota + ?)) 
    WHERE id = (SELECT familia_id FROM usuarios WHERE id = ?)
  `).run(cambioSalud, usuario_id);

  res.status(201).json({
    id: resultado.lastInsertRowid,
    mensaje: `${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos aplicados a ${usuario.nombre}`
  });
});

app.get('/familias/:id/ranking', (req, res) => {
  const { id } = req.params;
  const ranking = db.prepare(
    'SELECT nombre, puntos_totales FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
  ).all(id);
  res.json(ranking);
});

app.get('/familias/:id', (req, res) => {
  const { id } = req.params;
  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);

  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  res.json(familia);
});

app.post('/mensajes', verificarToken, (req, res) => {
  const { familia_id, usuario_id, texto } = req.body;

  if (!familia_id || !usuario_id || !texto) {
    return res.status(400).json({ error: 'familia_id, usuario_id y texto son obligatorios' });
  }

  const stmt = db.prepare('INSERT INTO mensajes (familia_id, usuario_id, texto) VALUES (?, ?, ?)');
  const resultado = stmt.run(familia_id, usuario_id, texto);

  const usuario = db.prepare('SELECT nombre FROM usuarios WHERE id = ?').get(usuario_id);

  const mensajeCompleto = {
    id: resultado.lastInsertRowid,
    familia_id,
    usuario_id,
    texto,
    autor: usuario.nombre,
    fecha_hora: new Date().toISOString()
  };

  io.to(`familia_${familia_id}`).emit('mensaje_nuevo', mensajeCompleto);

  res.status(201).json(mensajeCompleto);
});

app.get('/familias/:id/mensajes', (req, res) => {
  const { id } = req.params;
  const mensajes = db.prepare(`
    SELECT mensajes.id, mensajes.texto, mensajes.fecha_hora, usuarios.nombre AS autor
    FROM mensajes
    JOIN usuarios ON mensajes.usuario_id = usuarios.id
    WHERE mensajes.familia_id = ?
    ORDER BY mensajes.fecha_hora ASC
  `).all(id);

  res.json(mensajes);
});

app.get('/usuarios/:id/notificaciones', (req, res) => {
  const { id } = req.params;
  const notificaciones = db.prepare(
    'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha_hora DESC'
  ).all(id);

  res.json(notificaciones);
});

app.put('/notificaciones/:id/leida', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notificaciones SET leida = 1 WHERE id = ?').run(id);
  res.json({ mensaje: 'Notificación marcada como leída' });
});

io.on('connection', (socket) => {
  console.log('Alguien se ha conectado:', socket.id);

  socket.on('unirse_familia', (familia_id) => {
    socket.join(`familia_${familia_id}`);
    console.log(`Socket ${socket.id} se unió a familia_${familia_id}`);
  });

  socket.on('disconnect', () => {
    console.log('Alguien se ha desconectado:', socket.id);
  });
});

app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const stmt = db.prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)');
  const resultado = stmt.run(nombre, email, passwordHash);

  res.status(201).json({ id: resultado.lastInsertRowid, nombre, email });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    familia_id: usuario.familia_id,
    token
  });
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
