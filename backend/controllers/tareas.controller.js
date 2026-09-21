const tareasService = require('../services/tareas.service');

function crearTarea(req, res) {
  const { familia_id, nombre, puntos_valor, tipo } = req.body;

  if (!familia_id || !nombre || puntos_valor === undefined || !tipo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  if (tipo !== 'positiva' && tipo !== 'negativa') {
    return res.status(400).json({ error: 'El tipo debe ser "positiva" o "negativa"' });
  }

  try {
    const tarea = tareasService.crearTarea(req.usuario.id, { familia_id, nombre, puntos_valor, tipo });
    res.status(201).json(tarea);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function listarTareasDeFamilia(req, res) {
  const tareas = tareasService.listarTareasDeFamilia(req.params.id);
  res.json(tareas);
}

function eliminarTarea(req, res) {
  try {
    tareasService.eliminarTarea(req.params.id, req.usuario.id);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

function registrarEvento(req, res) {
  const { usuario_id, tarea_id } = req.body;

  if (!usuario_id || !tarea_id) {
    return res.status(400).json({ error: 'usuario_id y tarea_id son obligatorios' });
  }

  try {
    const { respuesta, notificarEnSegundoPlano } = tareasService.registrarEvento({
      usuarioId: usuario_id,
      tareaId: tarea_id,
      registradoPorId: req.usuario.id,
    });

    res.status(201).json(respuesta);
    notificarEnSegundoPlano();
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
}

module.exports = { crearTarea, listarTareasDeFamilia, eliminarTarea, registrarEvento };
