const express = require('express');
const notificacionesController = require('../controllers/notificaciones.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarEsUnoMismo } = require('../middleware/familia');

const router = express.Router();

router.get(
  '/usuarios/:id/notificaciones',
  verificarToken,
  verificarEsUnoMismo('No puedes ver las notificaciones de otro usuario'),
  notificacionesController.listarDeUsuario
);
router.put(
  '/usuarios/:id/notificaciones/leer-todas',
  verificarToken,
  verificarEsUnoMismo(),
  notificacionesController.marcarTodasLeidas
);

module.exports = router;
