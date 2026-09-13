require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Devuelve el familia_id de un usuario, o null si no existe o no tiene
// familia. Se usa para comprobar que quien hace la petición realmente
// pertenece a la familia que está intentando leer o modificar.
function obtenerFamiliaDeUsuario(usuarioId) {
  const usuario = db.prepare('SELECT familia_id FROM usuarios WHERE id = ?').get(usuarioId);
  return usuario ? usuario.familia_id : null;
}

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

// Envía notificaciones push a través del servicio de Expo. Si algún token no
// es válido o el envío falla, simplemente lo registramos en consola: nunca
// debe romper la petición que la disparó (marcar una tarea, etc.).
async function enviarPushNotificaciones(tokens, titulo, cuerpo) {
  const tokensValidos = tokens.filter(Boolean);
  if (tokensValidos.length === 0) return;

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tokensValidos.map((token) => ({ to: token, title: titulo, body: cuerpo }))
      ),
    });
  } catch (error) {
    console.log('No se pudieron enviar las notificaciones push', error.message);
  }
}

const SEMANA_EN_MS = 7 * 24 * 60 * 60 * 1000;

// El ranking se reinicia cada semana. No hay un cron corriendo en segundo
// plano: en su lugar, cada vez que se toca a una familia comprobamos si ya
// tocaba reiniciar (perezoso, pero suficiente para el tamaño de esta app).
function revisarResetRanking(familiaId) {
  const familia = db.prepare('SELECT ranking_ultimo_reset FROM familias WHERE id = ?').get(familiaId);
  if (!familia) return;

  const ultimoReset = new Date(familia.ranking_ultimo_reset.replace(' ', 'T') + 'Z');
  const haPasadoUnaSemana = Date.now() - ultimoReset.getTime() >= SEMANA_EN_MS;

  if (haPasadoUnaSemana) {
    db.prepare('UPDATE usuarios SET puntos_totales = 0 WHERE familia_id = ?').run(familiaId);
    db.prepare('UPDATE familias SET ranking_ultimo_reset = CURRENT_TIMESTAMP WHERE id = ?').run(familiaId);
  }
}

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, {
  cors: { origin: '*' }
});

const PUERTO = 3000;

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

// Catálogo de tareas domésticas que se le da a cada familia nueva, para que
// no arranquen con la lista en blanco. Cada una se puede editar o borrar
// después desde la app — esto es solo un punto de partida generoso.
const TAREAS_PREDEFINIDAS = [
  // --- Positivas: limpieza y orden ---
  { nombre: 'Hacer la cama', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Lavar los platos', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Poner el lavavajillas', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Sacar la basura', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Sacar el reciclaje', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Poner una lavadora', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Tender la ropa', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Doblar y guardar la ropa', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Planchar la ropa', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Pasar la aspiradora', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Barrer el suelo', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Fregar el suelo', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Limpiar el baño', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Limpiar la cocina', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Quitar el polvo', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Cambiar las sábanas', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Ordenar la habitación', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Ordenar el salón', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Organizar el armario', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Limpiar los cristales', puntos_valor: 6, tipo: 'positiva' },
  // --- Positivas: cocina y compra ---
  { nombre: 'Poner la mesa', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Recoger la mesa', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Cocinar la comida', puntos_valor: 8, tipo: 'positiva' },
  { nombre: 'Preparar la cena', puntos_valor: 8, tipo: 'positiva' },
  { nombre: 'Preparar el desayuno', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Hacer la compra semanal', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Organizar la nevera', puntos_valor: 4, tipo: 'positiva' },
  // --- Positivas: mascotas, plantas y exterior ---
  { nombre: 'Pasear al perro', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Dar de comer a la mascota', puntos_valor: 3, tipo: 'positiva' },
  { nombre: 'Limpiar después de la mascota', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Regar las plantas', puntos_valor: 2, tipo: 'positiva' },
  { nombre: 'Cortar el césped', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Limpiar el coche', puntos_valor: 6, tipo: 'positiva' },
  // --- Positivas: estudio y responsabilidad ---
  { nombre: 'Hacer los deberes', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Estudiar una hora', puntos_valor: 5, tipo: 'positiva' },
  { nombre: 'Leer un libro', puntos_valor: 4, tipo: 'positiva' },
  { nombre: 'Ayudar con los deberes a un hermano', puntos_valor: 6, tipo: 'positiva' },
  { nombre: 'Cuidar de un familiar', puntos_valor: 7, tipo: 'positiva' },
  { nombre: 'Ser puntual toda la semana', puntos_valor: 6, tipo: 'positiva' },
  // --- Negativas ---
  { nombre: 'Dejar platos sucios', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Dejar la cama sin hacer', puntos_valor: -2, tipo: 'negativa' },
  { nombre: 'Dejar la ropa tirada', puntos_valor: -3, tipo: 'negativa' },
  { nombre: 'No sacar la basura', puntos_valor: -3, tipo: 'negativa' },
  { nombre: 'Dejar el baño desordenado', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Llegar tarde sin avisar', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'Pelearse con un hermano', puntos_valor: -6, tipo: 'negativa' },
  { nombre: 'No hacer los deberes', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'Contestar mal', puntos_valor: -4, tipo: 'negativa' },
  { nombre: 'Mentir', puntos_valor: -8, tipo: 'negativa' },
  { nombre: 'Dejar luces encendidas sin necesidad', puntos_valor: -2, tipo: 'negativa' },
  { nombre: 'Perder o romper algo por descuido', puntos_valor: -5, tipo: 'negativa' },
  { nombre: 'No cuidar a la mascota', puntos_valor: -6, tipo: 'negativa' },
  { nombre: 'Usar el móvil en la mesa', puntos_valor: -3, tipo: 'negativa' },
];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hola Juan! Tu servidor está funcionando');
});

function generarCodigo() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
app.post('/familias', verificarToken, (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre de la familia es obligatorio ' });
    }

    const codigo = generarCodigo();
    const stmt = db.prepare('INSERT INTO familias (nombre, codigo_invitacion) VALUES (?, ?)');
    const resultado = stmt.run(nombre, codigo);
    const familiaId = resultado.lastInsertRowid;

    const insertarTarea = db.prepare(
      'INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)'
    );
    const sembrarTareas = db.transaction((tareas) => {
      for (const tarea of tareas) {
        insertarTarea.run(familiaId, tarea.nombre, tarea.puntos_valor, tarea.tipo);
      }
    });
    sembrarTareas(TAREAS_PREDEFINIDAS);

    res.status(201).json({ id: familiaId, nombre, codigo_invitacion: codigo });
});

app.post('/familias/unirse', verificarToken, (req, res) => {
    const { usuario_id, codigo_invitacion } = req.body;

    if (req.usuario.id !== Number(usuario_id)) {
        return res.status(403).json({ error: 'No puedes hacer esto en nombre de otro usuario' });
    }

    const familia = db.prepare('SELECT * FROM familias WHERE codigo_invitacion = ?').get(codigo_invitacion);

    if (!familia) {
        return res.status(404).json({ error: 'Código de invitación no válido' });
    }

    db.prepare('UPDATE usuarios SET familia_id = ? WHERE id = ?').run(familia.id, usuario_id);

    res.json({
        mensaje: `Usuario unido a la familia "${familia.nombre}" correctamente`,
        familia_id: familia.id
    });
});

app.get('/familias/:id/usuarios', verificarToken, (req, res) => {
    const { id } = req.params;

    if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
        return res.status(403).json({ error: 'No perteneces a esta familia' });
    }

    const usuarios = db.prepare(
        'SELECT id, nombre, email, puntos_totales, fecha_creacion FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
    ).all(id);
    res.json(usuarios);
});

app.put('/usuarios/:id/salir-familia', verificarToken, (req, res) => {
    const { id } = req.params;

    if (req.usuario.id !== Number(id)) {
        return res.status(403).json({ error: 'No puedes hacer esto en nombre de otro usuario' });
    }

    db.prepare('UPDATE usuarios SET familia_id = NULL, puntos_totales = 0 WHERE id = ?').run(id);

    res.json({ mensaje: 'Has salido de la familia' });
});

app.post('/tareas', verificarToken, (req, res) => {
  const { familia_id, nombre, puntos_valor, tipo } = req.body;

  if (!familia_id || !nombre || puntos_valor === undefined || !tipo) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  if (tipo !== 'positiva' && tipo !== 'negativa') {
    return res.status(400).json({ error: 'El tipo debe ser "positiva" o "negativa"' });
  }

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(familia_id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const stmt = db.prepare('INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)');
  const resultado = stmt.run(familia_id, nombre, puntos_valor, tipo);

  res.status(201).json({ id: resultado.lastInsertRowid, familia_id, nombre, puntos_valor, tipo });
});

app.get('/familias/:id/tareas', verificarToken, (req, res) => {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const tareas = db.prepare('SELECT * FROM tareas WHERE familia_id = ? ORDER BY tipo DESC, id DESC').all(id);
  res.json(tareas);
});

app.delete('/tareas/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(id);
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  const usuario = db.prepare('SELECT familia_id FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!usuario || usuario.familia_id !== tarea.familia_id) {
    return res.status(403).json({ error: 'Esta tarea no pertenece a tu familia' });
  }

  db.prepare('DELETE FROM tareas WHERE id = ?').run(id);
  res.json({ mensaje: 'Tarea eliminada' });
});

app.post('/eventos', verificarToken, (req, res) => {
  const { usuario_id, tarea_id } = req.body;

  if (!usuario_id || !tarea_id) {
    return res.status(400).json({ error: 'usuario_id y tarea_id son obligatorios' });
  }

  const tarea = db.prepare('SELECT * FROM tareas WHERE id = ?').get(tarea_id);
  if (!tarea) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario_id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const familiaSolicitante = obtenerFamiliaDeUsuario(req.usuario.id);
  if (!familiaSolicitante || familiaSolicitante !== usuario.familia_id || familiaSolicitante !== tarea.familia_id) {
    return res.status(403).json({ error: 'Esta tarea o este usuario no pertenecen a tu familia' });
  }

  if (usuario.familia_id) revisarResetRanking(usuario.familia_id);

  const insertarEvento = db.prepare(
    'INSERT INTO eventos (usuario_id, tarea_id, puntos_aplicados, registrado_por) VALUES (?, ?, ?, ?)'
  );
  const resultado = insertarEvento.run(usuario_id, tarea_id, tarea.puntos_valor, req.usuario.id);

  db.prepare('UPDATE usuarios SET puntos_totales = puntos_totales + ? WHERE id = ?')
    .run(tarea.puntos_valor, usuario_id);

  const cambioSalud = tarea.tipo === 'positiva' ? 3 : -5;

  db.prepare(`
    UPDATE familias
    SET salud_mascota = MAX(0, MIN(100, salud_mascota + ?))
    WHERE id = (SELECT familia_id FROM usuarios WHERE id = ?)
  `).run(cambioSalud, usuario_id);

  // Las monedas compartidas suben y bajan igual que los puntos (nunca por debajo de 0)
  db.prepare(`
    UPDATE familias
    SET monedas = MAX(0, monedas + ?)
    WHERE id = (SELECT familia_id FROM usuarios WHERE id = ?)
  `).run(tarea.puntos_valor, usuario_id);

  res.status(201).json({
    id: resultado.lastInsertRowid,
    mensaje: `${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos aplicados a ${usuario.nombre}`
  });

  // Avisamos al resto de la familia (no a quien acaba de hacer la tarea).
  // Va después de responder: si el envío de push tarda o falla, no afecta
  // a la app de quien marcó la tarea.
  const contenidoNotificacion = `${usuario.nombre} completó "${tarea.nombre}" (${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos)`;

  if (usuario.familia_id) {
    const miembrosFamilia = db.prepare('SELECT id, push_token FROM usuarios WHERE familia_id = ?').all(usuario.familia_id);

    const insertarNotificacion = db.prepare(
      'INSERT INTO notificaciones (usuario_id, contenido) VALUES (?, ?)'
    );
    const guardarNotificaciones = db.transaction((miembros) => {
      for (const miembro of miembros) {
        insertarNotificacion.run(miembro.id, contenidoNotificacion);
      }
    });
    guardarNotificaciones(miembrosFamilia);

    enviarPushNotificaciones(
      miembrosFamilia.filter((m) => m.id !== usuario_id).map((m) => m.push_token),
      usuario.nombre,
      `${tarea.nombre} (${tarea.puntos_valor >= 0 ? '+' : ''}${tarea.puntos_valor} puntos)`
    );
  }
});

app.put('/usuarios/push-token', verificarToken, (req, res) => {
  const { push_token } = req.body;

  if (!push_token) {
    return res.status(400).json({ error: 'push_token es obligatorio' });
  }

  db.prepare('UPDATE usuarios SET push_token = ? WHERE id = ?').run(push_token, req.usuario.id);
  res.json({ mensaje: 'Token guardado' });
});

app.get('/familias/:id/ranking', verificarToken, (req, res) => {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  revisarResetRanking(id);
  const ranking = db.prepare(
    'SELECT nombre, puntos_totales FROM usuarios WHERE familia_id = ? ORDER BY puntos_totales DESC'
  ).all(id);
  res.json(ranking);
});

app.get('/familias/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  revisarResetRanking(id);
  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);

  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  res.json(familia);
});

app.put('/familias/:id/mascota', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre_mascota } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!nombre_mascota || !nombre_mascota.trim()) {
    return res.status(400).json({ error: 'El nombre de la mascota es obligatorio' });
  }

  const nombreLimpio = nombre_mascota.trim().slice(0, 20);

  const resultado = db.prepare('UPDATE familias SET nombre_mascota = ? WHERE id = ?').run(nombreLimpio, id);

  if (resultado.changes === 0) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  res.json({ nombre_mascota: nombreLimpio });
});

app.get('/especies-mascota', (req, res) => {
  res.json(ESPECIES_MASCOTA);
});

app.put('/familias/:id/especie', verificarToken, (req, res) => {
  const { id } = req.params;
  const { especie } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!ESPECIES_MASCOTA[especie]) {
    return res.status(400).json({ error: 'Especie no válida' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (!desbloqueadas.includes(especie)) {
    return res.status(403).json({ error: 'Todavía no has desbloqueado esa especie' });
  }

  db.prepare('UPDATE familias SET especie_mascota = ? WHERE id = ?').run(especie, id);

  res.json({ especie_mascota: especie });
});

app.post('/familias/:id/desbloquear', verificarToken, (req, res) => {
  const { id } = req.params;
  const { especie } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const definicion = ESPECIES_MASCOTA[especie];
  if (!definicion) {
    return res.status(400).json({ error: 'Especie no válida' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueadas = JSON.parse(familia.especies_desbloqueadas || '["manzana"]');
  if (desbloqueadas.includes(especie)) {
    return res.status(409).json({ error: 'Esa especie ya está desbloqueada' });
  }

  if (familia.monedas < definicion.costo) {
    return res.status(400).json({ error: 'No tienes monedas suficientes' });
  }

  const nuevasDesbloqueadas = [...desbloqueadas, especie];

  db.prepare('UPDATE familias SET monedas = monedas - ?, especies_desbloqueadas = ?, especie_mascota = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevasDesbloqueadas), especie, id);

  res.json({
    especie_mascota: especie,
    especies_desbloqueadas: nuevasDesbloqueadas,
    monedas: familia.monedas - definicion.costo,
  });
});

app.get('/cosmeticos-mascota', (req, res) => {
  res.json(COSMETICOS_MASCOTA);
});

app.put('/familias/:id/cosmeticos', verificarToken, (req, res) => {
  const { id } = req.params;
  const { slot, cosmetico } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  if (!slot) {
    return res.status(400).json({ error: 'Falta la categoría del complemento' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  // cosmetico = null quita lo que hubiera puesto en esa categoría
  if (cosmetico !== null) {
    const definicion = COSMETICOS_MASCOTA[cosmetico];
    if (!definicion || definicion.slot !== slot) {
      return res.status(400).json({ error: 'Complemento no válido para esa categoría' });
    }

    const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
    if (!desbloqueados.includes(cosmetico)) {
      return res.status(403).json({ error: 'Todavía no has desbloqueado ese complemento' });
    }
  }

  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[slot] = cosmetico;

  db.prepare('UPDATE familias SET cosmeticos_equipados = ? WHERE id = ?').run(JSON.stringify(equipados), id);

  res.json({ cosmeticos_equipados: equipados });
});

app.post('/familias/:id/desbloquear-cosmetico', verificarToken, (req, res) => {
  const { id } = req.params;
  const { cosmetico } = req.body;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const definicion = COSMETICOS_MASCOTA[cosmetico];
  if (!definicion) {
    return res.status(400).json({ error: 'Complemento no válido' });
  }

  const familia = db.prepare('SELECT * FROM familias WHERE id = ?').get(id);
  if (!familia) {
    return res.status(404).json({ error: 'Familia no encontrada' });
  }

  const desbloqueados = JSON.parse(familia.cosmeticos_desbloqueados || '[]');
  if (desbloqueados.includes(cosmetico)) {
    return res.status(409).json({ error: 'Ese complemento ya está desbloqueado' });
  }

  if (familia.monedas < definicion.costo) {
    return res.status(400).json({ error: 'No tienes monedas suficientes' });
  }

  const nuevosDesbloqueados = [...desbloqueados, cosmetico];
  const equipados = JSON.parse(familia.cosmeticos_equipados || '{}');
  equipados[definicion.slot] = cosmetico;

  db.prepare('UPDATE familias SET monedas = monedas - ?, cosmeticos_desbloqueados = ?, cosmeticos_equipados = ? WHERE id = ?')
    .run(definicion.costo, JSON.stringify(nuevosDesbloqueados), JSON.stringify(equipados), id);

  res.json({
    cosmeticos_desbloqueados: nuevosDesbloqueados,
    cosmeticos_equipados: equipados,
    monedas: familia.monedas - definicion.costo,
  });
});

app.post('/mensajes', verificarToken, (req, res) => {
  const { familia_id, usuario_id, texto } = req.body;

  if (!familia_id || !usuario_id || !texto) {
    return res.status(400).json({ error: 'familia_id, usuario_id y texto son obligatorios' });
  }

  if (req.usuario.id !== Number(usuario_id) || obtenerFamiliaDeUsuario(req.usuario.id) !== Number(familia_id)) {
    return res.status(403).json({ error: 'No puedes enviar mensajes en nombre de otro usuario o de otra familia' });
  }

  const stmt = db.prepare('INSERT INTO mensajes (familia_id, usuario_id, texto) VALUES (?, ?, ?)');
  const resultado = stmt.run(familia_id, usuario_id, texto);

  const usuario = db.prepare('SELECT nombre FROM usuarios WHERE id = ?').get(usuario_id);

  const mensajeCompleto = {
    id: resultado.lastInsertRowid,
    familia_id,
    usuario_id,
    texto,
    autor: usuario.nombre,
    fecha_hora: new Date().toISOString()
  };

  io.to(`familia_${familia_id}`).emit('mensaje_nuevo', mensajeCompleto);

  res.status(201).json(mensajeCompleto);
});

app.get('/familias/:id/mensajes', verificarToken, (req, res) => {
  const { id } = req.params;

  if (obtenerFamiliaDeUsuario(req.usuario.id) !== Number(id)) {
    return res.status(403).json({ error: 'No perteneces a esta familia' });
  }

  const mensajes = db.prepare(`
    SELECT mensajes.id, mensajes.texto, mensajes.fecha_hora, usuarios.nombre AS autor
    FROM mensajes
    JOIN usuarios ON mensajes.usuario_id = usuarios.id
    WHERE mensajes.familia_id = ?
    ORDER BY mensajes.fecha_hora ASC
  `).all(id);

  res.json(mensajes);
});

app.get('/usuarios/:id/notificaciones', verificarToken, (req, res) => {
  const { id } = req.params;

  if (req.usuario.id !== Number(id)) {
    return res.status(403).json({ error: 'No puedes ver las notificaciones de otro usuario' });
  }

  const notificaciones = db.prepare(
    'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha_hora DESC LIMIT 100'
  ).all(id);

  res.json(notificaciones);
});

app.put('/usuarios/:id/notificaciones/leer-todas', verificarToken, (req, res) => {
  const { id } = req.params;

  if (req.usuario.id !== Number(id)) {
    return res.status(403).json({ error: 'No puedes hacer esto en nombre de otro usuario' });
  }

  db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?').run(id);
  res.json({ mensaje: 'Notificaciones marcadas como leídas' });
});

io.on('connection', (socket) => {
  console.log('Alguien se ha conectado:', socket.id);

  socket.on('unirse_familia', (familia_id) => {
    socket.join(`familia_${familia_id}`);
    console.log(`Socket ${socket.id} se unió a familia_${familia_id}`);
  });

  socket.on('disconnect', () => {
    console.log('Alguien se ha desconectado:', socket.id);
  });
});

app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const stmt = db.prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)');
  const resultado = stmt.run(nombre, email, passwordHash);

  res.status(201).json({ id: resultado.lastInsertRowid, nombre, email });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    familia_id: usuario.familia_id,
    token
  });
});

servidor.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
