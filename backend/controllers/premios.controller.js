const premiosService = require('../services/premios.service');

// Mismo patrón que el resto de controladores: los errores de negocio llevan su `status`.
function responder(res, accion, estado = 200) {
  try {
    res.status(estado).json(accion());
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

const listarPremios = (req, res) => res.json(premiosService.listarPremios(Number(req.params.id)));

const listarCanjes = (req, res) => res.json(premiosService.listarCanjes(Number(req.params.id)));

const crearPremio = (req, res) => responder(res, () => premiosService.crearPremio(req.usuario.id, req.body), 201);

const editarPremio = (req, res) => responder(res, () => premiosService.editarPremio(Number(req.params.id), req.usuario.id, req.body));

const eliminarPremio = (req, res) =>
  responder(res, () => {
    premiosService.eliminarPremio(Number(req.params.id), req.usuario.id);
    return { mensaje: 'Premio eliminado' };
  });

const canjearPremio = (req, res) => responder(res, () => premiosService.canjearPremio(Number(req.params.id), req.usuario.id));

module.exports = { listarPremios, listarCanjes, crearPremio, editarPremio, eliminarPremio, canjearPremio };
