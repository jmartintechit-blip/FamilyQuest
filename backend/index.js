require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db/conexion');
const configurarSocketIO = require('./socket');
const { verificarToken } = require('./middleware/auth');
const { obtenerFamiliaDeUsuario, verificarPerteneceAFamilia, verificarEsUnoMismo } = require('./middleware/familia');
const authRoutes = require('./routes/auth.routes');
const tareasRoutes = require('./routes/tareas.routes');
const familiasRoutes = require('./routes/familias.routes');

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: '*' }
});

const PUERTO = 3000;

// Catálogo de especies de mascota disponibles y su coste en monedas para
// desbloquearlas. "manzana" es la especie inicial, gratis para toda familia.
const ESPECIES_MASCOTA = {
  manzana: { costo: 0 },
  oso: { costo: 40 },
  capibara: { costo: 70 },
  zorro: { costo: 100 },
  panda: { costo: 130 },
  conejo: { costo: 160 },
};

// Catálogo de complementos: cada uno pertenece a una categoría ("slot") y
// solo puede haber uno equipado por categoría a la vez.
const COSMETICOS_MASCOTA = {
  gorro_fiesta: { slot: 'sombrero', costo: 30 },
  corona: { slot: 'sombrero', costo: 90 },
  gafas_sol: { slot: 'gafas', costo: 50 },
  gafas_pasta: { slot: 'gafas', costo: 50 },
  pajarita: { slot: 'cuello', costo: 30 },
  bufanda: { slot: 'cuello', costo: 60 },
};

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(authRoutes);
app.use(tareasRoutes);
app.use(familiasRoutes);

app.get('/', (req, res) => {
    res.send('Hola Juan! Tu servidor está funcionando');
});

app.put('/familias/:id/mascota', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre_mascota } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!nombre_mascota || !nombre_mascota.trim()) {
    return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
  }

  const nombreLimpio = nombre_mascota.trim().slice(0, 20);

  const resultado = db.prepare('UPDATE familias SET nombre_mascota = ? WHERE id = ?').run(nombreLimpio, id);

  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  res.json({ nombre_mascota: nombreLimpio });
});

app.get('/especies-mascota', (req, res) => {
  res.json(ESPECIES_MASCOTA);
});

app.put('/familias/:id/especie', verificarToken, (req, res) => {
  const { id } = req.params;
  const { especie } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!ESPECIES_MASCOTA[especie]) {
    return res.status(400).json({ error: 'Especie no válida' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (!desbloqueadas.includes(especie)) {
    return res.status(403).json({ error: 'Todavía no has desbloqueado esa especie' });
  }

  db.prepare('UPDATE familias SET especie_mascota = ? WHERE id = ?').run(especie, id);

  res.json({ especie_mascota: especie });
});

app.post('/familias/:id/desbloquear', verificarToken, (req, res) => {
  const { id } = req.params;
  const { especie } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const definicion = ESPECIES_MASCOTA[especie];
  if (!definicion) {
    return res.status(400).json({ error: 'Especie no válida' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (desbloqueadas.includes(especie)) {
    return res.status(409).json({ error: 'Esa especie ya está desbloqueada' });
  }

  if (familia.monedas < definicion.costo) {
    return res.status(400).json({ error: 'No tienes monedas suficientes' });
  }

  const nuevasDesbloqueadas = [...desbloqueadas, especie];

  db.prepare('UPDATE familias SET monedas = monedas - ?, especies_desbloqueadas = ?, especie_mascota = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevasDesbloqueadas), especie, id);

  res.json({
    especie_mascota: especie,
    especies_desbloqueadas: nuevasDesbloqueadas,
    monedas: familia.monedas - definicion.costo,
  });
});

app.get('/cosmeticos-mascota', (req, res) => {
  res.json(COSMETICOS_MASCOTA);
});

app.put('/familias/:id/cosmeticos', verificarToken, (req, res) => {
  const { id } = req.params;
  const { slot, cosmetico } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!slot) {
    return res.status(400).json({ error: 'Falta la categoría del complemento' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  // cosmetico = null quita lo que hubiera puesto en esa categoría
  if (cosmetico !== null) {
    const definicion = COSMETICOS_MASCOTA[cosmetico];
    if (!definicion || definicion.slot !== slot) {
      return res.status(400).json({ error: 'Complemento no válido para esa categoría' });
    }

    const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
    if (!desbloqueados.includes(cosmetico)) {
      return res.status(403).json({ error: 'Todavía no has desbloqueado ese complemento' });
    }
  }

  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[slot] = cosmetico;

  db.prepare('UPDATE familias SET cosmeticos_equipados = ? WHERE id = ?').run(JSON.stringify(equipados), id);

  res.json({ cosmeticos_equipados: equipados });
});

app.post('/familias/:id/desbloquear-cosmetico', verificarToken, (req, res) => {
  const { id } = req.params;
  const { cosmetico } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const definicion = COSMETICOS_MASCOTA[cosmetico];
  if (!definicion) {
    return res.status(400).json({ error: 'Complemento no válido' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
  if (desbloqueados.includes(cosmetico)) {
    return res.status(409).json({ error: 'Ese complemento ya está desbloqueado' });
  }

  if (familia.monedas < definicion.costo) {
    return res.status(400).json({ error: 'No tienes monedas suficientes' });
  }

  const nuevosDesbloqueados = [...desbloqueados, cosmetico];
  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[definicion.slot] = cosmetico;

  db.prepare('UPDATE familias SET monedas = monedas - ?, cosmeticos_desbloqueados = ?, cosmeticos_equipados = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevosDesbloqueados), JSON.stringify(equipados), id);

  res.json({
    cosmeticos_desbloqueados: nuevosDesbloqueados,
    cosmeticos_equipados: equipados,
    monedas: familia.monedas - definicion.costo,
  });
});

app.post('/mensajes', verificarToken, (req, res) => {
  const { familia_id, usuario_id, texto } = req.body;

  if (!familia_id || !usuario_id || !texto) {
    return res.status(400).json({ error: 'familia_id, usuario_id y texto son obligatorios' });
  }

  if (req.usuario.id !== Number(usuario_id) || obtenerFamiliaDeUsuario(req.usuario.id) !== Number(familia_id)) {
    return res.status(403).json({ error: 'No puedes enviar mensajes en nombre de otro usuario o de otra familia' });
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

app.get('/familias/:id/mensajes', verificarToken, (req, res) => {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const mensajes = db.prepare(`
    SELECT mensajes.id, mensajes.texto, mensajes.fecha_hora, usuarios.nombre AS autor
    FROM mensajes
    JOIN usuarios ON mensajes.usuario_id = usuarios.id
    WHERE mensajes.familia_id = ?
    ORDER BY mensajes.fecha_hora ASC
  `).all(id);

  res.json(mensajes);
});

app.get('/usuarios/:id/notificaciones', verificarToken, (req, res) => {
  const { id } = req.params;

  if (req.usuario.id !== Number(id)) {
    return res.status(403).json({ error: 'No puedes ver las notificaciones de otro usuario' });
  }

  const notificaciones = db.prepare(
    'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha_hora DESC LIMIT 100'
  ).all(id);

  res.json(notificaciones);
});

app.put('/usuarios/:id/notificaciones/leer-todas', verificarToken, (req, res) => {
  const { id } = req.params;

  if (req.usuario.id !== Number(id)) {
    return res.status(403).json({ error: 'No puedes hacer esto en nombre de otro usuario' });
  }

  db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?').run(id);
  res.json({ mensaje: 'Notificaciones marcadas como leídas' });
});

configurarSocketIO(io);

servidor.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
