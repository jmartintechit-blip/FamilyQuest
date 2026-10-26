const express = require('express');
const premiosController = require('../controllers/premios.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const premiosSchema = require('../schemas/premios.schema');

const router = express.Router();

router.get('/familias/:id/premios', verificarToken, verificarPerteneceAFamilia, premiosController.listarPremios);
router.get('/familias/:id/canjes', verificarToken, verificarPerteneceAFamilia, premiosController.listarCanjes);
router.post('/premios', verificarToken, validar(premiosSchema.crearPremio), premiosController.crearPremio);
router.put('/premios/:id', verificarToken, validar(premiosSchema.editarPremio), premiosController.editarPremio);
router.delete('/premios/:id', verificarToken, premiosController.eliminarPremio);
router.post('/premios/:id/canjear', verificarToken, premiosController.canjearPremio);

module.exports = router;
