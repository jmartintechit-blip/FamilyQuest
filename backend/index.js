require('dotenv').config({ quiet: true });
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
const { comprobarEntorno, origenesPermitidos } = require('./config');
comprobarEntorno();
const db = require('./db/conexion');
const configurarSocketIO = require('./socket');
const authRoutes = require('./routes/auth.routes');
const tareasRoutes = require('./routes/tareas.routes');
const familiasRoutes = require('./routes/familias.routes');
const chatRoutes = require('./routes/chat.routes');
const mascotaRoutes = require('./routes/mascota.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const premiosRoutes = require('./routes/premios.routes');

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: origenesPermitidos() }
});
// Los controladores que necesitan emitir por socket (chat) lo leen de
// req.app.get('io') en vez de importar `io` como un singleton global.
app.set('io', io);

const PUERTO = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: origenesPermitidos() }));
app.use(express.json());
app.use(authRoutes);
app.use(tareasRoutes);
app.use(familiasRoutes);
app.use(chatRoutes);
app.use(mascotaRoutes);
app.use(notificacionesRoutes);
app.use(premiosRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

configurarSocketIO(io);

servidor.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});

// Cierre ordenado: deja de aceptar conexiones, cierra los sockets y la base de datos.
function cerrar() {
  io.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
