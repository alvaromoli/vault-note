# VaultNote

VaultNote is a highly secure, offline-first, local desktop application for managing your notes, books, and credentials. It is built with a focus on strong cryptography and privacy.

## 🚀 Downloads

Official pre-compiled versions are available in the **Releases** section:
- **Installer (.msi)**: Recommended for a full installation on Windows.
- **Portable (.exe)**: Run it directly without installation.

## Features
- **Zero-Knowledge Architecture**: Your master password is never stored. All data is encrypted locally using AES-256-GCM.
- **Books & Notes**: Organize your thoughts hierarchically.
- **Secrets Manager**: Store your passwords and credentials securely with an integrated password generator and 30-second clipboard auto-clear.
- **Auto-Lock**: Automatically locks your vault after 5 minutes of inactivity.
- **Modern UI**: Dark mode, glassmorphism, and a distraction-free environment.

## 📝 Markdown Guide

Use the following syntax to format your notes:
- `# Header 1` to `### Header 3`
- `**bold**`, `*italic*`, `~~strikethrough~~`
- `[Link Title](https://url.com)`
- `- item` for lists or `- [ ] task` for checklists
- ` ```rust ` code blocks
- `> Quote` for citations

---

## Tech Stack
- **Backend**: Rust (Tauri framework)
- **Frontend**: React + TypeScript + Vite
- **Database**: SQLite (via `rusqlite`)
- **Cryptography**: `argon2` (Argon2id), `aes-gcm` (AES-256-GCM), `zeroize`.

## Development

### Prerequisites
- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)

### Setup
1. Clone the repository.
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Run the application in development mode:
   ```bash
   npm run tauri dev
   ```

### Security
For details on the cryptographic implementation and threat model, please refer to [SECURITY.md](SECURITY.md).

---
*(Traducción al Español)*

# VaultNote

VaultNote es una aplicación de escritorio local, orientada a la privacidad y altamente segura, diseñada para administrar tus notas, libros y credenciales. Está construida con un fuerte enfoque en criptografía robusta.

## 🚀 Descargas

Las versiones oficiales pre-compiladas están disponibles en la sección de **Releases**:
- **Instalador (.msi)**: Recomendado para una instalación completa en Windows.
- **Versión Portable (.exe)**: Ejecútalo directamente sin necesidad de instalación.

## Características
- **Arquitectura de Conocimiento Cero (Zero-Knowledge)**: Tu contraseña maestra nunca se almacena. Todos los datos se cifran localmente usando AES-256-GCM.
- **Libros y Notas**: Organiza tus pensamientos jerárquicamente.
- **Gestor de Secretos**: Almacena tus contraseñas y credenciales de forma segura con un generador integrado y limpieza automática del portapapeles tras 30 segundos.
- **Bloqueo Automático**: Bloquea tu bóveda automáticamente después de 5 minutos de inactividad.
- **Interfaz Moderna**: Modo oscuro, diseño "glassmorphism" y un entorno libre de distracciones.

## 📝 Guía de Markdown

Usa la siguiente sintaxis para dar formato a tus notas:
- `# Título 1` hasta `### Título 3`
- `**negrita**`, `*cursiva*`, `~~tachado~~`
- `[Título del Link](https://url.com)`
- `- elemento` para listas o `- [ ] tarea` para checklists
- ` ```rust ` bloques de código
- `> Cita` para menciones

---

## Tecnologías Utilizadas
- **Backend**: Rust (Framework Tauri)
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: SQLite (mediante `rusqlite`)
- **Criptografía**: `argon2` (Argon2id), `aes-gcm` (AES-256-GCM), `zeroize`.

## Desarrollo

### Prerrequisitos
- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)

### Instalación
1. Clona el repositorio.
2. Instala las dependencias del frontend:
   ```bash
   npm install
   ```
3. Ejecuta la aplicación en modo desarrollo:
   ```bash
   npm run tauri dev
   ```

### Seguridad
Para más detalles sobre la implementación criptográfica y el modelo de amenazas, por favor consulta [SECURITY.md](SECURITY.md).

---

## 📜 Version History / Historial de Versiones

### [v0.1.0] - 2026-05-12
**Added / Añadido:**
- **Markdown Support**: Rich text editing with split-view and code highlighting. / Soporte para Markdown con vista dividida y resaltado de código.
- **Trash Bin**: Soft-delete system for notes and secrets. / Papelera de reciclaje para notas y secretos.
- **Auto-save**: Real-time saving to prevent data loss. / Auto-guardado en tiempo real.
- **Auto-lock Improvements**: Fixed inactivity timer and lock loops. / Mejoras en el bloqueo por inactividad.
- **UI/UX Polish**: Enhanced glassmorphism styles and animations. / Mejoras visuales en estilos y animaciones.
