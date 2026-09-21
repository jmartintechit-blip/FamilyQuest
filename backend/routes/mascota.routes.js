const express = require('express');
const mascotaController = require('../controllers/mascota.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');

const router = express.Router();

router.get('/especies-mascota', mascotaController.obtenerCatalogoEspecies);
router.get('/cosmeticos-mascota', mascotaController.obtenerCatalogoCosmeticos);
router.put('/familias/:id/mascota', verificarToken, verificarPerteneceAFamilia, mascotaController.ponerNombre);
router.put('/familias/:id/especie', verificarToken, verificarPerteneceAFamilia, mascotaController.cambiarEspecie);
router.post('/familias/:id/desbloquear', verificarToken, verificarPerteneceAFamilia, mascotaController.desbloquearEspecie);
router.put('/familias/:id/cosmeticos', verificarToken, verificarPerteneceAFamilia, mascotaController.equiparCosmetico);
router.post('/familias/:id/desbloquear-cosmetico', verificarToken, verificarPerteneceAFamilia, mascotaController.desbloquearCosmetico);

module.exports = router;
