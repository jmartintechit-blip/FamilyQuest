const express = require('express');
const familiasController = require('../controllers/familias.controller');
const { verificarToken } = require('../middleware/auth');
const { verificarPerteneceAFamilia, verificarEsUnoMismo } = require('../middleware/familia');
const { crearLimite } = require('../middleware/limites');
const { validar } = require('../middleware/validar');
const familiasSchema = require('../schemas/familias.schema');

const router = express.Router();

router.post('/familias', verificarToken, validar(familiasSchema.crearFamilia), familiasController.crearFamilia);
router.post('/familias/unirse', verificarToken, crearLimite(), validar(familiasSchema.unirseConCodigo), familiasController.unirseConCodigo);
router.get('/familias/:id/usuarios', verificarToken, verificarPerteneceAFamilia, familiasController.listarMiembros);
router.put('/usuarios/:id/salir-familia', verificarToken, verificarEsUnoMismo(), familiasController.salirDeFamilia);
router.get('/familias/:id/ranking', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerRanking);
router.get('/familias/:id/resumen-semanal', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerResumenSemanal);
router.get('/familias/:id', verificarToken, verificarPerteneceAFamilia, familiasController.obtenerFamilia);
router.put('/familias/:id', verificarToken, verificarPerteneceAFamilia, validar(familiasSchema.renombrarFamilia), familiasController.renombrarFamilia);
router.post('/familias/:id/codigo', verificarToken, verificarPerteneceAFamilia, familiasController.regenerarCodigo);
router.delete('/familias/:id/usuarios/:usuarioId', verificarToken, verificarPerteneceAFamilia, familiasController.expulsarMiembro);

module.exports = router;
