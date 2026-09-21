const express = require('express');
const familiasController = require('../controllers/familias.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia, verificarEsUnoMismo } = require('../middleware/familia');

const router = express.Router();

router.post('/familias', verificarToken, familiasController.crearFamilia);
router.post('/familias/unirse', verificarToken, familiasController.unirseConCodigo);
router.get('/familias/:id/usuarios', verificarToken, verificarPerteneceAFamilia, familiasController.listarMiembros);
router.put('/usuarios/:id/salir-familia', verificarToken, verificarEsUnoMismo(), familiasController.salirDeFamilia);
router.get('/familias/:id/ranking', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerRanking);
router.get('/familias/:id', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerFamilia);

module.exports = router;
