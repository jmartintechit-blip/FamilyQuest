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

app.listen(PUERTO, () => {
    console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
