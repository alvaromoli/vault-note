use crate::crypto;
use crate::db::Db;
use crate::state::AppState;
use rusqlite::params;
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub fn check_vault_exists(db_state: State<'_, Mutex<Db>>) -> Result<bool, String> {
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM vault_metadata").map_err(|e| e.to_string())?;
    let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap_or(0);
    
    Ok(count > 0)
}

#[tauri::command]
pub fn create_vault(
    password: &str,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    // 1. Verificar que no exista ya una bóveda
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM vault_metadata").map_err(|e| e.to_string())?;
    let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap_or(0);
    if count > 0 {
        return Err("La bóveda ya existe".to_string());
    }

    // 2. Generar salt y KEK
    let salt = crypto::generate_salt();
    let kek = crypto::derive_kek(password, &salt).map_err(|e| e.to_string())?;

    // 3. Generar DEK
    let dek = crypto::generate_dek();

    // 4. Cifrar DEK con la KEK
    let encrypted_dek = crypto::encrypt_payload(&dek, &kek).map_err(|e| e.to_string())?;

    // 5. Guardar en SQLite
    conn.execute(
        "INSERT INTO vault_metadata (id, salt, encrypted_dek) VALUES (1, ?1, ?2)",
        params![salt.as_slice(), encrypted_dek],
    ).map_err(|e| e.to_string())?;

    // 6. Cargar DEK en memoria (bóveda queda desbloqueada)
    app_state.unlock(dek);

    Ok(())
}

#[tauri::command]
pub fn unlock_vault(
    password: &str,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();

    // 1. Leer metadata de la bóveda
    let mut stmt = conn.prepare("SELECT salt, encrypted_dek FROM vault_metadata WHERE id = 1")
        .map_err(|e| e.to_string())?;
    
    let (salt, encrypted_dek): (Vec<u8>, Vec<u8>) = stmt.query_row([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    }).map_err(|_| "Credenciales incorrectas o bóveda no encontrada".to_string())?;

    // 2. Derivar KEK
    let kek = crypto::derive_kek(password, &salt).map_err(|e| e.to_string())?;

    // 3. Descifrar DEK
    let decrypted_dek = crypto::decrypt_payload(&encrypted_dek, &kek)
        .map_err(|_| "Contraseña incorrecta".to_string())?;

    // 4. Cargar en memoria
    app_state.unlock(zeroize::Zeroizing::new(decrypted_dek));

    Ok(())
}

#[tauri::command]
pub fn lock_vault(app_state: State<'_, AppState>) -> Result<(), String> {
    app_state.lock();
    Ok(())
}

#[tauri::command]
pub fn is_locked(app_state: State<'_, AppState>) -> bool {
    !app_state.is_unlocked()
}

#[tauri::command]
pub fn save_item(
    item_type: String,
    parent_id: Option<String>,
    payload: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<String, String> {
    let dek_guard = app_state.dek.lock().unwrap();
    let dek = dek_guard.as_ref().ok_or("Bóveda bloqueada")?;

    let encrypted_blob = crypto::encrypt_payload(payload.as_bytes(), &dek)
        .map_err(|e| e.to_string())?;

    let id = uuid::Uuid::new_v4().to_string();
    
    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    conn.execute(
        "INSERT INTO encrypted_items (id, item_type, parent_id, encrypted_blob) VALUES (?1, ?2, ?3, ?4)",
        params![id, item_type, parent_id, encrypted_blob],
    ).map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub fn get_items(
    item_type: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<Vec<(String, String)>, String> {
    let dek_guard = app_state.dek.lock().unwrap();
    let dek = dek_guard.as_ref().ok_or("Bóveda bloqueada")?;

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare("SELECT id, encrypted_blob FROM encrypted_items WHERE item_type = ?1 AND (is_deleted = 0 OR is_deleted IS NULL)")
        .map_err(|e| e.to_string())?;
        
    let item_iter = stmt.query_map(params![item_type], |row| {
        let id: String = row.get(0)?;
        let blob: Vec<u8> = row.get(1)?;
        Ok((id, blob))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for item in item_iter {
        if let Ok((id, blob)) = item {
            if let Ok(decrypted) = crypto::decrypt_payload(&blob, &dek) {
                if let Ok(json_str) = String::from_utf8(decrypted) {
                    result.push((id, json_str));
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn delete_item(
    id: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    if !app_state.is_unlocked() {
        return Err("Bóveda bloqueada".to_string());
    }

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    conn.execute("DELETE FROM encrypted_items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
pub fn update_item(
    id: String,
    payload: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    let dek_guard = app_state.dek.lock().unwrap();
    let dek = dek_guard.as_ref().ok_or("Bóveda bloqueada")?;

    let encrypted_blob = crypto::encrypt_payload(payload.as_bytes(), &dek)
        .map_err(|e| e.to_string())?;

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    let rows_affected = conn.execute(
        "UPDATE encrypted_items SET encrypted_blob = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        params![encrypted_blob, id],
    ).map_err(|e| e.to_string())?;

    if rows_affected == 0 {
        return Err("No se encontró la nota para actualizar (ID inválido)".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn trash_item(
    id: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    if !app_state.is_unlocked() {
        return Err("Bóveda bloqueada".to_string());
    }

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE encrypted_items SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?1", 
        params![id]
    ).map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
pub fn restore_item(
    id: String,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    if !app_state.is_unlocked() {
        return Err("Bóveda bloqueada".to_string());
    }

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE encrypted_items SET is_deleted = 0, deleted_at = NULL WHERE id = ?1", 
        params![id]
    ).map_err(|e| e.to_string())?;
        
    Ok(())
}

#[tauri::command]
pub fn get_trashed_items(
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<Vec<(String, String, String)>, String> {
    let dek_guard = app_state.dek.lock().unwrap();
    let dek = dek_guard.as_ref().ok_or("Bóveda bloqueada")?;

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    let mut stmt = conn.prepare("SELECT id, item_type, encrypted_blob FROM encrypted_items WHERE is_deleted = 1")
        .map_err(|e| e.to_string())?;
        
    let item_iter = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let item_type: String = row.get(1)?;
        let blob: Vec<u8> = row.get(2)?;
        Ok((id, item_type, blob))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for item in item_iter {
        if let Ok((id, item_type, blob)) = item {
            if let Ok(decrypted) = crypto::decrypt_payload(&blob, &dek) {
                if let Ok(json_str) = String::from_utf8(decrypted) {
                    result.push((id, item_type, json_str));
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn change_password(
    new_password: &str,
    db_state: State<'_, Mutex<Db>>,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    let dek_guard = app_state.dek.lock().unwrap();
    let dek = dek_guard.as_ref().ok_or("Bóveda bloqueada")?;

    let new_salt = crypto::generate_salt();
    let new_kek = crypto::derive_kek(new_password, &new_salt).map_err(|e| e.to_string())?;

    let new_encrypted_dek = crypto::encrypt_payload(&dek, &new_kek).map_err(|e| e.to_string())?;

    let db = db_state.lock().unwrap();
    let conn = db.get_connection();
    
    conn.execute(
        "UPDATE vault_metadata SET salt = ?1, encrypted_dek = ?2 WHERE id = 1",
        params![new_salt.as_slice(), new_encrypted_dek],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn export_vault(
    dest_path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|_| "Error de ruta".to_string())?;
    let db_path = app_dir.join("vault.db");
    
    std::fs::copy(db_path, dest_path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn import_vault(
    source_path: String,
    app_handle: tauri::AppHandle,
    app_state: State<'_, AppState>,
) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|_| "Error de ruta".to_string())?;
    let db_path = app_dir.join("vault.db");
    
    app_state.lock();
    std::fs::copy(source_path, db_path).map_err(|e| e.to_string())?;
    Ok(())
}
