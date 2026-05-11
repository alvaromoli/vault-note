use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct VaultMetadata {
    pub salt: Vec<u8>,
    pub encrypted_dek: Vec<u8>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EncryptedItem {
    pub id: String,
    pub item_type: String,
    pub parent_id: Option<String>,
    pub encrypted_blob: Vec<u8>,
    pub created_at: String,
    pub updated_at: String,
}
