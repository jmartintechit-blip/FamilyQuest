const express = require('express');
const db = require('./db');

const app = express();
const PUERTO = 3000;

app.use(express.json());

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
app.post('/familias', (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la familia es obligatorio ' });
    }

    const codigo = generarCodigo();
    const stmt = db.prepare('INSERT INTO familias (nombre, codigo_invitacion) VALUES (?, ?)');
    const resultado = stmt.run(nombre, codigo);

    res.status(201).json({ id: resultado.lastInsertRowid, nombre, codigo_invitacion: codigo });
});

app.post('/familias/unirse', (req, res) => {
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

app.post('/tareas', (req, res) => {
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

app.post('/eventos', (req, res) => {
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
    'INSERT INTO eventos (usuario_id, tarea_id, puntos_aplicados) VALUES (?, ?, ?)'
  );
  const resultado = insertarEvento.run(usuario_id, tarea_id, tarea.puntos_valor);

  db.prepare('UPDATE usuarios SET puntos_totales = puntos_totales + ? WHERE id = ?')
    .run(tarea.puntos_valor, usuario_id);

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

app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
