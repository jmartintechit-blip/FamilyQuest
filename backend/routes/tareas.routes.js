const express = require('express');
const tareasController = require('../controllers/tareas.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const tareasSchema = require('../schemas/tareas.schema');

const router = express.Router();

router.post('/tareas', verificarToken, validar(tareasSchema.crearTarea), tareasController.crearTarea);
router.get('/familias/:id/tareas', verificarToken, verificarPerteneceAFamilia, tareasController.listarTareasDeFamilia);
router.delete('/tareas/:id', verificarToken, tareasController.eliminarTarea);
router.post('/eventos', verificarToken, validar(tareasSchema.registrarEvento), tareasController.registrarEvento);

module.exports = router;
