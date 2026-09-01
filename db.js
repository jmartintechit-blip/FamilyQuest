const Database = require('better-sqlite3');
const db = new Database('app-familia.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        puntos_totales INTEGER DEFAULT 0,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports =db;