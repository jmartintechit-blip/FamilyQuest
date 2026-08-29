const express = require('express');
const app = express();
const PUERTO = 3000;

app.get('/', (req, res) => {
  res.send('¡Hola Juan! Tu servidor está funcionando 🎉');
});

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
}); 