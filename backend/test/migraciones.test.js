const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { migrar, MIGRACIONES } = require('../db/migraciones');

const version = (db) => db.prepare('SELECT MAX(version) AS v FROM schema_version').get().v;

test('una base nueva queda en la última versión y con los índices', () => {
  const db = new Database(':memory:');
  migrar(db);
  assert.equal(version(db), MIGRACIONES.length);
  const indices = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'").all();
  assert.ok(indices.length >= 5);
});

test('una base anterior a schema_version se actualiza sin perder datos', () => {
  const db = new Database(':memory:');
  MIGRACIONES[0](db); // esquema original, sin tabla schema_version
  db.prepare("INSERT INTO familias (nombre, codigo_invitacion) VALUES ('Casa', 'ABC234')").run();

  migrar(db);

  assert.equal(version(db), MIGRACIONES.length);
  assert.equal(db.prepare('SELECT nombre FROM familias').get().nombre, 'Casa');
});

test('migrar dos veces no repite migraciones', () => {
  const db = new Database(':memory:');
  migrar(db);
  migrar(db);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_version').get().n, MIGRACIONES.length);
});
