// Configura los eventos de Socket.IO. El envío de mensajes en sí (evento
// "mensaje_nuevo") lo dispara chat.service.js al guardar un mensaje nuevo;
// aquí solo vive el ciclo de vida de la conexión y las salas por familia.
function configurarSocketIO(io) {
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
}

module.exports = configurarSocketIO;
