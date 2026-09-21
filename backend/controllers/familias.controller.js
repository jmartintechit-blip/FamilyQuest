const familiasService = require('../services/familias.service');

function crearFamilia(req, res) {
  const familia = familiasService.crearFamilia(req.body.nombre);
  res.status(201).json(familia);
}

function unirseConCodigo(req, res) {
  const { usuario_id, codigo_invitacion } = req.body;

  if (req.usuario.id !== Number(usuario_id)) {
    return res.status(403).json({ error: 'No puedes hacer esto en nombre de otro usuario' });
  }

  try {
    const resultado = familiasService.unirseConCodigo(usuario_id, codigo_invitacion);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function listarMiembros(req, res) {
  const miembros = familiasService.listarMiembros(req.params.id);
  res.json(miembros);
}

function salirDeFamilia(req, res) {
  familiasService.salirDeFamilia(req.params.id);
  res.json({ mensaje: 'Has salido de la familia' });
}

function obtenerRanking(req, res) {
  const ranking = familiasService.obtenerRanking(req.params.id);
  res.json(ranking);
}

function obtenerFamilia(req, res) {
  try {
    const familia = familiasService.obtenerFamilia(req.params.id);
    res.json(familia);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

module.exports = { crearFamilia, unirseConCodigo, listarMiembros, salirDeFamilia, obtenerRanking, obtenerFamilia };
