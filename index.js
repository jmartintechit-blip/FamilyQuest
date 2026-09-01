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

app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
