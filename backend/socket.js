const jwt = require('jsonwebtoken');
const { obtenerFamiliaDeUsuario } = require('./middleware/familia');

// Configura los eventos de Socket.IO. El envío de mensajes en sí (evento
// "mensaje_nuevo") lo dispara chat.service.js al guardar un mensaje nuevo;
// aquí solo vive el ciclo de vida de la conexión y las salas por familia.
function configurarSocketIO(io) {
  // Igual que verificarToken en las rutas REST: sin un JWT válido en el
  // handshake no hay conexión, así que no se puede escuchar nada.
  io.use((socket, next) => {
    try {
      socket.usuario = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      next();
    } catch (error) {
      next(new Error('Token inválido o expirado'));
    }
  });

  io.on('connection', (socket) => {

    // Solo se entra en la sala de la propia familia (el mismo criterio que
    // verificarPerteneceAFamilia). El callback es opcional: lo usan los tests.
    socket.on('unirse_familia', (familia_id, respuesta) => {
      const permitido = obtenerFamiliaDeUsuario(socket.usuario.id) === Number(familia_id);
      if (permitido) {
        socket.join(`familia_${familia_id}`);
      }
      if (typeof respuesta === 'function') respuesta({ ok: permitido });
    });

  });
}

module.exports = configurarSocketIO;
