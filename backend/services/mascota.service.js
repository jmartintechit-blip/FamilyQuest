const db = require('../db/conexion');
const { crearErrorHttp } = require('./errores');

// Catálogo de especies de mascota disponibles y su coste en monedas para
// desbloquearlas. "manzana" es la especie inicial, gratis para toda familia.
const ESPECIES_MASCOTA = {
  manzana: { costo: 0 },
  oso: { costo: 40 },
  capibara: { costo: 70 },
  zorro: { costo: 100 },
  panda: { costo: 130 },
  conejo: { costo: 160 },
};

// Catálogo de complementos: cada uno pertenece a una categoría ("slot") y
// solo puede haber uno equipado por categoría a la vez.
const COSMETICOS_MASCOTA = {
  gorro_fiesta: { slot: 'sombrero', costo: 30 },
  corona: { slot: 'sombrero', costo: 90 },
  gafas_sol: { slot: 'gafas', costo: 50 },
  gafas_pasta: { slot: 'gafas', costo: 50 },
  pajarita: { slot: 'cuello', costo: 30 },
  bufanda: { slot: 'cuello', costo: 60 },
};

function obtenerCatalogoEspecies() {
  return ESPECIES_MASCOTA;
}

function obtenerCatalogoCosmeticos() {
  return COSMETICOS_MASCOTA;
}

function ponerNombre(familiaId, nombreMascota) {
  const nombreLimpio = nombreMascota.trim().slice(0, 20);
  const resultado = db.prepare('UPDATE familias SET nombre_mascota = ? WHERE id = ?').run(nombreLimpio, familiaId);

  if (resultado.changes === 0) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  return { nombre_mascota: nombreLimpio };
}

function cambiarEspecie(familiaId, especie) {
  if (!ESPECIES_MASCOTA[especie]) {
    throw crearErrorHttp(400, 'Especie no válida');
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(familiaId);
  if (!familia) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (!desbloqueadas.includes(especie)) {
    throw crearErrorHttp(403, 'Todavía no has desbloqueado esa especie');
  }

  db.prepare('UPDATE familias SET especie_mascota = ? WHERE id = ?').run(especie, familiaId);

  return { especie_mascota: especie };
}

function desbloquearEspecie(familiaId, especie) {
  const definicion = ESPECIES_MASCOTA[especie];
  if (!definicion) {
    throw crearErrorHttp(400, 'Especie no válida');
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(familiaId);
  if (!familia) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (desbloqueadas.includes(especie)) {
    throw crearErrorHttp(409, 'Esa especie ya está desbloqueada');
  }

  if (familia.monedas < definicion.costo) {
    throw crearErrorHttp(400, 'No tienes monedas suficientes');
  }

  const nuevasDesbloqueadas = [...desbloqueadas, especie];

  db.prepare('UPDATE familias SET monedas = monedas - ?, especies_desbloqueadas = ?, especie_mascota = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevasDesbloqueadas), especie, familiaId);

  return {
    especie_mascota: especie,
    especies_desbloqueadas: nuevasDesbloqueadas,
    monedas: familia.monedas - definicion.costo,
  };
}

function equiparCosmetico(familiaId, slot, cosmetico) {
  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(familiaId);
  if (!familia) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  // cosmetico = null quita lo que hubiera puesto en esa categoría
  if (cosmetico !== null) {
    const definicion = COSMETICOS_MASCOTA[cosmetico];
    if (!definicion || definicion.slot !== slot) {
      throw crearErrorHttp(400, 'Complemento no válido para esa categoría');
    }

    const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
    if (!desbloqueados.includes(cosmetico)) {
      throw crearErrorHttp(403, 'Todavía no has desbloqueado ese complemento');
    }
  }

  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[slot] = cosmetico;

  db.prepare('UPDATE familias SET cosmeticos_equipados = ? WHERE id = ?').run(JSON.stringify(equipados), familiaId);

  return { cosmeticos_equipados: equipados };
}

function desbloquearCosmetico(familiaId, cosmetico) {
  const definicion = COSMETICOS_MASCOTA[cosmetico];
  if (!definicion) {
    throw crearErrorHttp(400, 'Complemento no válido');
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(familiaId);
  if (!familia) {
    throw crearErrorHttp(404, 'Familia no encontrada');
  }

  const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
  if (desbloqueados.includes(cosmetico)) {
    throw crearErrorHttp(409, 'Ese complemento ya está desbloqueado');
  }

  if (familia.monedas < definicion.costo) {
    throw crearErrorHttp(400, 'No tienes monedas suficientes');
  }

  const nuevosDesbloqueados = [...desbloqueados, cosmetico];
  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[definicion.slot] = cosmetico;

  db.prepare('UPDATE familias SET monedas = monedas - ?, cosmeticos_desbloqueados = ?, cosmeticos_equipados = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevosDesbloqueados), JSON.stringify(equipados), familiaId);

  return {
    cosmeticos_desbloqueados: nuevosDesbloqueados,
    cosmeticos_equipados: equipados,
    monedas: familia.monedas - definicion.costo,
  };
}

// La llama tareas.service.js al completar una tarea: la salud y las
// monedas de la mascota suben o bajan según el tipo de tarea. Vivía
// dentro de tareas.service.js (con un TODO) hasta este paso.
function aplicarEfectosTarea(familiaId, tarea) {
  const cambioSalud = tarea.tipo === 'positiva' ? 3 : -5;

  db.prepare(`
    UPDATE familias
    SET salud_mascota = MAX(0, MIN(100, salud_mascota + ?))
    WHERE id = ?
  `).run(cambioSalud, familiaId);

  // Las monedas compartidas suben y bajan igual que los puntos (nunca por debajo de 0)
  db.prepare(`
    UPDATE familias
    SET monedas = MAX(0, monedas + ?)
    WHERE id = ?
  `).run(tarea.puntos_valor, familiaId);
}

module.exports = {
  obtenerCatalogoEspecies,
  obtenerCatalogoCosmeticos,
  ponerNombre,
  cambiarEspecie,
  desbloquearEspecie,
  equiparCosmetico,
  desbloquearCosmetico,
  aplicarEfectosTarea,
};
