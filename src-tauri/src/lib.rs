pub mod crypto;
pub mod db;
pub mod models;
pub mod state;
pub mod commands;

use std::sync::Mutex;
use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(AppState::new())
    .setup(|app| {
      let app_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
      std::fs::create_dir_all(&app_dir).unwrap();
      
      let db_path = app_dir.join("vault.db");
      let db = db::Db::init(db_path).expect("Failed to initialize database");
      
      app.manage(Mutex::new(db));
      
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_clipboard_manager::init())?;
      app.handle().plugin(tauri_plugin_dialog::init())?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        commands::check_vault_exists,
        commands::create_vault,
        commands::unlock_vault,
        commands::lock_vault,
        commands::is_locked,
        commands::save_item,
        commands::update_item,
        commands::get_items,
        commands::trash_item,
        commands::restore_item,
        commands::get_trashed_items,
        commands::delete_item,
        commands::change_password,
        commands::export_vault,
        commands::import_vault
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
