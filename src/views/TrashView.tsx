import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useLanguage } from '../i18n';
import './TrashView.css';

interface TrashedItem {
  id: string;
  type: string;
  payload: string;
}

export function TrashView() {
  const [items, setItems] = useState<TrashedItem[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    loadTrashedItems();
  }, []);

  const loadTrashedItems = async () => {
    try {
      const result: [string, string, string][] = await invoke('get_trashed_items');
      const loaded = result.map(([id, type, jsonStr]) => ({
        id,
        type,
        payload: jsonStr
      }));
      setItems(loaded);
    } catch (e) {
      console.error('Error loading trashed items', e);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await invoke('restore_item', { id });
      setItems(items.filter(i => i.id !== id));
      alert(t('item_restored'));
    } catch (e) {
      console.error('Error restoring item', e);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (!confirm(t('confirm_delete_perm'))) return;
    try {
      await invoke('delete_item', { id });
      setItems(items.filter(i => i.id !== id));
    } catch (e) {
      console.error('Error deleting item permanently', e);
    }
  };

  const getItemTitle = (item: TrashedItem) => {
    try {
      const data = JSON.parse(item.payload);
      return data.title || data.serviceName || item.id;
    } catch {
      return item.id;
    }
  };

  return (
    <div className="trash-view animate-fade-in">
      <div className="trash-header glass-panel">
        <h1>{t('trash_title')}</h1>
      </div>

      <div className="trash-list glass-panel">
        {items.length === 0 ? (
          <p className="empty-msg">{t('trash_empty')}</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="trash-item">
              <div className="item-info">
                <span className="item-type-icon">
                  {item.type === 'book' ? '📚' : item.type === 'note' ? '📝' : '🔑'}
                </span>
                <span className="item-title">{getItemTitle(item)}</span>
                <span className="item-type-label">({item.type})</span>
              </div>
              <div className="trash-actions">
                <button onClick={() => handleRestore(item.id)} className="btn-restore">{t('restore_btn')}</button>
                <button onClick={() => handleDeletePermanent(item.id)} className="btn-danger">{t('delete')}</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
