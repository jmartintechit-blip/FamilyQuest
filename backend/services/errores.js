// Los servicios lanzan estos errores cuando una regla de negocio falla
// (email duplicado, contraseña incorrecta, recurso ajeno...). El
// controlador los captura y responde con error.status + error.message,
// así cada servicio no necesita saber nada de Express ni de res.json.
function crearErrorHttp(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

module.exports = { crearErrorHttp };
