const Database = require('better-sqlite3');
const db = new Database('app-familia.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS familias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo_invitacion TEXT NOT NULL UNIQUE,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    familia_id INTEGER,
    puntos_totales INTEGER DEFAULT 0,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (familia_id) REFERENCES familias(id)
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS tareas (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       familia_id INTEGER NOT NULL,
       nombre TEXT NOT NULL,
       puntos_valor INTEGER NOT NULL,
       tipo TEXT NOT NULL CHECK (tipo IN ('positiva', 'negativa')),
       FOREIGN KEY (familia_id) REFERENCES familias(id)
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tarea_id INTEGER NOT NULL,
        puntos_aplicados INTEGER NOT NULL,
        fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (tarea_id) REFERENCES tareas(id)
    )
`);

try {
  db.exec(`ALTER TABLE familias ADD COLUMN salud_mascota INTEGER DEFAULT 100`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

module.exports = db;