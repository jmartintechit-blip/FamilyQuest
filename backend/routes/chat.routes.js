const express = require('express');
const chatController = require('../controllers/chat.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const chatSchema = require('../schemas/chat.schema');

const router = express.Router();

router.post('/mensajes', verificarToken, validar(chatSchema.enviarMensaje), chatController.enviarMensaje);
router.get('/familias/:id/mensajes', verificarToken, verificarPerteneceAFamilia, chatController.listarMensajesDeFamilia);

module.exports = router;
