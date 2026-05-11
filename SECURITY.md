# Security Model - VaultNote

VaultNote is designed as an offline-first, local-first application where your data never leaves your device unless you explicitly export it. The entire security model revolves around ensuring that if your computer is compromised while the application is locked, or if someone steals your `vault.db` file, your data remains mathematically unbreakable without the Master Password.

## Key Derivation
1. **Master Password**: The user provides a master password. This password is **never** saved to disk in plain text or in any hashed form that can be directly verified.
2. **Argon2id KDF**: We generate a random 16-byte `salt` when creating a vault. We use the memory-hard `Argon2id` Key Derivation Function (KDF) to stretch the Master Password and the salt into a 32-byte **Key Encryption Key (KEK)**.
   - Argon2id is resistant to GPU-based brute-force attacks and side-channel attacks.

## Data Encryption Key (DEK)
To allow changing the Master Password without having to decrypt and re-encrypt every single note and secret in the database, we use a two-tier key system:
1. When the vault is created, a cryptographically secure random 32-byte **Data Encryption Key (DEK)** is generated using the OS's CSPRNG (`OsRng`).
2. The DEK is encrypted using **AES-256-GCM** with the derived KEK.
3. The encrypted DEK and the `salt` are stored in the SQLite database (`vault_metadata` table).

## Data Encryption (Payloads)
1. Every book, note, or credential created is converted into a JSON string.
2. This JSON string is encrypted using **AES-256-GCM** using the unlocked DEK in memory.
3. A unique 12-byte random `nonce` is generated for *every single item* before encryption.
4. The database stores the encrypted item as a binary blob containing `[nonce (12 bytes) | ciphertext | authentication tag]`. 
5. No sensitive metadata (titles, tags, content) is stored in plain text columns in SQLite. The database schema only exposes UUIDs and parent relationships.

## Memory Security
- When the vault is unlocked, the DEK is kept in a Rust `Mutex` in the application state.
- The DEK is wrapped in the `Zeroizing` struct (from the `zeroize` crate), ensuring that when the application is locked or closed, the memory holding the DEK is securely wiped (overwritten with zeroes) to prevent cold-boot attacks or memory dumping.
- The frontend (React) also clears its local state when the application is locked.

## Threat Model & Mitigations
- **Stolen Database File**: An attacker needs the Master Password. Brute forcing is computationally infeasible due to Argon2id and AES-256.
- **Lost Master Password**: There is absolutely no backdoor or recovery mechanism. If the password is lost, the data is permanently inaccessible.
- **Memory Dumping**: Mitigated by zeroing out the DEK upon locking, and by implementing an automatic lock timeout (default 5 minutes of inactivity).
- **Clipboard Snooping**: Passwords copied from the Secrets module are automatically purged from the OS clipboard after 30 seconds.

---
*(Traducción al Español)*

# Modelo de Seguridad - VaultNote

VaultNote está diseñada como una aplicación local, enfocada en trabajar sin conexión ("offline-first"), donde tus datos nunca salen de tu dispositivo a menos que los exportes explícitamente. Todo el modelo de seguridad gira en torno a garantizar que, si tu computadora es vulnerada mientras la aplicación está bloqueada, o si alguien roba tu archivo `vault.db`, tus datos permanezcan matemáticamente inquebrantables sin la Contraseña Maestra.

## Derivación de Llaves (Key Derivation)
1. **Contraseña Maestra**: El usuario provee una contraseña maestra. Esta contraseña **nunca** se guarda en el disco en texto plano ni en ningún formato *hasheado* que pueda ser verificado directamente.
2. **Argon2id KDF**: Generamos una `salt` aleatoria de 16 bytes al crear una bóveda. Utilizamos la función de derivación de llaves (KDF) `Argon2id`, diseñada para requerir gran cantidad de memoria, para extender la Contraseña Maestra y la `salt` en una **Key Encryption Key (KEK)** de 32 bytes.
   - Argon2id es resistente a ataques de fuerza bruta usando tarjetas de video (GPUs) y a ataques de canal lateral.

## Llave de Cifrado de Datos (DEK)
Para permitir el cambio de la Contraseña Maestra sin tener que descifrar y volver a cifrar cada una de las notas y secretos de la base de datos, utilizamos un sistema de llaves de dos niveles:
1. Cuando se crea la bóveda, se genera una **Data Encryption Key (DEK)** de 32 bytes criptográficamente segura utilizando el generador de números aleatorios del sistema operativo (`OsRng`).
2. Esta DEK se cifra usando **AES-256-GCM** junto con la KEK derivada de la contraseña maestra.
3. La DEK cifrada y la `salt` se almacenan en la base de datos SQLite (en la tabla `vault_metadata`).

## Cifrado de Datos (Payloads)
1. Todo libro, nota o credencial creado se convierte en una cadena de texto JSON.
2. Esta cadena JSON se cifra utilizando **AES-256-GCM** con la DEK que está desbloqueada en la memoria RAM.
3. Se genera un `nonce` aleatorio y único de 12 bytes para *cada elemento individual* justo antes de cifrarlo.
4. La base de datos almacena el elemento cifrado como un bloque binario (blob) que contiene: `[nonce (12 bytes) | texto cifrado | etiqueta de autenticación]`.
5. Ningún metadato sensible (títulos, etiquetas, contenido) se guarda en texto plano en SQLite. El esquema de la base de datos solo expone los identificadores UUID y las relaciones entre elementos.

## Seguridad en Memoria
- Cuando la bóveda está desbloqueada, la DEK se mantiene protegida dentro de un `Mutex` en el estado de la aplicación en Rust.
- La DEK está envuelta en la estructura `Zeroizing` (del paquete `zeroize`), garantizando que cuando la aplicación se bloquea o se cierra, la memoria RAM que contiene la DEK es sobrescrita con ceros de forma segura para prevenir ataques de "Arranque en Frío" (*cold-boot attacks*) o volcados de memoria (*memory dumping*).
- El frontend (React) también borra por completo su estado local interno cuando se bloquea la aplicación.

## Modelo de Amenazas y Mitigaciones
- **Robo del Archivo de Base de Datos**: Un atacante requeriría la Contraseña Maestra. Intentar realizar fuerza bruta es computacionalmente inviable gracias al uso combinado de Argon2id y AES-256.
- **Pérdida de la Contraseña Maestra**: No existe ningún mecanismo de recuperación ni "puerta trasera" (*backdoor*). Si la contraseña se pierde, los datos quedan permanentemente inaccesibles.
- **Volcados de Memoria (*Memory Dumping*)**: Mitigado sobrescribiendo con ceros la DEK al bloquear la app, y mediante la implementación de un bloqueo automático de seguridad (por defecto, tras 5 minutos de inactividad).
- **Espionaje del Portapapeles**: Las contraseñas copiadas del módulo de Secretos se borran automáticamente del portapapeles del sistema operativo transcurridos 30 segundos.
