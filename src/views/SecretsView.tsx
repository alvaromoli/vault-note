import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import type { Credential } from '../types';
import { useLanguage } from '../i18n';
import './SecretsView.css';

export function SecretsView() {
  const [secrets, setSecrets] = useState<Credential[]>([]);
  const [selectedSecret, setSelectedSecret] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      const items: [string, string][] = await invoke('get_items', { itemType: 'credential' });
      const loadedSecrets = items.map(([id, jsonStr]) => {
        const secret = JSON.parse(jsonStr) as Credential;
        secret.id = id;
        return secret;
      });
      setSecrets(loadedSecrets);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSecret = async () => {
    const newSecret: Credential = {
      name: t('new_credential_default_title'),
      username: '',
      passwordStr: '',
      url: '',
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      const id = await invoke<string>('save_item', { 
        itemType: 'credential',
        parentId: null,
        payload: JSON.stringify(newSecret)
      });
      newSecret.id = id;
      setSecrets([...secrets, newSecret]);
      setSelectedSecret(newSecret);
    } catch (e) {
      console.error('Error creating secret', e);
    }
  };

  const handleSaveSecret = async () => {
    if (!selectedSecret || !selectedSecret.id) return;
    
    try {
      selectedSecret.updatedAt = Date.now();
      const payloadObj = { ...selectedSecret };
      delete payloadObj.id;
      
      await invoke('delete_item', { id: selectedSecret.id });
      const newId = await invoke<string>('save_item', { 
        itemType: 'credential',
        parentId: null,
        payload: JSON.stringify(payloadObj)
      });
      
      const updatedSecret = { ...selectedSecret, id: newId };
      setSecrets(secrets.map(s => s.id === selectedSecret.id ? updatedSecret : s));
      setSelectedSecret(updatedSecret);
    } catch (e) {
      console.error('Error saving secret', e);
    }
  };

  const handleDeleteSecret = async () => {
    if (!selectedSecret || !selectedSecret.id) return;
    if (!confirm(t('confirm_delete_secret'))) return;
    
    try {
      await invoke('trash_item', { id: selectedSecret.id });
      setSecrets(secrets.filter(s => s.id !== selectedSecret.id));
      setSelectedSecret(null);
    } catch (e) {
      console.error('Error trashing secret', e);
    }
  };

  const handleCopyPassword = async (pwd: string) => {
    try {
      await writeText(pwd);
      // Wait for 30s and clear clipboard (simplistic approach, ideally done by backend)
      setTimeout(async () => {
        await writeText('');
      }, 30000);
    } catch (e) {
      console.error('Error copying to clipboard', e);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pwd = "";
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
  };

  return (
    <div className="secrets-view">
      <div className="secrets-list-panel glass-panel">
        <div className="panel-header">
          <h3>{t('credentials_title')}</h3>
          <button onClick={handleCreateSecret} className="icon-btn">+</button>
        </div>
        <div className="list-container">
          {secrets.map(s => (
            <div 
              key={s.id} 
              className={`list-item ${selectedSecret?.id === s.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedSecret(s);
                setShowPassword(false);
              }}
            >
              🔑 {s.name || 'Sin título'}
            </div>
          ))}
        </div>
      </div>

      <div className="secret-detail-panel glass-panel">
        {selectedSecret ? (
          <div className="secret-form animate-fade-in">
            <input 
              className="secret-title-input" 
              value={selectedSecret.name}
              onChange={e => setSelectedSecret({...selectedSecret, name: e.target.value})}
              placeholder={t('service_name_placeholder')}
            />
            
            <div className="form-group">
              <label>{t('username_label')}</label>
              <input 
                value={selectedSecret.username}
                onChange={e => setSelectedSecret({...selectedSecret, username: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>{t('password_label')}</label>
              <div className="password-input-group">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={selectedSecret.passwordStr}
                  onChange={e => setSelectedSecret({...selectedSecret, passwordStr: e.target.value})}
                />
                <button onClick={() => setShowPassword(!showPassword)} title="Mostrar/Ocultar">
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
                <button onClick={() => handleCopyPassword(selectedSecret.passwordStr)} title="Copiar al portapapeles">
                  📋
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>{t('url_label')}</label>
              <input 
                value={selectedSecret.url}
                onChange={e => setSelectedSecret({...selectedSecret, url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>{t('notes_label')}</label>
              <textarea 
                value={selectedSecret.notes}
                onChange={e => setSelectedSecret({...selectedSecret, notes: e.target.value})}
                rows={4}
              />
            </div>

            <div className="actions-bar">
              <button className="btn-danger" onClick={handleDeleteSecret}>{t('delete')}</button>
              <button onClick={handleSaveSecret}>{t('save_changes')}</button>
            </div>
            
            <hr className="divider" />
            
            <div className="generator-section">
              <h4>{t('password_generator_title')}</h4>
              <div className="password-input-group">
                <input type="text" readOnly value={generatedPassword} placeholder="..." />
                <button onClick={generatePassword}>{t('generate_btn')}</button>
                <button 
                  onClick={() => {
                    handleCopyPassword(generatedPassword);
                    if(selectedSecret) setSelectedSecret({...selectedSecret, passwordStr: generatedPassword});
                  }}
                  disabled={!generatedPassword}
                >
                  {t('use_btn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('select_secret_first')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
