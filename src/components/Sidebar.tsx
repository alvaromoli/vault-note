import { useMemo } from 'react';
import { useLanguage } from '../i18n';
import type { Book as BookType } from '../types';
import { 
  FileText, Star, Pin, CheckSquare, Inbox, Shield, Trash2, 
  Folder, Plus, Tag as TagIcon
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  books: BookType[];
  selectedBook: BookType | null;
  onSelectBook: (book: BookType | null) => void;
  onCreateBook: () => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  isOpen: boolean;
  notes: any[];
  tasks: any[];
  secrets: any[];
}

export function Sidebar({
  books,
  selectedBook,
  onSelectBook,
  onCreateBook,
  selectedFilter,
  onSelectFilter,
  selectedTag,
  onSelectTag,
  isOpen,
  notes,
  tasks,
  secrets
}: SidebarProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const filters = [
    { id: 'all', icon: <FileText size={18} />, label: t('sidebar_all_notes') },
    { id: 'favorites', icon: <Star size={18} />, label: t('sidebar_favorites') },
    { id: 'pinned', icon: <Pin size={18} />, label: t('sidebar_pinned') },
    { id: 'tasks', icon: <CheckSquare size={18} />, label: t('sidebar_tasks') },
    { id: 'uncategorized', icon: <Inbox size={18} />, label: t('sidebar_uncategorized') },
  ];

  const quickAccess = [
    { id: 'secrets', icon: <Shield size={18} />, label: t('sidebar_secrets') },
    { id: 'trash', icon: <Trash2 size={18} />, label: t('sidebar_trash') },
  ];

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    (notes || []).forEach(n => n?.tags?.forEach((t: string) => t && tags.add(t)));
    (tasks || []).forEach(task => task?.tags?.forEach((t: string) => t && tags.add(t)));
    (secrets || []).forEach(s => s?.tags?.forEach((t: string) => t && tags.add(t)));
    return Array.from(tags).sort();
  }, [notes, tasks, secrets]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="brand-name">VaultNote</h2>
      </div>

      <div className="sidebar-scrollable">
        <div className="sidebar-section">
          {filters.map(filter => (
            <div 
              key={filter.id}
              className={`sidebar-item ${selectedFilter === filter.id && !selectedBook ? 'active' : ''}`}
              onClick={() => onSelectFilter(filter.id)}
            >
              <span className="sidebar-icon">{filter.icon}</span>
              <span className="sidebar-label">{filter.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3>{t('sidebar_notebooks')}</h3>
            <button className="icon-btn-small" onClick={onCreateBook}>
              <Plus size={16} />
            </button>
          </div>
          {books.map(b => (
            <div 
              key={b.id} 
              className={`sidebar-item ${selectedBook?.id === b.id ? 'active' : ''}`}
              onClick={() => onSelectBook(b)}
            >
              <span className="sidebar-icon"><Folder size={18} /></span>
              <span className="sidebar-label">{b.title}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3>{t('sidebar_quick_access')}</h3>
          </div>
          {quickAccess.map(item => (
            <div 
              key={item.id}
              className={`sidebar-item ${selectedFilter === item.id && !selectedBook ? 'active' : ''}`}
              onClick={() => onSelectFilter(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3>TAGS</h3>
          </div>
          {allTags.length === 0 ? (
            <div className="empty-tags-msg" style={{padding: '0 8px', fontSize: '12px', color: 'var(--text-h)'}}>Sin etiquetas</div>
          ) : (
            <div className="tag-cloud" style={{display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 8px'}}>
              {allTags.map(tag => (
                <div 
                  key={tag}
                  className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => onSelectTag(tag)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: selectedTag === tag ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: selectedTag === tag ? 'white' : 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  #{tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
