require('dotenv').config({ quiet: true });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('./db/conexion');
const configurarSocketIO = require('./socket');
const authRoutes = require('./routes/auth.routes');
const tareasRoutes = require('./routes/tareas.routes');
const familiasRoutes = require('./routes/familias.routes');
const chatRoutes = require('./routes/chat.routes');
const mascotaRoutes = require('./routes/mascota.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');

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
app.use(notificacionesRoutes);

app.get('/', (req, res) => {
    res.send('Hola Juan! Tu servidor está funcionando');
});

configurarSocketIO(io);

servidor.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
