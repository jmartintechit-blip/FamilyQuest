const Database = require('better-sqlite3');
const { migrar } = require('./migraciones');

const db = new Database('app-familia.db');
migrar(db);

module.exports = db;
