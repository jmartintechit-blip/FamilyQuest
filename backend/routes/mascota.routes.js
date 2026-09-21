const express = require('express');
const mascotaController = require('../controllers/mascota.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const mascotaSchema = require('../schemas/mascota.schema');

const router = express.Router();

router.get('/especies-mascota', mascotaController.obtenerCatalogoEspecies);
router.get('/cosmeticos-mascota', mascotaController.obtenerCatalogoCosmeticos);
router.put(
  '/familias/:id/mascota',
  verificarToken,
  verificarPerteneceAFamilia,
  validar(mascotaSchema.ponerNombre),
  mascotaController.ponerNombre
);
router.put(
  '/familias/:id/especie',
  verificarToken,
  verificarPerteneceAFamilia,
  validar(mascotaSchema.cambiarEspecie),
  mascotaController.cambiarEspecie
);
router.post(
  '/familias/:id/desbloquear',
  verificarToken,
  verificarPerteneceAFamilia,
  validar(mascotaSchema.desbloquearEspecie),
  mascotaController.desbloquearEspecie
);
router.put(
  '/familias/:id/cosmeticos',
  verificarToken,
  verificarPerteneceAFamilia,
  validar(mascotaSchema.equiparCosmetico),
  mascotaController.equiparCosmetico
);
router.post(
  '/familias/:id/desbloquear-cosmetico',
  verificarToken,
  verificarPerteneceAFamilia,
  validar(mascotaSchema.desbloquearCosmetico),
  mascotaController.desbloquearCosmetico
);

module.exports = router;
