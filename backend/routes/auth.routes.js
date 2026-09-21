const express = require('express');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarEsUnoMismo } = require('../middleware/familia');

const router = express.Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.iniciarSesion);
router.put('/usuarios/:id/password', verificarToken, verificarEsUnoMismo(), authController.cambiarPassword);
router.put('/usuarios/push-token', verificarToken, authController.guardarPushToken);

module.exports = router;
