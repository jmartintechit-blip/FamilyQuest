// Migraciones versionadas. La versión aplicada se guarda en schema_version, así
// que cada migración se ejecuta una sola vez, en orden y dentro de una transacción.
// Para cambiar el esquema: añade una migración AL FINAL de la lista; no edites
// las que ya existen, porque las bases de datos de otras familias ya las pasaron.

function anadirColumna(db, tabla, definicion) {
  const nombre = definicion.split(' ')[0];
  const existe = db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === nombre);
  if (!existe) db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${definicion}`);
}

const MIGRACIONES = [
  // 1: esquema original. Idempotente a propósito: las bases creadas antes de
  // existir schema_version ya tienen estas tablas y columnas, y la migración
  // 1 simplemente las da por buenas.
  (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS familias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo_invitacion TEXT NOT NULL UNIQUE,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        familia_id INTEGER,
        puntos_totales INTEGER DEFAULT 0,
        fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (familia_id) REFERENCES familias(id)
      );
      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        familia_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        puntos_valor INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('positiva', 'negativa')),
        FOREIGN KEY (familia_id) REFERENCES familias(id)
      );
      CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        tarea_id INTEGER NOT NULL,
        puntos_aplicados INTEGER NOT NULL,
        fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (tarea_id) REFERENCES tareas(id)
      );
      CREATE TABLE IF NOT EXISTS mensajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        familia_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        texto TEXT NOT NULL,
        fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (familia_id) REFERENCES familias(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        contenido TEXT NOT NULL,
        leida INTEGER DEFAULT 0,
        fecha_hora TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      );
    `);

    anadirColumna(db, 'familias', 'salud_mascota INTEGER DEFAULT 100');
    anadirColumna(db, 'usuarios', 'password_hash TEXT');
    anadirColumna(db, 'eventos', 'registrado_por INTEGER');
    anadirColumna(db, 'familias', "nombre_mascota TEXT DEFAULT 'Brote'");
    anadirColumna(db, 'familias', "especie_mascota TEXT DEFAULT 'manzana'");
    // Especies que la familia ya desbloqueó, como JSON (ej. '["manzana","oso"]')
    anadirColumna(db, 'familias', `especies_desbloqueadas TEXT DEFAULT '["manzana"]'`);
    // Monedas compartidas por toda la familia (no por usuario) para desbloquear especies
    anadirColumna(db, 'familias', 'monedas INTEGER DEFAULT 0');
    // Complementos desbloqueados, como JSON: '["gorro_fiesta"]'
    anadirColumna(db, 'familias', `cosmeticos_desbloqueados TEXT DEFAULT '[]'`);
    // Complemento puesto en cada categoría, como JSON: '{"sombrero":"corona"}'
    anadirColumna(db, 'familias', `cosmeticos_equipados TEXT DEFAULT '{}'`);
    // Token de Expo Push Notifications del dispositivo, para avisar en tiempo real
    anadirColumna(db, 'usuarios', 'push_token TEXT');
    // Último reinicio semanal del ranking. SQLite no admite CURRENT_TIMESTAMP como
    // default en ALTER TABLE, así que se usa una fecha fija pasada: la primera
    // comprobación dispara un reinicio inicial inofensivo.
    anadirColumna(db, 'familias', "ranking_ultimo_reset TEXT DEFAULT '2024-01-01 00:00:00'");
  },

  // 2: índices para las búsquedas por familia y usuario (UNIQUE ya indexa email y código).
  (db) => {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_familia ON usuarios(familia_id);
      CREATE INDEX IF NOT EXISTS idx_tareas_familia ON tareas(familia_id);
      CREATE INDEX IF NOT EXISTS idx_eventos_usuario ON eventos(usuario_id, fecha_hora);
      CREATE INDEX IF NOT EXISTS idx_eventos_tarea ON eventos(tarea_id);
      CREATE INDEX IF NOT EXISTS idx_mensajes_familia ON mensajes(familia_id, id);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, leida);
    `);
  },

  // 3: rol de administrador (el miembro más antiguo de cada familia existente lo recibe)
  // y archivado de tareas, para borrarlas sin perder el historial de eventos que las citan.
  (db) => {
    anadirColumna(db, 'usuarios', "rol TEXT NOT NULL DEFAULT 'miembro'");
    anadirColumna(db, 'tareas', 'archivada INTEGER NOT NULL DEFAULT 0');
    db.exec(`
      UPDATE usuarios SET rol = 'admin'
      WHERE id IN (SELECT MIN(id) FROM usuarios WHERE familia_id IS NOT NULL GROUP BY familia_id)
    `);
  },

  // 4: resumen de cada semana, guardado justo antes de reiniciar el ranking.
  // `datos` es un JSON con el ranking, la tarea más repetida y el ganador.
  (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS resumenes_semanales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        familia_id INTEGER NOT NULL,
        semana_inicio TEXT NOT NULL,
        semana_fin TEXT NOT NULL,
        datos TEXT NOT NULL,
        FOREIGN KEY (familia_id) REFERENCES familias(id)
      );
      CREATE INDEX IF NOT EXISTS idx_resumenes_familia ON resumenes_semanales(familia_id, id);
    `);
  },
];

function migrar(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const fila = db.prepare('SELECT MAX(version) AS version FROM schema_version').get();
  const actual = fila.version || 0;

  MIGRACIONES.slice(actual).forEach((migracion, i) => {
    db.transaction(() => {
      migracion(db);
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(actual + i + 1);
    })();
  });
}

module.exports = { migrar, MIGRACIONES };
