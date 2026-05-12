use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{rand_core::RngCore, SaltString},
    Argon2, PasswordHasher,
};
use rand::Rng;
use zeroize::Zeroizing;

#[derive(Debug)]
pub enum CryptoError {
    Argon2Error(String),
    AesGcmError(String),
    InvalidLength,
}

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CryptoError::Argon2Error(e) => write!(f, "Argon2 error: {}", e),
            CryptoError::AesGcmError(e) => write!(f, "AES-GCM error: {}", e),
            CryptoError::InvalidLength => write!(f, "Invalid data length"),
        }
    }
}

impl std::error::Error for CryptoError {}

pub const SALT_LEN: usize = 16;
pub const NONCE_LEN: usize = 12;

/// Genera un salt aleatorio de 16 bytes
pub fn generate_salt() -> [u8; SALT_LEN] {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    salt
}

/// Deriva la Key Encryption Key (KEK) usando Argon2id
pub fn derive_kek(password: &str, salt: &[u8]) -> Result<Zeroizing<Vec<u8>>, CryptoError> {
    let _argon2 = Argon2::default();
    
    // Argon2 produce un hash en formato string, pero queremos el output crudo (32 bytes para AES-256)
    let mut kek = vec![0u8; 32];
    
    // Necesitamos convertir el salt a un formato compatible si usamos el hash raw, o usar hash_password_into
    let result = argon2::Params::new(
        argon2::Params::DEFAULT_M_COST,
        argon2::Params::DEFAULT_T_COST,
        argon2::Params::DEFAULT_P_COST,
        Some(32) // output length 32 bytes
    ).map_err(|e| CryptoError::Argon2Error(e.to_string()))?;
    
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, result);
    
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut kek)
        .map_err(|e| CryptoError::Argon2Error(e.to_string()))?;
        
    Ok(Zeroizing::new(kek))
}

/// Genera una Data Encryption Key (DEK) aleatoria de 32 bytes
pub fn generate_dek() -> Zeroizing<Vec<u8>> {
    let mut dek = vec![0u8; 32];
    OsRng.fill_bytes(&mut dek);
    Zeroizing::new(dek)
}

/// Cifra un payload (como la DEK o un JSON) usando AES-256-GCM. 
/// Retorna: [nonce (12 bytes) | ciphertext + tag]
pub fn encrypt_payload(payload: &[u8], key: &[u8]) -> Result<Vec<u8>, CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidLength);
    }
    
    let cipher = Aes256Gcm::new(key.into());
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, payload)
        .map_err(|e| CryptoError::AesGcmError(e.to_string()))?;
        
    let mut result = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);
    
    Ok(result)
}

/// Descifra un payload usando AES-256-GCM.
/// Espera: [nonce (12 bytes) | ciphertext + tag]
pub fn decrypt_payload(encrypted_payload: &[u8], key: &[u8]) -> Result<Vec<u8>, CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidLength);
    }
    if encrypted_payload.len() < NONCE_LEN {
        return Err(CryptoError::InvalidLength);
    }
    
    let cipher = Aes256Gcm::new(key.into());
    let (nonce_bytes, ciphertext) = encrypted_payload.split_at(NONCE_LEN);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::AesGcmError(e.to_string()))?;
        
    Ok(plaintext)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kek_derivation() {
        let password = "my_secure_password";
        let salt = generate_salt();
        
        let kek1 = derive_kek(password, &salt).unwrap();
        let kek2 = derive_kek(password, &salt).unwrap();
        
        assert_eq!(*kek1, *kek2);
        assert_eq!(kek1.len(), 32);
    }

    #[test]
    fn test_encrypt_decrypt_payload() {
        let dek = generate_dek();
        let payload = b"Hello, encrypted vault!";
        
        let encrypted = encrypt_payload(payload, &dek).unwrap();
        assert_ne!(payload, encrypted.as_slice());
        
        let decrypted = decrypt_payload(&encrypted, &dek).unwrap();
        assert_eq!(payload, decrypted.as_slice());
    }
    
    #[test]
    fn test_decrypt_payload_wrong_key() {
        let dek1 = generate_dek();
        let dek2 = generate_dek();
        let payload = b"Hello, encrypted vault!";
        
        let encrypted = encrypt_payload(payload, &dek1).unwrap();
        
        let result = decrypt_payload(&encrypted, &dek2);
        assert!(result.is_err());
    }
}
