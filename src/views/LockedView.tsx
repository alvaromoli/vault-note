import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLanguage } from '../i18n';
import './LockedView.css';

interface LockedViewProps {
  onUnlock: () => void;
}

export function LockedView({ onUnlock }: LockedViewProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [vaultExists, setVaultExists] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    checkVaultStatus();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const exists = await invoke<boolean>('check_vault_exists');
      setVaultExists(exists);
    } catch (e) {
      setError('Error al verificar el estado de la bóveda: ' + e);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('password_match_error'));
      return;
    }
    if (password.length < 8) {
      setError(t('password_length_error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await invoke('create_vault', { password });
      onUnlock();
    } catch (e) {
      setError(e as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await invoke('unlock_vault', { password });
      onUnlock();
    } catch (e) {
      setError(e as string);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="locked-container">Cargando bóveda...</div>;
  }

  return (
    <div className="locked-container animate-fade-in">
      <div className="locked-card glass-panel">
        <div className="locked-header">
          <div className="vault-icon">🔒</div>
          <h1>VaultNote</h1>
          <p>{vaultExists ? t('vault_locked_desc') : t('vault_not_found')}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!vaultExists ? (
          <form onSubmit={handleCreateVault} className="locked-form">
            <div className="warning-box">
              ⚠️ <strong>{vaultExists ? '' : '⚠️ '}</strong> {t('vault_not_found_desc')}
            </div>
            
            <input
              type="password"
              placeholder={t('master_password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            
            <input
              type="password"
              placeholder={t('confirm_password_label')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? '...' : t('create_vault_btn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlockVault} className="locked-form">
            <input
              type="password"
              placeholder={t('master_password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? '...' : t('unlock_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
