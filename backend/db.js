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

db.exec(`
  CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    familia_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    texto TEXT NOT NULL,
    fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (familia_id) REFERENCES familias(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    leida INTEGER DEFAULT 0,
    fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  )
`);

try {
  db.exec(`ALTER TABLE familias ADD COLUMN salud_mascota INTEGER DEFAULT 100`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  db.exec(`ALTER TABLE usuarios ADD COLUMN password_hash TEXT`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  db.exec(`ALTER TABLE eventos ADD COLUMN registrado_por INTEGER`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  db.exec(`ALTER TABLE familias ADD COLUMN nombre_mascota TEXT DEFAULT 'Brote'`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  db.exec(`ALTER TABLE familias ADD COLUMN especie_mascota TEXT DEFAULT 'manzana'`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  // Lista de especies que la familia ya desbloqueó, guardada como JSON (ej. '["manzana","oso"]')
  db.exec(`ALTER TABLE familias ADD COLUMN especies_desbloqueadas TEXT DEFAULT '["manzana"]'`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

try {
  // Monedas compartidas por toda la familia (no por usuario) para desbloquear especies de mascota
  db.exec(`ALTER TABLE familias ADD COLUMN monedas INTEGER DEFAULT 0`);
} catch (error) {
  // La columna ya existe, no pasa nada
}

module.exports = db;