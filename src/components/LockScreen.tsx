import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLanguage } from '../i18n';
import './LockScreen.css';
import { Lock } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [vaultExists, setVaultExists] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
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
      setError('Error al verificar la bóveda: ' + e);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('password_match_error') || 'Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError(t('password_length_error') || 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await invoke('create_vault', { password });
      onUnlock();
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError('');

    try {
      await invoke('unlock_vault', { password });
      onUnlock();
    } catch (err: any) {
      console.error(err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="lock-screen-overlay"><div className="lock-screen-card glass-panel">{t('saving_status')}</div></div>;
  }

  return (
    <div className="lock-screen-overlay">
      <div className="lock-screen-card glass-panel">
        <Lock size={48} className="lock-icon" />
        <h2>{vaultExists ? t('vault_locked') : t('lock_screen_create_vault')}</h2>
        <p>{vaultExists ? t('vault_locked_desc') : t('vault_not_found_desc')}</p>
        
        {vaultExists ? (
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              className="master-password-input"
              placeholder={t('master_password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary unlock-btn" disabled={isLoading}>
              {isLoading ? '...' : t('unlock_btn')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateVault}>
            <input
              type="password"
              className="master-password-input"
              placeholder={t('master_password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              disabled={isLoading}
            />
            <input
              type="password"
              className="master-password-input"
              placeholder={t('lock_screen_confirm_password')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary unlock-btn" disabled={isLoading}>
              {isLoading ? '...' : t('create_vault_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
