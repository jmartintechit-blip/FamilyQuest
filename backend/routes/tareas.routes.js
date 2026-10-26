const express = require('express');
const tareasController = require('../controllers/tareas.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const tareasSchema = require('../schemas/tareas.schema');

const router = express.Router();

router.post('/tareas', verificarToken, validar(tareasSchema.crearTarea), tareasController.crearTarea);
router.get('/familias/:id/tareas', verificarToken, verificarPerteneceAFamilia, tareasController.listarTareasDeFamilia);
router.put('/tareas/:id', verificarToken, validar(tareasSchema.editarTarea), tareasController.editarTarea);
router.get('/familias/:id/historial', verificarToken, verificarPerteneceAFamilia, validar(tareasSchema.listarHistorial, 'query'), tareasController.listarHistorial);
router.delete('/eventos/:id', verificarToken, tareasController.deshacerEvento);
router.delete('/tareas/:id', verificarToken, tareasController.eliminarTarea);
router.post('/eventos', verificarToken, validar(tareasSchema.registrarEvento), tareasController.registrarEvento);

module.exports = router;
