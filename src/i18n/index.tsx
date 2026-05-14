import React, { createContext, useState, useContext, useEffect } from 'react';

type Language = 'es' | 'en';

interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

export const translations: Translations = {
  // LockedView
  vault_not_found: { es: 'No se encontró ninguna bóveda', en: 'No vault found' },
  vault_not_found_desc: { es: 'Crea una contraseña maestra fuerte para inicializar tu bóveda. Esta contraseña NUNCA podrá ser recuperada si la olvidas.', en: 'Create a strong master password to initialize your vault. This password can NEVER be recovered if forgotten.' },
  create_vault_btn: { es: 'Crear Bóveda', en: 'Create Vault' },
  vault_locked: { es: 'Bóveda Bloqueada', en: 'Vault Locked' },
  vault_locked_desc: { es: 'Ingresa tu contraseña maestra para descifrar tus datos.', en: 'Enter your master password to decrypt your data.' },
  unlock_btn: { es: 'Desbloquear', en: 'Unlock' },
  master_password_placeholder: { es: 'Contraseña maestra', en: 'Master password' },
  
  // UnlockedView
  sidebar_books: { es: 'Libros y Notas', en: 'Books and Notes' },
  sidebar_secrets: { es: 'Credenciales', en: 'Credentials' },
  sidebar_settings: { es: 'Configuración', en: 'Settings' },
  sidebar_trash: { es: 'Papelera', en: 'Trash' },
  lock_vault_tooltip: { es: 'Bloquear Bóveda', en: 'Lock Vault' },
  
  // NotesView
  books_title: { es: 'Libros', en: 'Books' },
  notes_title: { es: 'Notas', en: 'Notes' },
  new_book_prompt: { es: 'Nombre del nuevo libro:', en: 'New book name:' },
  new_note_default_title: { es: 'Nueva Nota', en: 'New Note' },
  select_book_first: { es: 'Selecciona un libro primero', en: 'Select a book first' },
  select_note_first: { es: 'Selecciona una nota para leer o editar', en: 'Select a note to read or edit' },
  note_title_placeholder: { es: 'Título de la nota', en: 'Note title' },
  note_content_placeholder: { es: 'Escribe tu nota aquí...', en: 'Write your note here...' },
  save_changes: { es: 'Guardar Cambios', en: 'Save Changes' },
  delete: { es: 'Eliminar', en: 'Delete' },
  confirm_delete_note: { es: '¿Estás seguro de que deseas mover esta nota a la papelera?', en: 'Are you sure you want to move this note to trash?' },
  confirm_delete_book: { es: '¿Estás seguro de que deseas mover este libro y todas sus notas a la papelera?', en: 'Are you sure you want to move this book and all its notes to trash?' },
  
  // Markdown Editor
  edit_mode: { es: 'Editar', en: 'Edit' },
  preview_mode: { es: 'Vista Previa', en: 'Preview' },
  split_mode: { es: 'Dividido', en: 'Split' },
  
  // SecretsView
  credentials_title: { es: 'Credenciales', en: 'Credentials' },
  new_credential_default_title: { es: 'Nueva Credencial', en: 'New Credential' },
  select_secret_first: { es: 'Selecciona una credencial para ver sus detalles', en: 'Select a credential to view details' },
  service_name_placeholder: { es: 'Nombre del servicio', en: 'Service name' },
  username_label: { es: 'Usuario / Email', en: 'Username / Email' },
  password_label: { es: 'Contraseña', en: 'Password' },
  url_label: { es: 'URL', en: 'URL' },
  notes_label: { es: 'Observación', en: 'Observation' },
  password_generator_title: { es: 'Generador de contraseñas', en: 'Password Generator' },
  generate_btn: { es: 'Generar', en: 'Generate' },
  use_btn: { es: 'Usar', en: 'Use' },
  confirm_delete_secret: { es: '¿Estás seguro de que deseas eliminar esta credencial?', en: 'Are you sure you want to delete this credential?' },
  
  // SettingsView
  settings_title: { es: 'Configuración', en: 'Settings' },
  settings_desc: { es: 'Administra tu bóveda de VaultNote.', en: 'Manage your VaultNote vault.' },
  backup_restore_title: { es: 'Respaldo y Restauración', en: 'Backup and Restore' },
  backup_restore_desc: { es: 'Exporta tu bóveda cifrada a un lugar seguro, o importa un respaldo anterior.', en: 'Export your encrypted vault to a secure location, or import a previous backup.' },
  export_vault_btn: { es: '📤 Exportar Bóveda', en: '📤 Export Vault' },
  import_vault_btn: { es: '📥 Importar Bóveda', en: '📥 Import Vault' },
  change_password_title: { es: 'Cambiar Contraseña Maestra', en: 'Change Master Password' },
  change_password_desc: { es: 'Cambia tu contraseña maestra. Esto recifrará de forma segura tu llave de acceso interna.', en: 'Change your master password. This will securely re-encrypt your internal access key.' },
  new_password_label: { es: 'Nueva Contraseña', en: 'New Password' },
  confirm_password_label: { es: 'Confirmar Contraseña', en: 'Confirm Password' },
  change_password_btn: { es: 'Cambiar Contraseña', en: 'Change Password' },
  language_title: { es: 'Idioma', en: 'Language' },
  language_desc: { es: 'Selecciona el idioma de la aplicación.', en: 'Select the application language.' },
  
  // Messages
  export_success: { es: 'Bóveda exportada exitosamente.', en: 'Vault exported successfully.' },
  import_warning: { es: 'Advertencia: Importar una bóveda sobrescribirá la bóveda actual. Todos los datos actuales se perderán. ¿Deseas continuar?', en: 'Warning: Importing a vault will overwrite the current vault. All current data will be lost. Do you wish to continue?' },
  import_success: { es: 'Bóveda importada exitosamente. La aplicación se recargará.', en: 'Vault imported successfully. The application will reload.' },
  password_length_error: { es: 'La contraseña debe tener al menos 8 caracteres.', en: 'Password must be at least 8 characters long.' },
  password_match_error: { es: 'Las contraseñas no coinciden.', en: 'Passwords do not match.' },
  password_change_success: { es: 'Contraseña maestra cambiada exitosamente.', en: 'Master password changed successfully.' },
  
  // Trash
  trash_title: { es: 'Papelera de Reciclaje', en: 'Recycle Bin' },
  trash_empty: { es: 'La papelera está vacía', en: 'Trash is empty' },
  tasks_empty: { es: 'No hay tareas pendientes', en: 'No pending tasks' },
  favorites_empty: { es: 'No hay notas favoritas', en: 'No favorite notes' },
  notes_empty: { es: 'No se encontraron notas', en: 'No notes found' },
  restore_btn: { es: 'Restaurar', en: 'Restore' },
  delete_perm_btn: { es: 'Eliminar Permanentemente', en: 'Delete Permanently' },
  confirm_delete_perm: { es: '¿Estás seguro? Esta acción no se puede deshacer.', en: 'Are you sure? This action cannot be undone.' },
  item_restored: { es: 'Elemento restaurado.', en: 'Item restored.' },
  item_deleted_perm: { es: 'Elemento eliminado permanentemente.', en: 'Item permanently deleted.' },
  
  // Auto-save
  saving_status: { es: 'Guardando...', en: 'Saving...' },
  saved_status: { es: 'Guardado', en: 'Saved' },

  // New UI Components
  sidebar_all_notes: { es: 'Todas las Notas', en: 'All Notes' },
  sidebar_favorites: { es: 'Favoritos', en: 'Favorites' },
  sidebar_pinned: { es: 'Fijados', en: 'Pinned' },
  sidebar_tasks: { es: 'Tareas', en: 'Tasks' },
  sidebar_uncategorized: { es: 'Sin Categoría', en: 'Uncategorized' },
  sidebar_notebooks: { es: 'LIBROS', en: 'NOTEBOOKS' },
  sidebar_quick_access: { es: 'ACCESO RÁPIDO', en: 'QUICK ACCESS' },
  
  topbar_search_all: { es: 'Buscar en todas las notas...', en: 'Search all notes...' },
  topbar_search_in_book: { es: 'Buscar en este libro...', en: 'Search in this book...' },
  topbar_new_note: { es: 'Nueva Nota', en: 'New Note' },
  
  editor_code_view: { es: 'Código', en: 'Code' },
  editor_last_modified: { es: 'Última modificación', en: 'Last modified' },
  editor_words: { es: 'palabras', en: 'words' },
  editor_chars: { es: 'caracteres', en: 'characters' },
  editor_pin_note: { es: 'Fijar Nota', en: 'Pin Note' },
  editor_favorite_note: { es: 'Favorito', en: 'Favorite' },
  editor_trash_note: { es: 'Mover a la papelera', en: 'Move to trash' },

  lock_screen_create_vault: { es: 'Crear Bóveda', en: 'Create Vault' },
  lock_screen_confirm_password: { es: 'Confirmar contraseña', en: 'Confirm password' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const savedLang = localStorage.getItem('vaultnote_lang') as Language;
    if (savedLang === 'es' || savedLang === 'en') {
      setLanguageState(savedLang);
    } else {
      // Default to browser language if Spanish, otherwise English
      const browserLang = navigator.language.split('-')[0];
      setLanguageState(browserLang === 'es' ? 'es' : 'en');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vaultnote_lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) return key;
    return translations[key][language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
