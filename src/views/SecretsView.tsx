import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import type { Credential } from '../types';
import { 
  Shield, Copy, Eye, EyeOff, Save, Trash2, Key, Globe, User, FileText, RefreshCw, Tag as TagIcon 
} from 'lucide-react';
import { useLanguage } from '../i18n';
import './SecretsView.css';

interface SecretsViewProps {
  searchQuery?: string;
  selectedTag?: string | null;
  onShowConfirm: (title: string, message: string, onConfirm: () => void, type?: 'confirm' | 'danger') => void;
}

export function SecretsView({ searchQuery = '', selectedTag = null, onShowConfirm }: SecretsViewProps) {
  const [secrets, setSecrets] = useState<Credential[]>([]);
  const [selectedSecret, setSelectedSecret] = useState<Credential | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { t } = useLanguage();

  const filteredSecrets = useMemo(() => {
    let result = (secrets || []);
    
    if (selectedTag) {
      result = result.filter(s => s.tags?.includes(selectedTag));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.username.toLowerCase().includes(q)
      );
    }
    return result;
  }, [secrets, searchQuery, selectedTag]);

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
      tags: [],
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
    
    onShowConfirm(
      'Mover a la papelera',
      '¿Mover esta credencial a la papelera?',
      async () => {
        try {
          await invoke('trash_item', { id: selectedSecret!.id! });
          setSecrets(secrets.filter(s => s.id !== selectedSecret!.id));
          setSelectedSecret(null);
        } catch (e) {
          console.error('Error trashing secret', e);
        }
      },
      'danger'
    );
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
          {filteredSecrets.length === 0 ? (
            <div className="empty-msg">{t('notes_empty')}</div>
          ) : (
            filteredSecrets.map(s => (
              <div 
                key={s.id} 
                className={`list-item ${selectedSecret?.id === s.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedSecret(s);
                  setShowPassword(false);
                }}
              >
                <div className="list-item-icon">
                  <Shield size={16} />
                </div>
                <div className="list-item-content">
                  <span className="secret-name">{s.name || t('new_credential_default_title')}</span>
                  <span className="secret-user">{s.username || '...'}</span>
                </div>
              </div>
            ))
          )}
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
              <label><User size={14} /> {t('username_label')}</label>
              <input 
                className="secret-input"
                value={selectedSecret.username}
                onChange={e => setSelectedSecret({...selectedSecret, username: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label><Key size={14} /> {t('password_label')}</label>
              <div className="password-input-group">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={selectedSecret.passwordStr}
                  onChange={e => setSelectedSecret({...selectedSecret, passwordStr: e.target.value})}
                  className="secret-input"
                />
                <button className="icon-btn-small" onClick={() => setShowPassword(!showPassword)} title="Mostrar/Ocultar">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button className="icon-btn-small" onClick={() => handleCopyPassword(selectedSecret.passwordStr)} title="Copiar al portapapeles">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label><Globe size={14} /> {t('url_label')}</label>
              <input 
                className="secret-input"
                value={selectedSecret.url}
                onChange={e => setSelectedSecret({...selectedSecret, url: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label><FileText size={14} /> {t('notes_label')}</label>
              <textarea 
                className="secret-input"
                value={selectedSecret.notes}
                onChange={e => setSelectedSecret({...selectedSecret, notes: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label><TagIcon size={14} /> TAGS</label>
              <input 
                className="secret-input"
                value={(selectedSecret.tags || []).join(', ')}
                onChange={e => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                  setSelectedSecret({...selectedSecret, tags});
                }}
                placeholder="Añadir etiquetas (separadas por comas)..."
              />
            </div>

            <div className="actions-bar">
              <button className="btn-danger-outline" onClick={handleDeleteSecret}>
                <Trash2 size={16} /> {t('delete')}
              </button>
              <button className="btn-primary" onClick={handleSaveSecret}>
                <Save size={16} /> {t('save_changes')}
              </button>
            </div>
            
            <hr className="divider" />
            
            <div className="generator-section">
              <h4>{t('password_generator_title')}</h4>
              <div className="password-input-group">
                <input type="text" readOnly value={generatedPassword} placeholder="..." className="secret-input" />
                <button className="btn-secondary" onClick={generatePassword}>
                  <RefreshCw size={16} /> {t('generate_btn')}
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    handleCopyPassword(generatedPassword);
                    if(selectedSecret) setSelectedSecret({...selectedSecret, passwordStr: generatedPassword});
                  }}
                  disabled={!generatedPassword}
                >
                  <Key size={16} /> {t('use_btn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <Shield size={48} strokeWidth={1} />
            </div>
            <h3>Gestión de Credenciales</h3>
            <p>Selecciona una credencial de la lista para ver o editar sus detalles de seguridad.</p>
          </div>
        )}
      </div>
    </div>
  );
}
