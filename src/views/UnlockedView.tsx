import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { NotesView } from './NotesView';
import { SecretsView } from './SecretsView';
import { SettingsView } from './SettingsView';
import { useLanguage } from '../i18n';
import './UnlockedView.css';

interface UnlockedViewProps {
  onLock: () => void;
}

type Tab = 'notes' | 'secrets' | 'settings';

export function UnlockedView({ onLock }: UnlockedViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const { t } = useLanguage();
  
  const handleLock = async () => {
    try {
      await invoke('lock_vault');
      onLock();
    } catch (e) {
      console.error("Error locking vault:", e);
    }
  };

  return (
    <div className="unlocked-container animate-fade-in">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2>VaultNote</h2>
          <button onClick={handleLock} className="lock-btn" title={t('lock_vault_tooltip')}>
            🔒
          </button>
        </div>
        <div className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            {t('sidebar_books')}
          </button>
          <button 
            className={`nav-item ${activeTab === 'secrets' ? 'active' : ''}`}
            onClick={() => setActiveTab('secrets')}
          >
            {t('sidebar_secrets')}
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('sidebar_settings')}
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        {activeTab === 'notes' && <NotesView />}
        {activeTab === 'secrets' && <SecretsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
