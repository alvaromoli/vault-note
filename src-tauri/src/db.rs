use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub struct Db {
    conn: Connection,
}

impl Db {
    /// Inicializa la base de datos en la ruta dada.
    pub fn init(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        
        // Crear las tablas necesarias
        conn.execute(
            "CREATE TABLE IF NOT EXISTS vault_metadata (
                id INTEGER PRIMARY KEY CHECK (id = 1), -- Solo puede haber un registro
                salt BLOB NOT NULL,
                encrypted_dek BLOB NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS encrypted_items (
                id TEXT PRIMARY KEY,
                item_type TEXT NOT NULL, -- 'book', 'note', 'credential'
                parent_id TEXT,          -- para relacionar notas con libros
                encrypted_blob BLOB NOT NULL, -- JSON cifrado
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        Ok(Db { conn })
    }
    
    pub fn get_connection(&self) -> &Connection {
        &self.conn
    }
}
