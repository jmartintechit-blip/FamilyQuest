// Envuelve un esquema de Zod en un middleware de Express: valida
// req.body (o la parte que se indique) y, si algo falla, responde 400
// con el mismo formato { error: string } que ya usa el resto de la API
// (un solo mensaje, el del primer campo que falle — no una lista).
//
// Solo valida FORMA (tipos, campos obligatorios, longitudes, formatos).
// Las reglas de negocio (¿existe esa especie?, ¿te pertenece esta
// familia?, ¿tienes monedas?) se quedan en los servicios, que son
// quienes conocen esos datos.
function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen]);

    if (!resultado.success) {
      const primerError = resultado.error.issues[0];
      return res.status(400).json({ error: primerError.message });
    }

    req[origen] = resultado.data;
    next();
  };
}

module.exports = { validar };
