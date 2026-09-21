const mascotaService = require('../services/mascota.service');

function obtenerCatalogoEspecies(req, res) {
  res.json(mascotaService.obtenerCatalogoEspecies());
}

function obtenerCatalogoCosmeticos(req, res) {
  res.json(mascotaService.obtenerCatalogoCosmeticos());
}

function ponerNombre(req, res) {
  const { nombre_mascota } = req.body;

  if (!nombre_mascota || !nombre_mascota.trim()) {
    return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
  }

  try {
    const resultado = mascotaService.ponerNombre(req.params.id, nombre_mascota);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function cambiarEspecie(req, res) {
  try {
    const resultado = mascotaService.cambiarEspecie(req.params.id, req.body.especie);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function desbloquearEspecie(req, res) {
  try {
    const resultado = mascotaService.desbloquearEspecie(req.params.id, req.body.especie);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function equiparCosmetico(req, res) {
  const { slot, cosmetico } = req.body;

  if (!slot) {
    return res.status(400).json({ error: 'Falta la categoría del complemento' });
  }

  try {
    const resultado = mascotaService.equiparCosmetico(req.params.id, slot, cosmetico);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function desbloquearCosmetico(req, res) {
  try {
    const resultado = mascotaService.desbloquearCosmetico(req.params.id, req.body.cosmetico);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

module.exports = {
  obtenerCatalogoEspecies,
  obtenerCatalogoCosmeticos,
  ponerNombre,
  cambiarEspecie,
  desbloquearEspecie,
  equiparCosmetico,
  desbloquearCosmetico,
};
