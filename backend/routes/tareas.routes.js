const express = require('express');
const tareasController = require('../controllers/tareas.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');

const router = express.Router();

router.post('/tareas', verificarToken, tareasController.crearTarea);
router.get('/familias/:id/tareas', verificarToken, verificarPerteneceAFamilia, tareasController.listarTareasDeFamilia);
router.delete('/tareas/:id', verificarToken, tareasController.eliminarTarea);
router.post('/eventos', verificarToken, tareasController.registrarEvento);

module.exports = router;
