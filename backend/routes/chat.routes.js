const express = require('express');
const chatController = require('../controllers/chat.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');

const router = express.Router();

router.post('/mensajes', verificarToken, chatController.enviarMensaje);
router.get('/familias/:id/mensajes', verificarToken, verificarPerteneceAFamilia, chatController.listarMensajesDeFamilia);

module.exports = router;
