import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n';
import { 
  Menu, Search, Plus, Lock, Settings, ChevronLeft, ChevronRight, 
  RefreshCw, ChevronDown, FileText, CheckSquare, Shield, Pin 
} from 'lucide-react';
import './TopBar.css';

interface TopBarProps {
  onMenuToggle: () => void;
  onLockVault: () => void;
  onSettingsClick: () => void;
  onSecretsClick: () => void;
  onNewNote: (type?: 'note' | 'task') => void;
  onNavigate: (filter: string, bookId?: string, itemId?: string) => void;
  notes: any[];
  secrets: any[];
  tasks: any[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
}

export function TopBar({ 
  onMenuToggle, 
  onLockVault, 
  onSettingsClick, 
  onSecretsClick,
  onNewNote,
  onNavigate,
  notes,
  secrets,
  tasks
}: TopBarProps) {
  const { t } = useLanguage();
  const [localQuery, setLocalQuery] = useState('');
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchResults = useMemo(() => {
    if (!localQuery || localQuery.length < 2) return null;
    const q = localQuery.toLowerCase();
    
    const filteredNotes = (notes || []).filter(n => 
      (n?.title?.toLowerCase() || '').includes(q) || 
      (n?.content?.toLowerCase() || '').includes(q)
    ).slice(0, 5);

    const filteredSecrets = (secrets || []).filter(s => 
      (s?.name?.toLowerCase() || '').includes(q) || 
      (s?.username?.toLowerCase() || '').includes(q)
    ).slice(0, 5);

    const filteredTasks = (tasks || []).filter(t => 
      (t?.title?.toLowerCase() || '').includes(q)
    ).slice(0, 5);

    // Extract tags
    const allTags = new Set<string>();
    (notes || []).forEach(n => n?.tags?.forEach((tag: string) => {
      if (tag && tag.toLowerCase().includes(q)) allTags.add(tag);
    }));
    (tasks || []).forEach(t => t?.tags?.forEach((tag: string) => {
      if (tag && tag.toLowerCase().includes(q)) allTags.add(tag);
    }));
    const filteredTags = Array.from(allTags).slice(0, 5);

    if (filteredNotes.length === 0 && filteredSecrets.length === 0 && filteredTasks.length === 0 && filteredTags.length === 0) return null;

    return { notes: filteredNotes, secrets: filteredSecrets, tasks: filteredTasks, tags: filteredTags };
  }, [localQuery, notes, secrets, tasks]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button 
          className="icon-btn" 
          onClick={onMenuToggle}
          title="Menu"
        >
          <Menu size={20} />
        </button>
        
        <button className="icon-btn disabled-btn" title="Back">
          <ChevronLeft size={20} />
        </button>
        <button className="icon-btn disabled-btn" title="Forward">
          <ChevronRight size={20} />
        </button>
        <button className="icon-btn" onClick={() => window.location.reload()} title="Refresh">
          <RefreshCw size={18} />
        </button>

        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={t('topbar_search_all')} 
            className="search-input"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />

          {showResults && searchResults && (
            <div className="search-results-dropdown glass-panel animate-fade-in">
              {searchResults.tags.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">TAGS</div>
                  {searchResults.tags.map(tag => (
                    <div key={tag} className="search-result-item" onClick={() => { onNavigate('all', undefined, undefined); setShowResults(false); setLocalQuery(''); }}>
                      <Pin size={14} /> <span>{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.notes.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">{t('notes_title').toUpperCase()}</div>
                  {searchResults.notes.map(note => (
                    <div key={note.id} className="search-result-item" onClick={() => { onNavigate('all', note.bookId, note.id); setShowResults(false); setLocalQuery(''); }}>
                      <FileText size={14} /> <span>{note.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.tasks.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">{t('sidebar_tasks').toUpperCase()}</div>
                  {searchResults.tasks.map(task => (
                    <div key={task.id} className="search-result-item" onClick={() => { onNavigate('tasks', undefined, task.id); setShowResults(false); setLocalQuery(''); }}>
                      <CheckSquare size={14} /> <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.secrets.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">{t('sidebar_secrets').toUpperCase()}</div>
                  {searchResults.secrets.map(secret => (
                    <div key={secret.id} className="search-result-item" onClick={() => { onNavigate('secrets', undefined, secret.id); setShowResults(false); setLocalQuery(''); }}>
                      <Shield size={14} /> <span>{secret.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="topbar-center">
        {/* Context placeholder */}
      </div>

      <div className="topbar-right">
        <div className="new-note-dropdown-container">
          <button className="btn-primary new-note-btn" onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}>
            <Plus size={16} />
            <span>Nueva</span>
            <ChevronDown size={14} />
          </button>
          
          {isNewMenuOpen && (
            <div className="new-note-dropdown glass-panel animate-fade-in">
              <button onClick={() => { onNewNote('note'); setIsNewMenuOpen(false); }}>
                <FileText size={16} /> {t('new_note_default_title')}
              </button>
              <button onClick={() => { onNewNote('task'); setIsNewMenuOpen(false); }}>
                <CheckSquare size={16} /> {t('sidebar_tasks')}
              </button>
              <button onClick={() => { onSecretsClick(); setIsNewMenuOpen(false); }}>
                <Shield size={16} /> {t('sidebar_secrets')}
              </button>
            </div>
          )}
        </div>

        <div className="divider" />
        <button className="icon-btn" onClick={onSettingsClick} title={t('sidebar_settings') || 'Settings'}>
          <Settings size={20} />
        </button>
        <button className="icon-btn danger-icon" onClick={onLockVault} title={t('lock_vault_tooltip') || 'Lock Vault'}>
          <Lock size={20} />
        </button>
      </div>
    </div>
  );
}
