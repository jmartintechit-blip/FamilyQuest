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
const chatRoutes = require('./routes/chat.routes');
const mascotaRoutes = require('./routes/mascota.routes');

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: '*' }
});
// Los controladores que necesitan emitir por socket (chat) lo leen de
// req.app.get('io') en vez de importar `io` como un singleton global.
app.set('io', io);

const PUERTO = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(authRoutes);
app.use(tareasRoutes);
app.use(familiasRoutes);
app.use(chatRoutes);
app.use(mascotaRoutes);

app.get('/', (req, res) => {
    res.send('Hola Juan! Tu servidor está funcionando');
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
