// Prueba el resumen semanal sin servidor: la base de datos se abre en el directorio de
// trabajo, así que se cambia a uno temporal ANTES de cargar los módulos.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

let carpeta, db, familiasService, familiaId;

before(() => {
  carpeta = mkdtempSync(join(tmpdir(), 'familyquest-resumen-'));
  process.chdir(carpeta);
  db = require('../db/conexion');
  familiasService = require('../services/familias.service');

  familiaId = db.prepare("INSERT INTO familias (nombre, codigo_invitacion) VALUES ('Casa', 'ABC234')").run().lastInsertRowid;
  const usuario = (nombre) => db.prepare('INSERT INTO usuarios (nombre, email, familia_id) VALUES (?, ?, ?)').run(nombre, `${nombre}@example.test`, familiaId).lastInsertRowid;
  const tarea = (nombre, puntos) => db.prepare('INSERT INTO tareas (familia_id, nombre, puntos_valor, tipo) VALUES (?, ?, ?, ?)').run(familiaId, nombre, puntos, puntos > 0 ? 'positiva' : 'negativa').lastInsertRowid;
  const ana = usuario('Ana');
  const marcos = usuario('Marcos');
  const platos = tarea('Lavar los platos', 5);
  const basura = tarea('Sacar la basura', 3);
  const mentir = tarea('Mentir', -8);

  // Semana pasada: Ana 5+5 = 10, Marcos 3-8 = -5. Hace 9 días empezó esa semana.
  const evento = (u, t, puntos) => db.prepare("INSERT INTO eventos (usuario_id, tarea_id, puntos_aplicados, fecha_hora) VALUES (?, ?, ?, datetime('now', '-3 days'))").run(u, t, puntos);
  evento(ana, platos, 5);
  evento(ana, platos, 5);
  evento(marcos, basura, 3);
  evento(marcos, mentir, -8);
  db.prepare("UPDATE usuarios SET puntos_totales = 10 WHERE id = ?").run(ana);
  db.prepare("UPDATE familias SET ranking_ultimo_reset = datetime('now', '-8 days') WHERE id = ?").run(familiaId);
});

after(() => {
  db.close();
  process.chdir(tmpdir());
  rmSync(carpeta, { recursive: true, force: true });
});

test('al reiniciar el ranking se guarda un resumen con ganador, tarea más repetida y total', () => {
  const resumen = familiasService.obtenerResumenSemanal(familiaId);

  assert.equal(resumen.ganador.nombre, 'Ana');
  assert.equal(resumen.ganador.puntos, 10);
  assert.deepEqual(resumen.ranking.map((m) => [m.nombre, m.puntos, m.tareas]), [['Ana', 10, 2], ['Marcos', -5, 2]]);
  assert.deepEqual(resumen.tarea_top, { nombre: 'Lavar los platos', veces: 2 });
  assert.equal(resumen.total_tareas, 4);
  // Y los puntos se reiniciaron.
  assert.equal(db.prepare("SELECT puntos_totales FROM usuarios WHERE nombre = 'Ana'").get().puntos_totales, 0);
});

test('volver a consultar no duplica el resumen', () => {
  familiasService.obtenerResumenSemanal(familiaId);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM resumenes_semanales WHERE familia_id = ?').get(familiaId).n, 1);
});

test('una familia sin actividad o con el reinicio inicial no genera resumen', () => {
  const vacia = db.prepare("INSERT INTO familias (nombre, codigo_invitacion) VALUES ('Vacía', 'XYZ234')").run().lastInsertRowid;
  assert.equal(familiasService.obtenerResumenSemanal(vacia), null); // reinicio inicial (2024-01-01)

  db.prepare("UPDATE familias SET ranking_ultimo_reset = datetime('now', '-8 days') WHERE id = ?").run(vacia);
  assert.equal(familiasService.obtenerResumenSemanal(vacia), null); // pasó una semana, pero sin eventos
});
