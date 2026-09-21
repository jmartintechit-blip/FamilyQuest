const express = require('express');
const authController = require('../controllers/auth.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarEsUnoMismo } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const authSchema = require('../schemas/auth.schema');

const router = express.Router();

router.post('/registro', validar(authSchema.registro), authController.registrar);
router.post('/login', validar(authSchema.login), authController.iniciarSesion);
router.put(
  '/usuarios/:id/password',
  verificarToken,
  verificarEsUnoMismo(),
  validar(authSchema.cambiarPassword),
  authController.cambiarPassword
);
router.put('/usuarios/push-token', verificarToken, validar(authSchema.pushToken), authController.guardarPushToken);

module.exports = router;
