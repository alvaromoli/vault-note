import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  Trash2, RotateCcw, FileText, Folder, Shield, Trash, CheckSquare 
} from 'lucide-react';
import { useLanguage } from '../i18n';
import './TrashView.css';

interface TrashedItem {
  id: string;
  type: string;
  payload: string;
}

interface TrashViewProps {
  searchQuery?: string;
  onShowConfirm: (title: string, message: string, onConfirm: () => void, type?: 'confirm' | 'danger') => void;
}

export function TrashView({ searchQuery = '', onShowConfirm }: TrashViewProps) {
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
    onShowConfirm(
      'Eliminar permanentemente',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      async () => {
        try {
          await invoke('delete_item', { id });
          setItems(items.filter(i => i.id !== id));
        } catch (e) {
          console.error('Error deleting item permanently', e);
        }
      },
      'danger'
    );
  };

  const getItemTitle = (item: TrashedItem) => {
    try {
      const data = JSON.parse(item.payload);
      return data.title || data.name || data.serviceName || item.id;
    } catch {
      return item.id;
    }
  };

  const getItemIcon = (type: string) => {
    switch(type) {
      case 'book': return <Folder size={20} />;
      case 'credential': return <Shield size={20} />;
      case 'task': return <CheckSquare size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const handleEmptyTrash = async () => {
    if (items.length === 0) return;
    
    onShowConfirm(
      'Vaciar papelera',
      '¿Estás seguro de que quieres eliminar TODOS los elementos permanentemente?',
      async () => {
        try {
          for (const item of items) {
            await invoke('delete_item', { id: item.id });
          }
          setItems([]);
        } catch (e) {
          console.error('Error emptying trash', e);
        }
      },
      'danger'
    );
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => getItemTitle(item).toLowerCase().includes(q));
  }, [items, searchQuery]);

  return (
    <div className="trash-view animate-fade-in">
      <div className="trash-header-toolbar">
        <div className="header-title">
          <Trash2 size={24} className="title-icon" />
          <h1>{t('trash_title')}</h1>
          <span className="item-count">{filteredItems.length} {t('sidebar_tasks')}</span>
        </div>
        <button 
          className="btn-danger-outline empty-trash-btn" 
          onClick={handleEmptyTrash}
          disabled={items.length === 0}
        >
          <Trash size={16} /> Vaciar Papelera
        </button>
      </div>

      <div className="trash-container">
        {filteredItems.length === 0 ? (
          <div className="trash-empty-state">
            <Trash2 size={64} />
            <p>{t('trash_empty')}</p>
          </div>
        ) : (
          <div className="trash-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="trash-card glass-panel">
                <div className="card-icon">
                  {getItemIcon(item.type)}
                </div>
                <div className="card-content">
                  <span className="card-title">{getItemTitle(item)}</span>
                  <span className="card-type">{item.type}</span>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleRestore(item.id)} 
                    className="icon-btn-action" 
                    title={t('restore_btn')}
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeletePermanent(item.id)} 
                    className="icon-btn-action danger" 
                    title={t('delete')}
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
