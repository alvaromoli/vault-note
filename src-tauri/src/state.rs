use std::sync::Mutex;
use zeroize::Zeroizing;

pub struct AppState {
    // Almacena la Data Encryption Key (DEK) en memoria mientras la bóveda está desbloqueada
    pub dek: Mutex<Option<Zeroizing<Vec<u8>>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            dek: Mutex::new(None),
        }
    }

    pub fn unlock(&self, dek: Zeroizing<Vec<u8>>) {
        let mut state = self.dek.lock().unwrap();
        *state = Some(dek);
    }

    pub fn lock(&self) {
        let mut state = self.dek.lock().unwrap();
        // Zeroizing se encarga de limpiar la memoria automáticamente al hacer drop
        *state = None;
    }

    pub fn is_unlocked(&self) -> bool {
        let state = self.dek.lock().unwrap();
        state.is_some()
    }
}
