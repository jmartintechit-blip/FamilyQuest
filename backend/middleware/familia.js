const db = require('../db/conexion');

// Devuelve el familia_id de un usuario, o null si no existe o no tiene
// familia. La usan estos middlewares y varios servicios que necesitan
// comprobar pertenencia a familia fuera de una ruta con :id.
function obtenerFamiliaDeUsuario(usuarioId) {
  const usuario = db.prepare('SELECT familia_id FROM usuarios WHERE id = ?').get(usuarioId);
  return usuario ? usuario.familia_id : null;
}

// Para rutas con :id = familia_id en la URL (GET /familias/:id, etc.):
// exige que el usuario autenticado pertenezca a esa familia.
function verificarPerteneceAFamilia(req, res, next) {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  next();
}

// Para rutas con :id = usuario_id en la URL: exige que el usuario
// autenticado sea ese mismo usuario. Mensaje personalizable porque
// algún endpoint (notificaciones) usa uno más específico.
function verificarEsUnoMismo(mensaje = 'No puedes hacer esto en nombre de otro usuario') {
  return (req, res, next) => {
    const { id } = req.params;

    if (req.usuario.id !== Number(id)) {
      return res.status(403).json({ error: mensaje });
    }

    next();
  };
}

module.exports = { obtenerFamiliaDeUsuario, verificarPerteneceAFamilia, verificarEsUnoMismo };
