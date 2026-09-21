const express = require('express');
const familiasController = require('../controllers/familias.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia, verificarEsUnoMismo } = require('../middleware/familia');
const { validar } = require('../middleware/validar');
const familiasSchema = require('../schemas/familias.schema');

const router = express.Router();

router.post('/familias', verificarToken, validar(familiasSchema.crearFamilia), familiasController.crearFamilia);
router.post('/familias/unirse', verificarToken, validar(familiasSchema.unirseConCodigo), familiasController.unirseConCodigo);
router.get('/familias/:id/usuarios', verificarToken, verificarPerteneceAFamilia, familiasController.listarMiembros);
router.put('/usuarios/:id/salir-familia', verificarToken, verificarEsUnoMismo(), familiasController.salirDeFamilia);
router.get('/familias/:id/ranking', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerRanking);
router.get('/familias/:id', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerFamilia);

module.exports = router;
