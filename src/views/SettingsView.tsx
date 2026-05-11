import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useLanguage } from '../i18n';
import './SettingsView.css';

export function SettingsView() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { t, language, setLanguage } = useLanguage();

  const handleExport = async () => {
    try {
      const filePath = await save({
        filters: [{
          name: 'Vault Database',
          extensions: ['db']
        }],
        defaultPath: 'vaultnote_backup.db'
      });

      if (filePath) {
        await invoke('export_vault', { destPath: filePath });
        setMessage(t('export_success'));
      }
    } catch (e) {
      console.error(e);
      setMessage(`Error al exportar: ${e}`);
    }
  };

  const handleImport = async () => {
    if (!confirm(t('import_warning'))) return;
    
    try {
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'Vault Database',
          extensions: ['db']
        }]
      });

      if (filePath && typeof filePath === 'string') {
        await invoke('import_vault', { sourcePath: filePath });
        alert(t('import_success'));
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      setMessage(`Error al importar: ${e}`);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setMessage(t('password_length_error'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage(t('password_match_error'));
      return;
    }

    try {
      await invoke('change_password', { newPassword });
      setMessage(t('password_change_success'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      console.error(e);
      setMessage(`Error al cambiar contraseña: ${e}`);
    }
  };

  return (
    <div className="settings-view animate-fade-in">
      <div className="settings-panel glass-panel">
        <h2>{t('settings_title')}</h2>
        <p className="settings-desc">{t('settings_desc')}</p>

        {message && <div className="settings-message">{message}</div>}

        <div className="settings-section">
          <h3>{t('language_title')}</h3>
          <p>{t('language_desc')}</p>
          <div className="form-group">
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value as 'es' | 'en')}
              className="lang-select"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <hr className="divider" />

        <div className="settings-section">
          <h3>{t('backup_restore_title')}</h3>
          <p>{t('backup_restore_desc')}</p>
          <div className="settings-actions">
            <button onClick={handleExport}>{t('export_vault_btn')}</button>
            <button className="btn-danger" onClick={handleImport}>{t('import_vault_btn')}</button>
          </div>
        </div>

        <hr className="divider" />

        <div className="settings-section">
          <h3>{t('change_password_title')}</h3>
          <p>{t('change_password_desc')}</p>
          
          <div className="form-group">
            <label>{t('new_password_label')}</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>{t('confirm_password_label')}</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="settings-actions">
            <button 
              onClick={handleChangePassword} 
              disabled={!newPassword || newPassword !== confirmPassword}
            >
              {t('change_password_btn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
